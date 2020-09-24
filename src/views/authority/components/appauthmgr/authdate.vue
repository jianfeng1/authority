<template>
    <div class="authdatasbu">
        <div class="mt50">
            <div class="cardLineWrap">
                <div class="delbut" v-if="userCandel"></div>
                <SnAvatar class="cardIcon"  v-if="authDataObj.tabValue == 'user'" :uaid = authDataObj.userOrRoleObj.userId></SnAvatar>
                <div class="textWrap">
                    <div class="textName" v-if="authDataObj.tabValue == 'user'">{{authDataObj.userOrRoleObj.uName}}</div>
                    <div class="textName" v-if="authDataObj.tabValue == 'role'">{{authDataObj.userOrRoleObj.roleName}}</div>
                    <div class="date in" v-if="1==showAuthValidity">永久有效</div>
                    <div class="date" :class="authDateStyleMap[authDataObj.userOrRoleObj.authValidityType]" v-else-if="2==showAuthValidity">{{authDateTypeMap[authDataObj.userOrRoleObj.authValidityType]+'：'+new Date(authDataObj.userOrRoleObj.beginTime*1000).format('yyyy-MM-dd')+' - '+new Date(authDataObj.userOrRoleObj.endTime*1000).format('yyyy-MM-dd')}}</div>																										
                </div>
            </div>	 		
            <div class="topTipsWrap">设置权限有效期</div>	 		
            <div class="contentWrap">		 			
                <div class="lineWrap">
                    <div class="line" v-for="(item,index) in radioList" @click="changeCheck(item)" :key="index">
                        <div class="linetext" :class="{checked:item.id==authValidity}">{{item.text}}</div>
                    </div>
                </div> 	
                
                <div v-if="2==authValidity" class="content">
                    <SnWhiteSpace />
                        <SnListItem title="有效期" class="authSnList">
                        <SnRangePicker v-model="timeJson" />
                    </SnListItem>
                </div>
                
            </div>		 	
            <div class="delbut" @click="modifyAuth('del')" v-if="authDataObj.tabValue == 'user'">删除该人员</div>
            <div class="delbut" @click="modifyAuth('del')" v-if="authDataObj.tabValue == 'role'">删除该角色</div>
        </div>
        <div class="submitButWrap">
                <SnButton type="primary" @click="modifyAuth('set')" >提交</SnButton>
        </div>
    </div>		
</template>

<script>
import { notifyAppBackEvent } from "../../../../lib/common/SnJsBridge";
import {
    registerHandler,
    GetUserInfoFunction,
    PromiseJSBridgeReady,
} from "sinosun-ui/lib/support/native/JSBridge";
import {
    throttle,
    initTitleMenu,
    setStorage,
    getStorage,
} from "../../../../utils/commonUtil";
import SnAvatar from "../components/SnAvatar/SnAvatar.vue";
import {
    SnListItem,
    SnButton,
    SnWhiteSpace,
    SnRangePicker,
    SnToast,
} from "sinosun-ui";
import authDateTypeMap from "@/model/AuthDateType";
import authDateStyleMap from "@/model/AuthDateStyle";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        SnButton,
        SnAvatar,
        SnWhiteSpace,
        SnListItem,
        SnRangePicker,
    },
    data() {
        return {
            loading: true, //数据加载中
            userInfo: {}, //用户信息
            authDataObj: {}, //用户及角色信息
            radioList: [
                { id: 1, text: "永久" },
                { id: 2, text: "自定义" },
            ],
            showAuthValidity: 1, //展示当前人员有效期
            authValidity: 1, //存储当前有效期类型：1=永久；2=自定义
            timeJson: [], //有效期数据
            authDateTypeMap, //权限有效期状态
            authDateStyleMap, //权限有效期状态
            userCandel: false, //能否删除人员,
        };
    },
    created() {
        let _this = this;
        if (getStorage("userInfo")) {
            _this.userInfo = JSON.parse(getStorage("userInfo"));
        } else {
            GetUserInfoFunction().then(function (Data) {
                if (Data) {
                    _this.userInfo = Data;
                }
            });
        }
        PromiseJSBridgeReady(function () {
            if (!window.AlipayJSBridge) {
                notifyAppBackEvent(); //调用app，通知返回事件
                registerHandler("notifyAppBack", function () {
                    //点击app返回事件
                    throttle(
                        function () {
                            if (_this.authDataObj.isFrom == "authdetail") {
                                setStorage(
                                    "authDetailQuery",
                                    JSON.stringify(_this.authDataObj)
                                );
                                _this.$router.push({ path: "authdetail" });
                            } else {
                                setStorage(
                                    "ddsauthDetail",
                                    JSON.stringify(_this.authDataObj)
                                );
                                _this.$router.push({
                                    path: "ddsauthdetail",
                                });
                            }
                        }.bind(this)
                    );
                });
            }
        });
        setTimeout(() => {
            _this.initData();
        }, 300);
    },
    mounted() {
        let _this = this;
        if (window.AlipayJSBridge) {
            initTitleMenu([_this.authDataObj.name]);
        } else {
            initTitleMenu([
                _this.authDataObj.name,
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
            if (getStorage("authDataObj")) {
                _this.authDataObj = JSON.parse(getStorage("authDataObj"));
            }

            let itemJson = _this.authDataObj.userOrRoleObj;
            if (itemJson.authValidity) {
                _this.showAuthValidity = itemJson.authValidity;
                _this.authValidity = itemJson.authValidity;
            }
            if (2 == _this.authValidity) {
                _this.timeJson.push(
                    new Date(itemJson.beginTime * 1000).format("yyyy-MM-dd")
                );
                _this.timeJson.push(
                    new Date(itemJson.endTime * 1000).format("yyyy-MM-dd")
                );
            } else if (1 == _this.authValidity) {
                var nowTime = new Date(new Date().setHours(0, 0, 0, 0));
                _this.timeJson.push(nowTime.getTime());
                _this.timeJson.push(nowTime.getTime());
            }
        },

        //有效期切换
        changeCheck: function (item) {
            let _this = this;
            _this.authValidity = item.id;
        },

        //编辑或者删除人员角色权限
        modifyAuth(type) {
            let _this = this;
            let validityArr = [];
            validityArr = _this.timeJson.map((item) => {
                return (item = new Date(item).getTime());
            });
            let modifyParam = {
                perId: _this.authDataObj.perId,
                companyId: _this.authDataObj.companyId,
                resourceType: "data",
            };
            if (_this.authDataObj.tabValue == "user") {
                modifyParam = _this.getModifyUserParam(
                    modifyParam,
                    type,
                    validityArr
                );
            } else {
                modifyParam = _this.getModifyRoleParam(
                    modifyParam,
                    type,
                    validityArr
                );
            }
            let tipsMap = { set: "保存成功", del: "删除成功" };
            throttle(function () {
                authorityApi
                    .modifyPermission(modifyParam)
                    .then(function (result) {
                        if (result && result.resultCode == 0) {
                            SnToast(tipsMap[type]);
                            if (!window.AlipayJSBridge) {
                                if (_this.authDataObj.isFrom == "authdetail") {
                                    setStorage(
                                        "authDetailQuery",
                                        JSON.stringify(_this.authDataObj)
                                    );
                                    _this.$router.push({ path: "authdetail" });
                                } else {
                                    setStorage(
                                        "authQuery",
                                        JSON.stringify(_this.authDataObj)
                                    );
                                    _this.$router.push({
                                        path: "ddsauthdetail",
                                    });
                                }
                            } else {
                                setTimeout(function () {
                                    AlipayJSBridge.call("popTo", {
                                        index: -1,
                                        data: {
                                            refreshPage: true,
                                        },
                                    });
                                }, 100);
                            }
                        }
                    });
            });
        },

        //获取编辑人员入参
        getModifyUserParam(modifyParam = {}, type = "del", validityArr = []) {
            let _this = this;
            if (type == "del") {
                modifyParam.userList = [
                    {
                        userId: _this.authDataObj.userOrRoleObj.userId,
                        companyId: _this.userInfo.cpyId,
                        state: "2",
                    },
                ];
            } else {
                //有效期自定义
                if (1 == _this.authValidity) {
                    modifyParam.userList = [
                        {
                            userId: _this.authDataObj.userOrRoleObj.userId,
                            companyId: _this.userInfo.cpyId,
                            state: "3",
                        },
                    ];
                } else {
                    modifyParam.userList = [
                        {
                            userId: _this.authDataObj.userOrRoleObj.userId,
                            companyId: _this.userInfo.cpyId,
                            beginTime: parseInt(validityArr[0] / 1000),
                            endTime: parseInt(
                                validityArr[1] / 1000 + 3600 * 24 - 1
                            ),
                            state: "3",
                        },
                    ];
                }
            }
            return modifyParam;
        },

        //获取编辑角色入参，
        getModifyRoleParam(modifyParam = {}, type = "del", validityArr = []) {
            let _this = this;
            if (type == "del") {
                modifyParam.roleList = [
                    {
                        companyId: _this.userInfo.cpyId,
                        roleId: _this.authDataObj.userOrRoleObj.roleId,
                        state: "2",
                    },
                ];
            } else {
                //有效期自定义，字段可以不传
                if (1 == _this.authValidity) {
                    modifyParam.roleList = [
                        {
                            companyId: _this.userInfo.cpyId,
                            roleId: _this.authDataObj.userOrRoleObj.roleId,
                            state: "3",
                        },
                    ];
                } else {
                    modifyParam.roleList = [
                        {
                            companyId: _this.userInfo.cpyId,
                            roleId: _this.authDataObj.userOrRoleObj.roleId,
                            beginTime: parseInt(validityArr[0] / 1000),
                            endTime: parseInt(
                                validityArr[1] / 1000 + 3600 * 24 - 1
                            ),
                            state: "3",
                        },
                    ];
                }
            }
            return modifyParam;
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";
.mt50 {
    margin-bottom: 0rem;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 1rem;
    overflow-y: auto;
    background-color: #f6f9fd;
    margin: 0 auto;
    max-width: 1080px;

    .cardLineWrap {
        height: 1.28rem;
        padding-left: 0.3rem;
        background: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        .cardIcon {
            width: 0.88rem;
            height: 0.88rem;
            background-repeat: no-repeat;
            background-position: center;
            background-size: 0.9rem;
            border-radius: 0.42rem;
            margin-right: 0.16rem;
        }
        .textWrap {
            // margin-left: 0.2rem;
            flex: 1;
            .textName {
                max-width: 4.6rem;
                white-space: nowrap;
                font-size: 0.32rem;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: 0.32rem;
            }
            .date {
                font-size: 0.26rem;
            }
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

    .topTipsWrap {
        line-height: 0.6rem;
        font-size: 0.26rem;
        color: #999;
        padding-left: 0.3rem;
    }

    .contentWrap {
        .lineWrap {
            position: relative;
            background: #fff;
        }
        .lineWrap:before {
            content: " ";
            position: absolute;
            left: 0;
            top: 0;
            right: 0;
            height: 0px;
            transform-origin: 0 0;
            transform: scaleY(0.5);
        }
        .lineWrap:after {
            content: " ";
            position: absolute;
            left: 0;
            bottom: 0;
            right: 0;
            height: 0px;
            border-top: 1px solid #ededed;
            -webkit-transform-origin: left bottom;
            transform-origin: left bottom;
            transform: scaleY(0.5);
        }

        .authSnList {
            padding: 0 0.3rem !important;
            color: #666;
        }

        .sn-white-space.sn-white-space-base {
            height: 0;
        }

        .sn-list-item {
            padding: 0 0.3rem;
            font-size: 0.32rem;
            line-height: 1.08rem;
        }

        .line {
            line-height: 1.08rem;
            font-size: 0.32rem;
            color: #666;
        }
        .linetext {
            position: relative;
            padding: 0 0.3rem;
        }
        .checked {
            background: url(../../../../assets/img/authority/icon_choosed.png)
                no-repeat right 0.3rem center;
            background-size: 0.44rem;
        }
        .linetext:after {
            content: " ";
            position: absolute;
            left: 0;
            bottom: 0;
            right: 0;
            height: 0px;
            border-top: 1px solid #ededed;
            -webkit-transform-origin: left bottom;
            transform-origin: left bottom;
            transform: scaleY(0.5);
        }
        .line:last-child .linetext:after {
            display: none;
        }
    }

    .delbut {
        margin-top: 0.2rem;
        height: 1.08rem;
        line-height: 1.08rem;
        font-size: 0.32rem;
        color: #ff4e3a;
        text-align: center;
        background-color: #fff;
        border-bottom: 1px solid @color-bgc;
        cursor: pointer;
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
        bottom: 44px;
        overflow-y: auto;
        background-color: #f6f9fd;
        margin: 0 auto;
        max-width: 1080px;
        // border-bottom: 1px solid #e5e5e5;
    }
    .outWrap {
        margin-top: 15px;
    }
    .lineWrap {
        position: relative;
        background: #fff;
    }
    .lineWrap:before {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 0px;
        // border-top: 1px solid #ededed;
        transform-origin: 0 0;
        transform: scaleY(0.5);
    }
    .lineWrap:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .sn-white-space.sn-white-space-base {
        height: 0;
    }
    .authSnList {
        padding: 0 15px !important;
        color: #666;
    }
    .sn-list-item {
        padding: 0 15px;
        font-size: 14px;
        line-height: 54px;
    }
    .line {
        line-height: 54px;
        // padding-left: 15px;
        font-size: 14px;
        color: #666;
        cursor: pointer;
    }
    .linetext {
        position: relative;
        padding: 0 15px;
    }
    .checked {
        background: url(../../../../assets/img/authority/icon_choosed.png)
            no-repeat right 15px center;
        background-size: 22px;
    }
    .linetext:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .line:last-child .linetext:after {
        display: none;
    }
    .submitButWrap {
        background: @color-bgc;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0;
    }
    .submitBut {
        font-size: 14px;
        width: 150px;
        color: #fff;
        margin: 10px auto 10px auto;
        line-height: 30px;
        text-align: center;
        background-color: @colour-blue;
        border-radius: 3px;
        cursor: pointer;
    }
    .topTipsWrap {
        line-height: 30px;
        font-size: 13px;
        color: #999;
        padding: 0 15px;
    }
    .cardLineWrap {
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
            background: url(../../../../assets/img/authority/del.png) no-repeat
                center;
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
            border-radius: 23px;
            margin-right: 8px;
        }
        .textWrap {
            flex: 1;
            .textName {
                max-width: 440px;
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .date {
                max-width: 440px;
                font-size: 13px;
            }
        }
    }
    .delbut {
        margin-top: 10px;
        height: 54px;
        line-height: 54px;
        font-size: 14px;
        color: #ff4e3a;
        text-align: center;
        background-color: #fff;
        border-bottom: 1px solid @color-bgc;
        cursor: pointer;
    }
}

@media screen and (min-width: @screen-md-min) {
    .submitBut {
        width: 300px !important;
    }
    .mt50 {
        padding: 0 50px;
    }
}

.content {
    border-bottom: 1px solid #ededed;
    overflow: hidden;
}
.authSnList {
    box-sizing: border-box;
    padding: 0.12rem 0.4rem;
    .sn-list-item-value {
        flex-basis: initial;
        .sn-range-picker {
            color: #262dd9;
        }
    }
}
</style>
<style lang="less">
.sn-range-picker-view-header
    .sn-range-picker-view-tabs.range-date
    .sn-range-picker-view-tabs-item {
    min-width: 2.4rem !important ;
}
</style>