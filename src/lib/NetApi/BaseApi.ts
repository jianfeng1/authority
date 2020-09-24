/**
 * @author miaoju
 * !!! 里面部分方法需要子类api继承实现, @abstract 为可选重写，@virtual 为子类必须要重写实现的 !!!
 * 客户端请求api基础类
 * 1、网络检查
 * 2、用户信息header拼装
 * 3、提供doGet、doPost接口
 * 4、对于服务器返回结果resultCode，进行通用的错误码处理，具体的业务错误码在子类里面按业务处理
 */

import api from './Net';
import BaseResponse from './BaseResponse'
import NativeSupportApi from 'sinosun-ui/lib/support/native/NativeSuportApi'
import CommErrorCode, { getCommErrorDesc } from './CommErrorCode'
import StringUtils from '../../utils/StringUtils'
import { GetAccessTokenFunction } from "../../lib/common/SnJsBridge.js";
import { SnToast } from "sinosun-ui";
import { getStorage, setStorage } from '../../utils/commonUtil.js'
import { isSuccess } from 'sinosun-ui/lib/support/request/request.js';

/**
 * 枚举请求方法
 */
enum REQUEST_METHOD {
    GET = 'GET',
    POST = 'POST'
}

class BaseApi {
    constructor() {

    }

    /**
     * get请求
     * @param {*} url 请求相对地址，可以不要域名、端口
     * @param {*} params
     * @param {*} needLogin
     * @param {*} withAuth 是否校验token，默认需要校验
     */
    doGet(url: string, params: object, needLogin: boolean = true, withAuth: boolean = true): Promise<BaseResponse> {
        return this.doRequest(url, params, needLogin, REQUEST_METHOD.GET, withAuth);
    }

    /**
     * post 请求
     * @param {*} url  请求相对地址，可以不要域名、端口
     * @param {*} params
     * @param {*} needLogin
     */
    doPost(url: string, params: object, needLogin: boolean = true, withAuth: boolean = true): Promise<BaseResponse> {
        return this.doRequest(url, params, needLogin, REQUEST_METHOD.POST, withAuth);
    }

    /**
     * 处理服务器响应结果, 主要是处理错误码提示
     * @param {} result
     */
    handleResult(result, showBisError = true) {
        console.log('handleResult == ', result);
        // 如果code非0，表示业务失败，转换错误提示，并根据调用者showError决定是否自动提示toast
        if (!isSuccess(result)) {
            let localDesc = '';
            // emsg 为服务器接口返回的可直接展示用户的 msg描述, 如果不为空，优先展示emsg，否则从本地取desc
            if (result.emsg) {
                localDesc = result.emsg;
            } else {
                // result.desc = transferErrorDesc(result);
                localDesc = result.desc;
            }
            // 错误描述追加显示 ecode， 如： '账号不存在[21111003]'
            if (result.ecode) {
                localDesc += ('[' + result.ecode + ']');
            }
            if (showBisError) {
                // showToast(localDesc);
            }
            // 本地拼接的用于显示给用户的edesc：'账号不存在[21111003]'， 如果界面需要自己提示toast，可以用这个edesc字段
            result.edesc = localDesc;
        }
        return result;
    }
    /**
     * 发送请求
     * @param {*} url  请求相对地址，可以不要域名、端口
     * @param {*} params
     * @param {*} header
     * @param {*} method
     */
    doRequest(url: string, params: object, needLogin: boolean = true, method: string, withAuth: boolean = true): Promise<BaseResponse> {

        // 把url、params放在response里面带回给界面调用处，可能会有用处
        const reqToResponse = {
            url,
            reqParams: params
        }

        let tokenKey = '';
        let channelId = '';

        return new Promise((res, rej) => {
            // CheckNetWorkFunction().then(data=>{
            if (navigator.onLine) {
                // 不管网络层返回的正常还是异常，在这里统一转换成 {@link BaseResponse} 对象抛给上层处理
                if (withAuth) {
                    NativeSupportApi.checkNetWork().
                        then(() => {
                            return this.getTokenkey();
                        }).then(res => {
                            tokenKey = res.tokenKey;    // UAId_cpyId_channelId
                            channelId = res.channelId;
                            // return BplusToken.getUserToken(tokenKey);
                        }).then(res => {
                            const header = this.dealRequestHeader(needLogin, tokenKey, channelId);
                            return this.apiRequest(url, params, header, method);
                        }).then(result => {
                            // 网络请求成功
                            (result as BaseResponse).request = reqToResponse;
                            const baseResponse = this.dealResponse(result);
                            res(baseResponse);
                        }).catch(error => {
                            // 网络请求失败
                            this.dealRequestError(error);
                            let result = error;
                            if (error) {    // error 可能出现 undefined 的情况（如函数执行中出错了）
                                result = Object.assign(error, reqToResponse);
                            }
                            const baseResponse = this.dealRequestException(result);
                            rej(baseResponse);
                        });
                } else {    // 不需要进行 token 验证
                    this.apiRequest(url, params, {}, method).then(result => {
                        // 网络请求成功
                        (result as BaseResponse).request = reqToResponse;
                        const baseResponse = this.dealResponse(result);
                        res(baseResponse);
                    }).catch(error => {
                        // 网络请求失败
                        this.dealRequestError(error);
                        let result = error;
                        if (error) {    // error 可能出现 undefined 的情况（如函数执行中出错了）
                            result = Object.assign(error, reqToResponse);
                        }
                        const baseResponse = this.dealRequestException(result);
                        rej(baseResponse);
                    });
                }
            } else {
                const errInfo = {
                    msg: '网络连接不可用',
                    resultCode: -1000,
                };
                rej(errInfo)
            }
            // })
        })
    }

    /**
     * 根据返回的数据 进行单独分析处理（这里设值注入，没有匹配到则不做处理）
     * @param error 返回的错误信息数据
     */
    dealRequestError(error) { }

    /**
     * 获取用户信息
     */
    async getUserInfo() {
        try {
            const data = await NativeSupportApi.getCurrentUserInfo();
            return data;
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 获取AccessToken信息
     * force (如果为false 表示直接从app本地缓存取，如果为true 表示从服务器获取最新token)
     */
    async GetAccessTokenFunction(force: boolean = false) {
        try {
            const data = await GetAccessTokenFunction(force);
            return data;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * 获取渠道id
     */
    async getChannelId() {
        try {
            const data = await NativeSupportApi.getAppConfig({ key: 'tid' });
            return data && data.value
        } catch (e) {
            console.log(e);
        }
    }

    async getTokenkey() {
        try {
            const userInfo = await this.getUserInfo();
            const channelId = await this.getChannelId();
            const token = await this.GetAccessTokenFunction();
            const res = { tokenKey: '', channelId: '' };
            res.tokenKey = `${userInfo.UAId}_${userInfo.cpyId}_${channelId}`;
            res.channelId = channelId;
            setStorage(
                `${userInfo.UAId}_${userInfo.cpyId}_${channelId}_token`,
                JSON.stringify(token)
            );
            return res;
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * api网络请求,默认是走网络请求
     * @abstract 子类可以继承重写该方法来返回本地假数据用来模拟自测
     * @param url
     * @param params
     * @param header
     * @param method
     */
    apiRequest(url: string, params: object, header: object, method: string): Promise<object> {
        return api.doRequest(url, params, header, method);
    }

    /**
     * 处理通用的 header，目前主要跟用户认证相关的
     * @param needLogin
     */
    dealRequestHeader(needLogin: boolean = true, tokenKey: string, channelId: string): object {
        const token = getStorage(`${tokenKey}_token`);
        let header = {};
        const tokenObj = JSON.parse(token);
        header = {
            Authorization: token && `Bearer ${tokenObj.accessToken}`,
        }
        if (channelId) {
            header[`channelId`] = channelId
        }
        return header;
    }

    /**
     * 处理服务器返回结果,只处理通用的业务错误码
     * @param result
     */
    dealResponse(result: object): BaseResponse {
        const bRes = new BaseResponse((result as any).resultCode);
        // 如果业务不成功，在这里进行一次通用错误码转换
        if (!bRes.isSuccess()) {
            bRes.resultMessage = (result as any).resultMessage;
            bRes.resultDesc = this.transferErrorCode(bRes.resultCode);
            SnToast(bRes.resultDesc);
        }
        // 业务成功， 把result数据结果放进去
        else {
            bRes.result = this.tranferResultModel(result);
        }
        return bRes;
    }

    /**
     * 把网络层的错误信息也转换成BaseResponse，然后抛给上层
     * @param error
     */
    dealRequestException(error): BaseResponse {
        // TODO 根据error来设置errorCode，以及 resultDesc
        let errorCode = 0;
        if (!error) {   // error 为 undefined 或其他不明情况
            errorCode = CommErrorCode.UNKNOWN_ERROR;
        } else {
            errorCode = error.localErrorCode ? error.localErrorCode : CommErrorCode.UNKNOWN_ERROR;
        }
        let errRes = new BaseResponse(errorCode);
        // 把异常信息通过 error字段带到上层去
        errRes = Object.assign(errRes, { error });
        errRes.resultDesc = this.transferErrorCode(errRes.resultCode);
        this.log('dealRequestException - e : ' + JSON.stringify(errRes));
        return errRes;
    }

    // ---------- 错误码处理 start ---------------------------------------------------------------------//
    transferErrorCode(resultCode: number): string {
        // 1、先处理通用错误码，如果返回空，可能是业务错误码，进入 2
        let msg = this.transferCommErrorCode(resultCode);
        if (StringUtils.isEmptyStr(msg)) {
            // 2、处理业务错误码
            msg = this.transferBisErrorCode(resultCode);
        }
        // 3、通用、业务错误码都没有查询到，就给默认异常提示
        if (StringUtils.isEmptyStr(msg)) {
            msg = this.transferDefaultExceptionDesc();
        }
        return msg;
    }

    /**
     * BaseApi这一层只处理跟网络、用户授权等相关的最基础错误码转换，具体的业务错误码在子类的api里面去转换
     * @param resultCode
     * @abstract 子类可重写
     */
    transferCommErrorCode(resultCode: number): string {
        return getCommErrorDesc(resultCode);
    }

    /**
     * 处理业务错误码
     * @virtual BaseApi中这是一个抽象方法，由子类具体的业务api去实现自己的业务错误码
     * @param resultCode
     */
    transferBisErrorCode(resultCode: number): string {
        return '';
    }

    /**
     * 返回默认的错误提示
     * @abstract 子类Api可以重写, 如果通用、业务错误码都没找到，就用这个
     */
    transferDefaultExceptionDesc(): string {
        return '请求异常，请稍后重试!';
    }
    // ---------- 错误码处理 end ---------------------------------------------------------------------//

    /**
     * 转换成本地业务api的model
     * @virtual 具体的转换在子类继承去处理，这里默认只是把result对象塞进去
     * !!! 原则是只要response含有业务数据对象，就应该进行本地model映射 !!!
     */
    tranferResultModel(result: object): object {
        return (result as any).result;
    }

    /**
     * 转换成完整路径URL
     * @param url
     */
    getFullUrl(url: string): string {
        if (!(url.startsWith('https://') || url.startsWith('http://'))) {
            url = location.origin + (url.startsWith('/') ? '' : '/') + url;
        }
        return url;
    }

    /**
     * 打印日志
     * @param msg
     */
    log(msg: string): void {
        console.log('Api - ' + msg);
    }
}

export default BaseApi;