import NativeSupportApi from "sinosun-ui/lib/support/native/NativeSuportApi.js";
import { getStorage, decodeToken, deleteStorage } from '../..//utils/commonUtil'
import keycloakConfig from '@/thirdparty/keycloak.json';

class BPlusToken {
    // private idToken: string = '';
    // private exchangeTokenCount: number = 0;
    // private loginJsonConfig: any = null;
    // private userKeycloak: any = null
    constructor() {
        this.idToken = "";
        this.exchangeTokenCount = 0;
        this.loginJsonConfig = null;
        this.userKeycloak = null
    }
    /**
     * 用户是否已登陆
     */
    isTokenExist(key) {
        try {

            //此时还在unauthorized流程中，故直接组装primaryKey，如果能拿到token，说明url上有用户参数，且用户已登录
            let tokenParsed = getStorage(`${key}_token`);
            let access_token = tokenParsed ? decodeToken(JSON.parse(tokenParsed)['access_token']) : null;
            if (!!access_token && !this.isTokenExpired(access_token)) {
                //既然已登录，就实例化keycloak对象，并将tokenParsed存进去，供后面的逻辑使用（这块实现逻辑不清晰，需要优化）
                this.userKeycloak = new Keycloak('../thirdparty/keycloak.json');
                this.userKeycloak.tokenParsed = access_token;
                return true;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    /**
    * 使用外界的token交换获取本系统用户的token
    */
    async getUserToken(key) {
        return new Promise(async (resolve) => {
            //ascess-token存在
            if (this.isTokenExist(key)) {
                resolve()
            } else {
                //ascess-token不存在
                //保证idToken是最新的，过期了需要重新获取
                if (!this.idToken || this.isTokenExpired(decodeToken(this.idToken))) {
                    await this.getNewIdToken();
                }
                this.channelId = await this.getChannelId();
                this.exchangeTokenCount++;
                resolve(this.getLoginToken({
                    onLoad: 'exchange-token',
                    token: this.idToken,
                    subjectIssuer: this.channelId,
                    tokenStoreScope: 'local',
                    kcType: 'token',
                    cacheKeyPre: key,//登陆前是null，因此需要重新登陆；登陆后有值，因此直接从缓存获取token
                    tokenType: 'urn:ietf:params:oauth:token-type:jwt',
                    clientSecretBase64: null, //静态资源保护
                    autoUpdateToken: true,
                }));
            }
        })

    }


    /**
     * 加载keycloak配置
     * 此配置是公共配置，只包含了realm和keycloak server的url
     */
    getLoginJsonConfig() {
        let that = this;
        if (that.loginJsonConfig) {
            return;
        }
        that.loginJsonConfig = {
            url: keycloakConfig['auth-server-url'],
            realm: keycloakConfig['realm'],
            clientId: keycloakConfig['resource']
        }
    }

    /**
     * 用户登录【核心】方法
     * @param {*} option 登陆参数
     */
    async getLoginToken(option) {
        let that = this;
        await that.getLoginJsonConfig();
        // that.loginJsonConfig.clientId = 'mall_H5';//添加clientId
        let keycloak = that.userKeycloak || new Keycloak(that.loginJsonConfig);
        async function retry(resolve, reject) {
            if (keycloak.tokenParsed) {
                deleteStorage(`${keycloak.tokenParsed.sub || null}_${keycloak.tokenParsed.companyId || null}_${keycloak.tokenParsed.channelId || null}_token`);//失败的话就清除缓存
            }
            //最多exchange两次，防止无限循环
            if (that.exchangeTokenCount < 2) {
                await that.getUserToken();
                resolve();
            } else {
                that.exchangeTokenCount = 0;//重置，使之下次仍可授权，否则会无法再授权
                //如果exchagne两次都没成功，就直接reject，用访客登陆
                reject('exchange twice failed');
            }
        }
        //keycloak有bug，用户第一次exchange时，无法同步用户基础信息（即没有companyId和channelId）
        function firstExchangeFailed() {
            return !that.userKeycloak.tokenParsed.companyId || !that.userKeycloak.tokenParsed.channelId;
        }
        //授权成功的回调
        function success() {
            that.userKeycloak = Object.assign({}, that.userKeycloak, keycloak);
        }
        return new Promise(async (resolve, reject) => {
            try {
                //刷新和登陆
                keycloak.onAuthRefreshSuccess = () => {
                    success()
                    resolve();
                }
                keycloak.onAuthRefreshError = () => {
                    this.getUserToken();
                }
                keycloak.onAuthSuccess = () => {
                    success();
                    resolve();
                    //keycloak有bug，用户第一次exchange时，无法同步用户基础信息（即没有companyId和channelId），此时授权未完成
                    if (firstExchangeFailed()) {
                        return;
                    }
                }
                await keycloak.init(option);
                //keycloak有bug，用户第一次exchange时，无法同步用户基础信息（即没有companyId和channelId），此时需要再exchange一次
                if (firstExchangeFailed() || !keycloak.token) {
                    try {
                        await retry(resolve, reject);
                    } catch (e) {
                        console.error(e);
                        reject()
                    }
                    return;
                }
            } catch (e) {
                retry(resolve, reject).then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
                console.error(e);
            }
        })
    }

    /**
    * 从app重新获取最新idToken
    */
    async getNewIdToken() {
        try {
            let data = await NativeSupportApi.getIdToken();
            this.idToken = data ? data.idToken : null;
            if (!this.idToken) {
                console.error('no idToken from app!')
            }
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * token是否过期
     */
    isTokenExpired(token, minValidity = 0) {
        var expiresIn = token['exp'] - Math.ceil(new Date().getTime() / 1000);
        if (minValidity) {
            if (isNaN(minValidity)) {
                throw 'Invalid minValidity';
            }
            expiresIn -= minValidity;
        }
        return expiresIn < 0;
    }


    /**
     * 获取渠道id
     */
    async getChannelId() {
        try {
            let data = await NativeSupportApi.getAppConfig({ key: 'tid' });
            return data && data.value;
        } catch (e) {
            console.error(e);
        }
    }

}

export default new BPlusToken()