<template>
    <div>
        <SnLoading :spinning="loading" :turn="loading" size="small" tip="正在加载"/>
        <div class="topTipsWrap" v-if="tipsShow">
            <span class="topTips">企业最高管理者拥有所有权限</span>
        </div>
        <div :class="{mt50:!view,imgFlx:!loading && 0 == authUserList.length,tipsShowStyle:tipsShow}">
            <div class="contentWrap">
                <div class="cardWrap">
                    <SnEmpty
                        v-if="!loading && 0 == authUserList.length"
                        image="../resource/img/noInfo.png"
                        desc="该权限暂无人员"
                    />
                    <div class="cardLineWrap borderB" v-for="(item,index) in authUserList" @click.stop="gotoUserDetail(item)" :key="index">
                        <SnAvatar class="cardIcon"  :uaid = item.memberId></SnAvatar>
                        <div class="textWrap" :class="{noRight:view}">
                            <div class="textName">{{item.uName}}</div>
                            <div class="date in" v-if="1==item.authValidity">永久有效</div>
                            <div class="date" :class="authDateStyleMap[item.authValidityType]" v-else-if="2==item.authValidity">{{authDateTypeMap[item.authValidityType]+'：'+new Date(item.beginTime*1000).format('yyyy-MM-dd')+' - '+new Date(item.endTime*1000).format('yyyy-MM-dd')}}</div>																										
                        </div>
                    </div>
                    
                </div>
            </div>	
        </div>	
        <div class="submitButWrap" v-if="!view">
            <SnButton  @click="adduser" type="primary">添加人员</SnButton>
        </div>
    </div>		
</template>

<script>
import {
    notifyAppBackEvent,
    OpenActionFunction,
    QueryUserInfoFunction,
} from "../../../../lib/common/SnJsBridge.js";
import {
    registerHandler,
    PromiseJSBridgeReady,
    GetUserInfoFunction,
} from "sinosun-ui/lib/support/native/JSBridge";
import {
    throttle,
    initTitleMenu,
    setStorage,
    getStorage,
    showConfirm,
    sortUserListByName,
} from "../../../../utils/commonUtil";
import SnAvatar from "../components/SnAvatar/SnAvatar.vue";
import { SnButton, SnEmpty, SnToast, SnLoading } from "sinosun-ui";
import authDateTypeMap from "@/model/AuthDateType";
import authDateStyleMap from "@/model/AuthDateStyle";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        SnButton,
        SnAvatar,
        SnEmpty,
        SnLoading,
    },
    data() {
        return {
            loading: true, //数据加载中
            userInfo: {}, //用户信息
            ddsauthDetail: {}, //安全硬件权限信息
            view: false, //是否只展示信息，不可编辑
            userIdList: [], //已经拥有权限的人员ID列表，新增人员时，需要屏蔽这部分人员信息
            authUserList: [], //人员信息
            tipsShow: false,
            authDateTypeMap, //权限有效期状态
            authDateStyleMap, //权限有效期状态
        };
    },
    created() {
        let _this = this;
        if (getStorage("ddsauthDetail")) {
            _this.ddsauthDetail = JSON.parse(getStorage("ddsauthDetail"));
        }
        _this.view = _this.ddsauthDetail.view;
        if (
            _this.ddsauthDetail.bisCode &&
            _this.ddsauthDetail.bisCode == "2_-1_funMgr"
        ) {
            _this.tipsShow = true;
        }
        document.addEventListener("resume", function (event) {
            let refreshPage = (event.data && event.data.refreshPage) || false;
            if (refreshPage) {
                _this.initData();
            }
        });
        PromiseJSBridgeReady(function () {
            if (!window.AlipayJSBridge) {
                notifyAppBackEvent(); //调用app，通知返回事件
                registerHandler("notifyAppBack", function () {
                    //点击app返回事件
                    throttle(
                        function () {
                            _this.$router.push({
                                path: "authgroup",
                            });
                        }.bind(this)
                    );
                });
            }
        });
        if (getStorage("userInfo")) {
            _this.userInfo = JSON.parse(getStorage("userInfo"));
            _this.initData();
        } else {
            GetUserInfoFunction().then(function (Data) {
                if (Data) {
                    _this.userInfo = Data;
                    _this.initData();
                }
            });
        }
    },
    mounted() {
        let _this = this;
        if (window.AlipayJSBridge) {
            initTitleMenu([_this.ddsauthDetail.name]);
        } else {
            initTitleMenu([
                _this.ddsauthDetail.name,
                {
                    name: "刷新",
                    menuId: "but_2_0",
                    type: 2,
                    func: function () {
                        _this.initData();
                    },
                },
            ]);
        }
    },
    methods: {
        initData() {
            let _this = this;
            let Json = {
                perId: _this.ddsauthDetail.perId,
                companyId: _this.userInfo.cpyId,
            };
            authorityApi
                .listPermittedRoleAndUserByPerId(Json)
                .then(async function (result) {
                    _this.loading = false;
                    if (result && result.resultCode == 0) {
                        _this.authUserList = [];
                        if (
                            result.result.userList &&
                            result.result.userList.length
                        ) {
                            _this.authUserList = await _this.handleUserInfo(
                                result.result.userList
                            );
                        }
                    }
                });
        },

        //处理人员信息，先通过jsbridge接口获取人员姓名，根据人员姓名进行排序，然后再处理有效期
        handleUserInfo(userList = []) {
            let _this = this;
            userList.forEach((item) => {
                _this.userIdList.push(item.userId);
            });
            let userInfoParam = {
                cpyId: _this.userInfo.cpyId,
                uaid: _this.userIdList,
            };
            return new Promise((res) => {
                QueryUserInfoFunction(userInfoParam).then(function (Data) {
                    if (Data) {
                        let userInfoList = Data.userList;
                        userList.forEach((item) => {
                            userInfoList.forEach((userInfoItem) => {
                                if (userInfoItem.uaid == item.userId) {
                                    item.uName = userInfoItem.userName;
                                    item.name = userInfoItem.userName;
                                    item.status = userInfoItem.status;
                                }
                            });
                        });
                        userList = sortUserListByName(userList, false);
                        res(userList);
                    }
                });
            });
        },

        //增加人员
        adduser() {
            let _this = this;
            let userList = []; //增加的人员列表
            //增加权限人员时屏蔽企业最高管理员和已经增加的人员信息
            var selectUaIds = JSON.parse(JSON.stringify(_this.userIdList));
            selectUaIds.push(_this.userInfo.cpyCreatorId);
            //打开通讯录参数
            var selectJson = {
                action: "IntentAction_SelectContactWithOrgListActivity",
                dataList: [
                    { key: "from_key", value: 9, type: "int" },
                    { key: "select_model", value: "0", type: "string" },
                    {
                        key: "selected_list_tpay",
                        value: JSON.stringify(selectUaIds),
                        type: "string",
                    },
                    { key: "is_show_inactivated", value: true, type: "bool" },
                ],
                responseKeyList: [
                    { key: "addusers_tpay", value: "", type: "string" },
                ],
            };
            //调用app选择联系人窗口
            OpenActionFunction(selectJson).then(function (data) {
                let selectUser = JSON.parse(data[0].value);
                if (0 < selectUser.length) {
                    selectUser.forEach(function (item) {
                        let userInfoObj = {};
                        //增加权限人员时屏蔽企业最高管理员
                        if (item.bizMateId != _this.userInfo.cpyCreatorId) {
                            userInfoObj = {
                                userId: item.bizMateId,
                                companyId: _this.userInfo.cpyId,
                                state: "1",
                            };
                            userList.push(userInfoObj);
                        }
                    });
                    _this.modifyPermission(userList);
                }
            });
        },

        //添加权限人员信息
        modifyPermission(infoList = []) {
            let _this = this;
            _this.loading = false;
            let modifyParam = {
                perId: _this.ddsauthDetail.perId,
                companyId: _this.ddsauthDetail.companyId,
                resourceType: "data",
            };
            if (infoList.length > 0) {
                modifyParam.userList = infoList;
            }
            authorityApi.modifyPermission(modifyParam).then(function (result) {
                _this.loading = true;
                if (result && result.resultCode == 0) {
                    _this.initData();
                    SnToast("添加成功");
                } else {
                    SnToast(result.resultDesc);
                }
            });
        },

        //打开权限人员信息有效期编辑页面，安全硬件权限只有人员信息
        gotoUserDetail(item) {
            var _this = this;
            if (_this.view) {
                return;
            } else {
                _this.ddsauthDetail.userOrRoleObj = item;
                _this.ddsauthDetail.tabValue = "user";
                _this.ddsauthDetail.isFrom = "ddsauthDetail";
                setStorage("authDataObj", JSON.stringify(_this.ddsauthDetail));
                if (!window.AlipayJSBridge) {
                    _this.$router.push({ path: "authdate" });
                } else {
                    AlipayJSBridge.call("pushWindow", {
                        url: "appauthmgr.html#/authdate",
                    });
                }
            }
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";
.topTipsWrap {
    height: 0.7rem;
    line-height: 1rem;
    text-align: center;
    .topTips {
        font-size: 0.32rem;
        color: #999;
        padding-left: 0.42rem;
        background: url(../../../../assets/img/authority/icon_tips.png)
            no-repeat left;
        background-size: 0.32rem 0.32rem;
    }
}
.mt50 {
    margin-bottom: 0rem;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 1rem;
    overflow-y: auto;
    background-color: #fff;
    margin: 0 auto;
}
.tipsShowStyle {
    top: 1.9rem;
}

.contentWrap {
    .titleText {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        position: relative;
        padding: 0 0.3rem;
        font-size: 0.32rem;
        color: #999;
        height: 0.6rem;
        line-height: 0.62rem;
        background: @color-bgc;
    }
    .cardWrap {
        position: relative;
        padding-bottom: 0.3rem;
        color: #191919;
        .cardLineWrap {
            height: 1.28rem;
            padding: 0 0.3rem;
            background: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            .delbut {
                width: 0.28rem;
                height: 0.28rem;
                background: url(../../../../assets/img/authority/del.png)
                    no-repeat center;
                background-size: 0.28rem;
                border-radius: 0.03rem;
                margin-right: 0.3rem;
            }
            .cardIcon {
                width: 0.92rem;
                height: 0.92rem;
                background-repeat: no-repeat;
                background-position: center;
                background-size: 0.92rem;
                border-radius: 50%;
            }
            .textWrap {
                margin-left: 0.16rem;
                flex: 1;
                background: url(../../../../assets/img/authority/right.png)
                    no-repeat right 0rem center;
                background-size: 0.28rem;
                .textName {
                    max-width: 4.6rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-top: 0.12rem;
                    font-size: 0.32rem;
                }
                .date {
                    font-size: 0.28rem;
                }
                .beforeTime {
                    color: #999;
                }
                .in {
                    color: @colour-other-green;
                }
                .afterTime {
                    color: #999;
                }
            }
            .textWrap.noRight {
                background: none;
            }
        }
    }
}
.submitButWrap {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    justify-content: center;
    background-color: #fff;
    padding: 0.2rem 0.3rem;
    max-width: 1080px;
    margin: auto;
    .sn-button {
        margin: 0px auto;
        border: none;
    }
}
@media screen and (min-width: @pc-width) {
    .mt50 {
        margin-bottom: 0rem;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 50px;
        overflow-y: auto;
        background-color: #fff;
        margin: 0 auto;
        max-width: 1080px;
        // border-bottom: 1px solid @color-bgc;
    }
    .tipsShowStyle {
        top: 80px;
    }
    .line {
        display: flex;
        justify-content: space-around;
        border-bottom: 1px solid @color-bgc;
        height: 40px;
        vertical-align: top;
        line-height: 40px;
    }
    .contentWrap {
        .titleText {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            position: relative;
            padding: 0 15px;
            font-size: 16px;
            color: #999;
            height: 40px;
            line-height: initial;
            background: #fff;
        }
        .cardWrap {
            position: relative;
            padding-bottom: 15px;
            color: #191919;
            .cardLineWrap {
                cursor: pointer;
                height: 64px;
                padding: 0 15px;
                background: #fff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                .delbut {
                    width: 16px;
                    height: 16px;
                    background: url(../../../../assets/img/authority/del.png)
                        no-repeat center;
                    background-size: 16px;
                    border-radius: 2px;
                    margin-right: 14px;
                }
                .cardIcon {
                    width: 46px;
                    height: 46px;
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: 46px;
                    border-radius: 50%;
                }
                .textWrap {
                    margin-left: 8px;
                    flex: 1;
                    background: url(../../../../assets/img/authority/right.png)
                        no-repeat right 0px center;
                    background-size: 14px;
                    .textName {
                        max-width: 440px;
                        font-size: 14px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin-top: 6px;
                    }
                    .date {
                        max-width: 440px;
                        font-size: 12px;
                    }
                }
                .textWrap.noRight {
                    background: none;
                }
            }
        }
    }
    .submitButWrap {
        background: @color-bgc;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0;
    }

    .topTipsWrap {
        height: 36px;
        line-height: 49px;
        text-align: center;
        background: #fff;
        .topTips {
            font-size: 14px;
            color: #999;
            padding-left: 32px;
            background: url(../../../../assets/img/authority/icon_tips.png)
                no-repeat left 16px center;
            background-size: 14px;
        }
    }
    .titTips {
        position: relative;
    }
    .pcdisplay {
        display: none !important;
    }
}
.imgFlx {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

@media screen and (min-width: @screen-md-min) {
    .mt50 {
        padding: 0 50px;
    }
}
</style>

