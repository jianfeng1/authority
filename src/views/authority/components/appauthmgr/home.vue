/*
 * @Author: yinfu
 * @Date: 2020-09-18 16:24:11
 * @LastEditTime: 2020-09-18 16:25:59
 * @Description: 首页权限树，企业最高管理者需要展示管理员权限，其他人不展示管理员权限
 */
<template>
	<div class="outWarp">
        <SnLoading :spinning="loading" :turn="loading" size="small" tip="正在加载"/>
        <div class="noInfo" v-if="!loading && 0 == authTreeData.length">
            <div class="noInfoImg"></div>
            <div>暂无权限</div>
        </div>
        <div v-if="!loading && 0 < authTreeData.length">
            <div  v-for="(itemW, index) in authTreeData" :key="index">	 			
                <div class="lineWrap" v-if="itemW.childrenAuth && itemW.childrenAuth.length">
                    <div class="groupName" v-if="itemW.authName != '其他'">{{itemW.authName}}</div>
                    <div class="line" v-for="(item, indexs) in itemW.childrenAuth" @click="gotoPage(item)" :key="indexs">
                        <div class="linetext">{{item.name}}</div>
                    </div>
                </div>
                <div class="lineWrap noTopBorder" v-else-if="-1 != itemW.authId">
                    <div class="line" @click="gotoPage(itemW)">
                        <div class="linetext">{{itemW.authName}}</div>
                    </div>
                </div>	 			
            </div>
        </div>
	</div>
</template>

<script>
import {
    registerHandler,
    GetUserInfoFunction,
    goBackFunction_new,
} from "sinosun-ui/lib/support/native/JSBridge";
import { notifyAppBackEvent } from "../../../../lib/common/SnJsBridge.js";
import {
    throttle,
    initTitleMenu,
    setStorage,
} from "../../../../utils/commonUtil";
import UserInfo from "../../../../model/UserInfo";
import AuthCode from "@/model/AuthCode";
import { SnLoading } from "sinosun-ui";
import { imgBase64Map } from "../../../../service/imgBase64Map";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        SnLoading,
    },
    data() {
        return {
            userInfo: {}, //用户信息
            loading: true, //数据加载中
            authTreeData: [], //权限树
            view: true, //是否只展示信息，不可编辑
        };
    },
    created() {
        let _this = this;
        notifyAppBackEvent(); //调用app，通知返回事件
        registerHandler("notifyAppBack", function () {
            //点击app返回事件
            throttle(
                function () {
                    goBackFunction_new("", 1);
                }.bind(this)
            );
        });
        GetUserInfoFunction().then(function (Data) {
            if (Data) {
                _this.userInfo = Data;
                setStorage("userInfo", JSON.stringify(Data));
                //获取当前用户权限，判断是否是最高管理者或者是否拥有管理员权限
                _this.listPermissionByUser();
                //查询当前企业最高管理者
                _this.listRoleUser();
                setTimeout(() => {
                    _this.initData();
                }, 300);
            }
        });
    },
    mounted() {
        let _this = this;
        initTitleMenu([
            "权限设置",
            {
                iconNormalBase64: imgBase64Map["path_1_0"],
                iconPressedBase64: imgBase64Map["path_1_0_hov"],
                menuId: "but_1_0",
                type: 1,
                func: function () {
                    _this.gotoUserAuthList();
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
    },
    methods: {
        //获取当前用户权限列表，判断是否有权限管理员权限，如果有可以编辑权限,企业管理员权限码：2_-1_funMgr
        listPermissionByUser() {
            let _this = this;
            _this.loading = true;
            let json = {
                companyId: _this.userInfo.cpyId,
                userIdList: [_this.userInfo.UAId],
                typeIdList: ["2"],
            };
            authorityApi.listPermissionByUser(json).then(function (result) {
                if (result.resultCode == 0) {
                    if (
                        result.result &&
                        result.result.permissionList &&
                        result.result.permissionList.length
                    ) {
                        for (let item of result.result.permissionList) {
                            if (
                                item.bisCode == AuthCode.CPY_ROOT ||
                                item.bisCode == AuthCode.CPY_AUTH
                            ) {
                                _this.view = false;
                                break;
                            }
                        }
                    }
                } else {
                    _this.loading = false;
                }
            });
        },

        //获取当前企业最高管理者
        listRoleUser() {
            let _this = this;
            let param = {
                bizMateId: _this.userInfo.UAId,
                orgId: _this.userInfo.cpyId,
                targetOrgId: _this.userInfo.cpyId,
                roleIdList: ["-1"],
            };
            authorityApi.listRoleUser(param).then(function (result) {
                if (result && result.resultCode == 0) {
                    if (
                        result.result &&
                        result.result.roleWithUserList &&
                        result.result.roleWithUserList.length
                    ) {
                        let cpyAdminId =
                            result.result.roleWithUserList[0].orgUserContact
                                .bizMateId;
                        _this.userInfo.cpyCreatorId = cpyAdminId;
                        setStorage("userInfo", JSON.stringify(_this.userInfo));
                    }
                }
            });
        },

        //初始化权限树结构
        initData() {
            let _this = this;
            _this.loading = true;
            let json = {
                companyId: _this.userInfo.cpyId,
                typeIdList: ["2"],
                isAdmin:
                    _this.userInfo.UAId == _this.userInfo.cpyCreatorId
                        ? true
                        : false,
            };
            authorityApi.listControlPermission(json).then(function (result) {
				console.log('获取tree列表');
				console.log(result);
				
                _this.loading = false;
                if (result && result.resultCode == 0) {
                    _this.authTreeData = result.permissionList;
                } else {
                    SnToast(result.resultDesc);
                }
            });
        },

        //跳转权限详情页面
        gotoPage(item) {
			console.log(item)
            let _this = this;
            _this.$set(item, "view", _this.view);
			console.log(item)
            //有子元素的权限组
            if (!!item.childrenAuth && item.childrenAuth.length) {
                //权限信息缓存起来
                setStorage("authGroupQuery", JSON.stringify(item));
                setStorage("authDetailQuery", "");
                if (!window.AlipayJSBridge) {
                    _this.$router.push({ path: "authgroup" });
                } else {
                    AlipayJSBridge.call("pushWindow", {
                        url: "appauthmgr.html#/authgroup",
                    });
                }
            } else {
                //权限信息缓存起来
                setStorage("authDetailQuery", JSON.stringify(item));
                setStorage("authGroupQuery", "");
                if (!window.AlipayJSBridge) {
                    _this.$router.push({ path: "authdetail" });
                } else {
                    AlipayJSBridge.call("pushWindow", {
                        url: "appauthmgr.html#/authdetail",
                    });
                }
            }
        },

        //跳转企业通讯录页面
        gotoUserAuthList() {
            let _this = this;
            let userauthlist = {
                view: _this.view,
            };
            setStorage("userauthlist", JSON.stringify(userauthlist));
            if (!window.AlipayJSBridge) {
                _this.$router.push({ path: "userauthlist" });
            } else {
                AlipayJSBridge.call("pushWindow", {
                    url: "appauthmgr.html#/userauthlist",
                });
            }
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";

.lineWrap {
    position: relative;
    background: #fff;

    .groupName {
        position: relative;
        padding-left: 0.3rem;
        font-size: 0.28rem;
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
            background: url("../../../../assets/img/authority/right.png")
                no-repeat right 0.26rem center;
            background-size: 0.28rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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
    }

    .line:last-child .linetext:after {
        display: none;
    }
}

.noInfo {
    width: 2.4rem;
    height: 2.4rem;
    position: absolute;
    left: 50%;
    top: 50%;
    font-size: 0.32rem;
    margin: -1.5rem 0 0 -1.2rem;
    text-align: center;
    color: #b2b2b2;

    .noInfoImg {
        width: 2.4rem;
        height: 2.4rem;
        background: url("../../../../assets/img/authority/noInfo.png") no-repeat
            center;
        background-size: 2.4rem;
    }
}

@media screen and (min-width: @pc-width) {
    .lineWrap {
        position: relative;
        background: #fff;
    }
    .groupName {
        position: relative;
        padding-left: 15px;
        font-size: 13px;
        color: #999;
        height: 30px;
        line-height: 30px;
        background: #f6f9fd;
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
        background: url("../../../../assets/img/authority/right.png") no-repeat
            right 13px center;
        background-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
    .noInfo {
        width: 120px;
        height: 150px;
        position: absolute;
        left: 50%;
        top: 50%;
        margin: -75px 0 0 -60px;
        font-size: 14px;
        text-align: center;
        color: #b2b2b2;
    }
    .noInfoImg {
        width: 120px;
        height: 120px;
        background: url("../../../../assets/img/authority/noInfo.png") no-repeat
            center;
        background-size: 120px;
    }
}
@media screen and (min-width: @screen-md-min) {
    .outWrap {
        padding: 0 50px;
    }
    .child-view {
        background-color: #fff;
        overflow-y: auto;
    }
}
</style>

