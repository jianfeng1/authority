/*
 * @Author: yinfu
 * @Date: 2020-09-18 16:24:11
 * @LastEditTime: 2020-09-18 16:25:59
 * @Description: 人员权限页面，默认展示管理员权限。当操作人为企业最高管理者时，可以编辑管理员权限，其他人不能编辑。当权限为角色权限时，不能编辑
 */
<template>
    <div>
        <div :class="{mt50:!view,imgFlx:!loading && 0 == authTreeData.length}" >
            <div class="outWrap" :class="{isView:view}">
                <SnEmpty
                    v-if="!loading && 0 == authTreeData.length"
                    image="../resource/img/noInfo.png"
                    desc="该人员暂无权限"
                />
                <div v-if="!loading && 0 < authTreeData.length">
                    <div  v-for="(itemW,index) in authTreeData" :key="index">	 			
                        <div class="lineWrap" v-if="itemW.childrenAuth && itemW.childrenAuth.length">
                            <div class="groupName" v-if="itemW.authName != '其他'">{{itemW.authName}}</div>
                            <div class="line" v-for="(itemM,inde) in itemW.childrenAuth" :key="inde">
                                <div class="linetext" :class="{userAuthHaveChildren:itemM.childrenAuth,rightJT:!itemM.childrenAuth,hasRole:hasRoleAuth(itemM)}" v-html="formatAuthDate(itemM)" @click="hasRoleAuth(itemM)?'':gotoPage(itemM)"></div>	 				 					 					 				
                                <div class="childrenWrap" v-if="itemM.childrenAuth">
                                    <div class="line"  v-for="(itemL,ind) in itemM.childrenAuth" :key="ind"  @click.stop="hasRoleAuth(itemL)?'':gotoPage(itemL)">
                                        <div class="linetext rightJT" :class="{hasRole:!!itemL.sourceTypeList&&itemL.sourceTypeList[0]==1}" v-html="formatAuthDate(itemL)"></div>
                                    </div>
                                </div>	 					 					 					 					 				
                            </div>
                        </div>	 			
                        <div class="lineWrap noTopBorder" v-else-if="-1 != itemW.authId">
                            <div class="line" @click.stop="hasRoleAuth(itemW)?'':gotoPage(itemW)">
                                <div class="linetext rightJT" :class="{hasRole:hasRoleAuth(itemW)}" v-html="formatAuthDate(itemW)"></div>	 				 					 					 					 					 					 					 					 				
                            </div>
                        </div>	 			 		
                    </div>
                </div>	 			 		
            </div>	 	  		  		  	
            <div v-if="!loading && 0 == authTreeData.length && !view && !isCpyCreator">
                <div class="submitButWrap">
                        <SnButton type="primary" @click="addAuth" >添加权限</SnButton>
                </div>	
            </div>  		
        </div>
    </div>
</template>

<script>
import {
    registerHandler,
    notifyAppBackEvent,
    GetUserInfoFunction,
} from "../../../../lib/common/SnJsBridge.js";
import { PromiseJSBridgeReady } from "sinosun-ui/lib/support/native/JSBridge";
import {
    throttle,
    initTitleMenu,
    setStorage,
    getStorage,
} from "../../../../utils/commonUtil";
import { handleValidity } from "../../../../utils/authorityUtil";
import { SnButton, SnEmpty, SnToast } from "sinosun-ui";
import { imgBase64Map } from "../../../../service/imgBase64Map";
import authorityApi from "@/service/authorityApi.ts";

export default {
    components: {
        SnButton,
        SnEmpty,
    },
    data() {
        return {
            view: false, //是否只显示用
            userInfo: {}, //用户信息
            loading: true, //数据加载中
            UAId: "", //编辑人员ID
            uName: "", //编辑人员名称
            userAuthIdList: [], //拥有的权限列表
            authTreeData: [], //已有权限树
            userauthinfo: {}, //人员列表页面跳转数据
            isCpyCreator: false, //是否是最高管理者
        };
    },
    created() {
        let _this = this;
        if (getStorage("userauthinfo")) {
            _this.userauthinfo = JSON.parse(getStorage("userauthinfo"));
        }
        _this.UAId = _this.userauthinfo.UAId;
        _this.uName = _this.userauthinfo.uName;
        _this.view = _this.userauthinfo.view;
        PromiseJSBridgeReady(function () {
            if (!window.AlipayJSBridge) {
                notifyAppBackEvent(); //调用app，通知返回事件
                registerHandler("notifyAppBack", function (data) {
                    //点击app返回事件
                    throttle(
                        function () {
                            _this.$router.goBack();
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
        _this.isCpyCreator =
            _this.UAId == _this.userInfo.cpyCreatorId ? true : false;

        document.addEventListener("resume", function (event) {
            _this.initData();
        });
    },
    mounted() {
        let _this = this;
        if (_this.view) {
            initTitleMenu([
                _this.uName,
                {
                    name: "刷新",
                    menuId: "but_2_0",
                    type: 2,
                    func: function () {
                        _this.initData();
                    },
                },
            ]);
        } else {
            initTitleMenu([
                _this.uName,
                {
                    iconNormalBase64: imgBase64Map["path_1_1"],
                    iconPressedBase64: imgBase64Map["path_1_1_hov"],
                    menuId: "but_1_1",
                    type: 1,
                    func: function () {
                        _this.addAuth();
                    },
                },
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
        $(document).off("click", ".userAuthHaveChildren");
        $(document).on("click", ".userAuthHaveChildren", function () {
            $(this).toggleClass("userOpen");
            $(this).siblings().stop().slideToggle(300);
        });
    },
    methods: {
        initData() {
            let _this = this;
            _this.loading = true;
            let json = {
                companyId: _this.userInfo.cpyId,
                userIdList: [_this.UAId],
                typeIdList: ["2"],
            };
            authorityApi.listPermissionByUser(json).then(function (result) {
                _this.loading = false;
                _this.userAuthIdList = [];
                if (result && result.resultCode == 0) {
                    _this.authTreeData = result.permissionList || [];
                    if (
                        result.result &&
                        result.result.permissionList &&
                        result.result.permissionList.length
                    ) {
                        result.result.permissionList.forEach((item) => {
                            let userAuthIdListObj = {
                                perId: item.perId,
                                sourceTypeList: item.sourceTypeList,
                                beginTime: item.beginTime,
                                endTime: item.endTime,
                            };
                            _this.userAuthIdList.push(userAuthIdListObj);
                        });
                    }
                } else {
                    SnToast(result.resultDesc);
                }
            });
        },

        //修改人员权限
        addAuth: function () {
            var _this = this;
            if (_this.isCpyCreator) {
                SnToast("无法修改企业最高管理员的权限");
                return;
            }
            let edituserauthinfo = {
                UAId: _this.UAId,
                uName: _this.uName,
                userAuthIdList: _this.userAuthIdList,
            };
            setStorage("edituserauthinfo", JSON.stringify(edituserauthinfo));
            if (!window.AlipayJSBridge) {
                _this.$router.push({ path: "edituserauthinfo" });
            } else {
                AlipayJSBridge.call("pushWindow", {
                    url: "appauthmgr.html#/edituserauthinfo",
                });
            }
        },

        //前往设置人员权限时效，不能编辑企业最高管理者的权限
        gotoPage: function (item) {
            let _this = this;
            if (_this.isCpyCreator) {
                SnToast("无法修改企业最高管理员的权限有效期");
                return;
            }
            if (item.childrenAuth || _this.view || _this.isCpyCreator) {
                return;
            }
            let userauthdate = {
                UAId: _this.UAId,
                uName: _this.uName,
                item: JSON.stringify(item),
            };
            setStorage("userauthdate", JSON.stringify(userauthdate));
            if (!window.AlipayJSBridge) {
                _this.$router.push({ path: "userauthdate" });
            } else {
                AlipayJSBridge.call("pushWindow", {
                    url: "appauthmgr.html#/userauthdate",
                });
            }
        },

        //处理权限数据有效期显示
        formatAuthDate: function (item) {
            let _this = this;
            item = handleValidity(item);
            let authName = item.name;
            let isRoleAuthView = false;
            isRoleAuthView = _this.hasRoleAuth(item);
            if (authName.indexOf("审批额度权限：") >= 0) {
                authName = authName.replace(/审批额度权限：/g, "");
            }
            if (authName.indexOf("授权棒机具号：") >= 0) {
                authName = authName.replace(/授权棒机具号：/g, "机具号：");
            }
            if (item.childrenAuth) {
                return "<span class='label'>" + authName + "</span>";
            } else {
                if (1 == item.authValidity) {
                    return (
                        "<span class='label'>" +
                        authName +
                        "</span><span class='textin " +
                        _this.haveTime(isRoleAuthView) +
                        "'>永久有效</span>"
                    );
                } else {
                    if (0 == item.authValidityType) {
                        return (
                            "<span class='label'>" +
                            authName +
                            "</span><span class='textbeforeTime " +
                            _this.haveTime(isRoleAuthView) +
                            "'>未生效</span>"
                        );
                    } else if (1 == item.authValidityType) {
                        let dateStr =
                            new Date(item.beginTime * 1000).format(
                                "yyyy-MM-dd"
                            ) +
                            " - " +
                            new Date(item.endTime * 1000).format("yyyy-MM-dd");
                        return (
                            "<span class='label'>" +
                            authName +
                            "</span><span class='textin " +
                            _this.haveTime(isRoleAuthView) +
                            "'>" +
                            dateStr +
                            "</span>"
                        );
                    } else if (2 == item.authValidityType) {
                        return (
                            "<span class='label'>" +
                            authName +
                            "</span><span class='textafterTime " +
                            _this.haveTime(isRoleAuthView) +
                            "'>已过期</span>"
                        );
                    }
                }
            }
        },

        //判断是否是角色设置的权限，角色设置的权限不能编辑
        //出最高管理员外，管理员权限也不允许编辑
        hasRoleAuth: function (data) {
            let _this = this;
            console.log(data);
            let RoleAuth = false;
            if (data.sourceTypeList && data.sourceTypeList.length) {
                data.sourceTypeList.forEach(function (item) {
                    if (item == 1) {
                        RoleAuth = true;
                    }
                });
            }
            let cpyCreator = false;
            if (_this.userInfo.UAId == _this.userInfo.cpyCreatorId) {
                cpyCreator = true;
            }
            if (!cpyCreator) {
                if (data.bisCode == "2_-1_funMgr") {
                    RoleAuth = true;
                }
            }
            return RoleAuth;
        },

        haveTime: function (data) {
            if (data) {
                return "Time";
            } else {
                return "";
            }
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";
.mt50 {
    margin-bottom: 0rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0rem;
    overflow-y: auto;
    background-color: #fff;
    margin: 0 auto;
}
.imgFlx {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}
.outWrap {
    margin-top: 0;

    .lineWrap {
        position: relative;
        background: #fff;
        margin-bottom: 0rem;

        .groupName {
            position: relative;
            padding: 0 0.3rem;
            font-size: 0.32rem;
            color: #999;
            height: 0.6rem;
            line-height: 0.6rem;
            background: @color-bgc;
        }

        .line {
            line-height: 1.1rem;
            padding-left: 0.3rem;
            font-size: 0.32rem;
            color: #333;

            .linetext {
                position: relative;
                padding-right: 0.9rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                border-bottom: 0.5px solid #e8e8e8;
            }

            .childrenWrap .linetext {
                font-size: 0.3rem;
            }
            .childrenWrap {
                display: none;
            }
        }

        .rightJT {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            background: url(../../../../assets/img/authority/right.png)
                no-repeat right 0.2rem center;
            background-size: 0.28rem;
        }
        .rightJT .textin {
            color: @colour-other-green;
            font-size: 0.28rem;
        }
        .rightJT .Time {
            color: #b2b2b2 !important;
            background-image: none;
        }
        .rightJT .textafterTime {
            color: #999;
            font-size: 0.28rem;
        }

        .hasRole,
        .isView .rightJT {
            background-image: none;
        }
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

    .lineWrap.noTopBorder:before {
        display: none;
    }
    .lineWrap:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
    }
}

.lineWrap .line:last-child .linetext {
    border: none;
}

.userAuthHaveChildren:before {
    background-size: 0.37rem 0.18rem;
}
.userAuthHaveChildren.userOpen:before {
    transform: rotate(-180deg);
}

.userAuthHaveChildren:before {
    content: "";
    display: block;
    position: absolute;
    right: 0.3rem;
    top: 50%;
    margin-top: -0.09rem;
    width: 0.4rem;
    height: 0.18rem;
    background: url(../../../../assets/img/authority/down.png) no-repeat center;
    transition: all 0.3s;
    transform-origin: 50% 50%;
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

.fade-enter-active,
.fade-leave-active {
    transition: all 0.35s;
    left: 0;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    left: 100%;
}

@media (-webkit-device-pixel-ratio: 1.5), (min-device-pixel-ratio: 1.5) {
    .lineWrap,
    .linetext,
    .groupName {
        &::after {
            -webkit-transform: scaleY(0.7);
            transform: scaleY(0.7);
        }
    }
}
@media (-webkit-device-pixel-ratio: 2), (min-device-pixel-ratio: 2) {
    .lineWrap,
    .linetext,
    .groupName {
        &::after {
            -webkit-transform: scaleY(0.5);
            transform: scaleY(0.5);
        }
    }
}
@media (-webkit-device-pixel-ratio: 3), (min-device-pixel-ratio: 3) {
    .lineWrap,
    .linetext,
    .groupName {
        &::after {
            -webkit-transform: scaleY(0.33);
            transform: scaleY(0.33);
        }
    }
}

@media screen and (min-width: @pc-width) {
    .mt50 {
        margin-bottom: 0rem;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0px;
        overflow-y: auto;
        background-color: #fff;
        margin: 0 auto;
        max-width: 1080px;
        // border-bottom: 1px solid @color-bgc;
    }
    .tabWrap {
        position: relative;
        margin-top: 0.3rem;
        padding: 0.1rem 0.3rem;
        display: -ms-flexbox;
        display: -webkit-box;
        display: -webkit-flex;
        display: flex;
        -webkit-box-pack: space-between;
        -webkit-justify-content: space-between;
        -moz-justify-content: space-between;
        -ms-justify-content: space-between;
        -o-justify-content: space-between;
        justify-content: space-between;
        -ms-flex-align: center;
        -webkit-align-items: center;
        -moz-align-items: center;
        align-items: center;
        -webkit-flex-wrap: wrap;
        flex-wrap: wrap;
        background: #fff;
        color: #7f7f7f;
    }
    .outWrap {
        margin-top: 0;
    }
    .lineWrap {
        position: relative;
        background: #fff;
        margin-bottom: 0rem;
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

    .lineWrap.noTopBorder:before {
        display: none;
    }
    .lineWrap:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
    }
    .groupName {
        position: relative;
        padding: 0 15px;
        font-size: 14px;
        color: #999;
        height: 30px;
        line-height: 30px;
        background: @color-bgc;
    }
    .line {
        line-height: 55px;
        padding-left: 15px;
        font-size: 14px;
        color: #333;
        cursor: pointer;
    }
    .linetext {
        position: relative;
        padding-right: 30px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-bottom: 0.5px solid #e8e8e8;
    }
    .lineWrap .line:last-child .linetext {
        border: none;
    }
    .rightJT {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        background: url(../../../../assets/img/authority/right.png) no-repeat
            right 10px center;
        background-size: 14px;
    }
    .hasRole,
    .isView .rightJT {
        background-image: none;
    }
    .submitButWrap {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        justify-content: center;
        background-color: @color-bgc;
        padding: 0;
        margin: auto;
        padding: 0;
        .sn-button {
            margin: 0px auto;
            border: none;
        }
    }
    .fade-enter-active,
    .fade-leave-active {
        transition: all 0.35s;
        left: 0;
    }
    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
        left: 100%;
    }
    .title {
        position: relative;
        font-size: 14px;
        padding: 0 15px;
        cursor: pointer;
        transition: all 0.3s;
    }
    .children .title {
        font-size: 14px;
        padding-left: 66px;
    }
    .children .children .title {
        padding-left: 86px;
    }
    .userAuthHaveChildren {
        position: relative;
    }
    .userAuthHaveChildren:before {
        content: "";
        display: block;
        position: absolute;
        // right: 15px;
        top: 50%;
        margin-top: -4px;
        width: 20px;
        height: 9px;
        background: url(../../../../assets/img/authority/down.png) no-repeat
            center;
        // background-size:15px 9px;
        transition: all 0.3s;
        transform-origin: 50% 50%;
    }
    .userAuthHaveChildren.userOpen:before {
        transform: rotate(-180deg);
    }
    .children .userAuthHaveChildren:before {
        right: 0.3rem;
    }
    .title.active {
        background: #dae8fd;
        color: @colour-blue;
    }
    .title:hover {
        background: @color-bgc;
    }
    .imgFlx {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }
    .rightJT .textbeforeTime {
        color: #999;
        font-size: 14px;
    }
    .rightJT .textin {
        color: @colour-other-green;
        font-size: 14px;
    }
    .rightJT .textafterTime {
        color: #999;
        font-size: 14px;
    }
}
@media screen and (min-width: @screen-md-min) {
    .mt50 {
        padding: 0 50px;
    }
}
</style>

