/*
 * @Author: yinfu
 * @Date: 2020-09-18 16:24:11
 * @LastEditTime: 2020-09-18 16:25:59
 * @Description: 选择角色，过滤到主管理员角色，主管理员角色不能编辑
 */
<template>
    <div>
        <div class="mt50">
            <div class="outWrap">
                <div v-if="!loading && 0 < roleTreeData.length">
                    <div v-for="(itemW,index) in roleTreeData" :key="index">
                        <div class="lineWrap" v-if="itemW && itemW.roleSetsId !=-4">
                            <div class="roleGroupName" :class="{roleGroupNameHaveChildren:itemW.roleList}">
                                <div class="roleSetStyle">{{itemW.roleSetsName}}</div>
                            </div>
                            <div v-if="itemW.roleList && itemW.roleList.length > 0 "  class="childrenDef" >
                                <div class="line" v-for="(item,ind) in itemW.roleList" @click="changeCheckedType(item)" :key="ind" >
                                    <div class="linetext" :class="{checked:item.checked,check:!item.checked}">{{item.roleName}}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <SnEmpty
                    v-if="!loading && 0 == roleTreeData.length"
                    image="../resource/img/noInfo.png"
                    desc="暂无角色"
                />
            </div>
            <div class="submitButWrap">
                <SnButton type="primary" @click="addAuthRole" >保存</SnButton>
            </div>
        </div>
    </div>
</template>
<script>
import {
    registerHandler,
    notifyAppBackEvent,
    GetUserInfoFunction,
} from "../../../../lib/common/SnJsBridge";
import { PromiseJSBridgeReady } from "sinosun-ui/lib/support/native/JSBridge";
import { SnButton, SnToast, SnEmpty } from "sinosun-ui";
import {
    throttle,
    initTitleMenu,
    setStorage,
    getStorage,
} from "../../../../utils/commonUtil";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        SnButton,
        SnEmpty,
    },
    data: function () {
        return {
            userInfo: {}, //从app获取的用户信息
            showChildren: false,
            loading: true,
            roleTreeData: [], //角色树
            authRoleIdList: [], //已选择的角色ID列表
            authListDate: [],
            chooseRoleQuery: {}, //增加角色页面权限信息
        };
    },
    created: function () {
        var _this = this;
        if (getStorage("chooseRoleQuery")) {
            _this.chooseRoleQuery = JSON.parse(getStorage("chooseRoleQuery"));
        }
        _this.authRoleIdList = _this.chooseRoleQuery.authRoleIdList || [];
        //注册返回事件
        PromiseJSBridgeReady(function () {
            if (!window.AlipayJSBridge) {
                notifyAppBackEvent();
                registerHandler(
                    "notifyAppBack",
                    function () {
                        //点击app返回事件
                        throttle(function () {
                            _this.chooseRoleQuery.tabValue = "role";
                            setStorage(
                                "authDetailQuery",
                                JSON.stringify(_this.chooseRoleQuery)
                            );
                            _this.$router.push({ path: "authdetail" });
                        }, this);
                    }.bind(this)
                );
            }
        });
        if (window.AlipayJSBridge) {
            initTitleMenu(["添加角色"]);
        } else {
            initTitleMenu([
                "添加角色",
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
        if (getStorage("userInfo")) {
            _this.userInfo = JSON.parse(getStorage("userInfo"));
            _this.initData();
        } else {
            GetUserInfoFunction().then(function (Data) {
                if (Data) {
                    _this.userInfo = Data;
                    setTimeout(() => {
                        _this.initData();
                    }, 300);
                }
            });
        }
        $(document).off("click", ".roleGroupName");
    },
    mounted: function () {
        $(document).on("click", ".roleGroupName", function () {
            $(".roleGroupName").removeClass("active");
            $(this).toggleClass("active");
            $(this).toggleClass("roleGroupNameOpen");
            $(this).siblings().stop().slideToggle(300);
        });
    },
    methods: {
        //初始化
        initData() {
            let _this = this;
            _this.loading = true;
            let json = {
                bizMateId: _this.userInfo.UAId,
                orgId: _this.userInfo.cpyId,
                targetOrgId: _this.userInfo.cpyId,
            };
            authorityApi.listRoleGroupByOrgId(json).then(function (result) {
                _this.loading = false;
                if (result && result.resultCode == 0) {
                    //角色组ID列表
                    let roleGroupIdTemp = [];
                    _this.roleTreeData = [];
                    if (
                        result.result.roleWithRoleGroupList &&
                        result.result.roleWithRoleGroupList.length
                    ) {
                        let roleWithRoleGroupListTemp =
                            result.result.roleWithRoleGroupList;
                        //处理角色组数据
                        roleWithRoleGroupListTemp.forEach((item) => {
                            if (
                                roleGroupIdTemp.indexOf(
                                    item.roleGroupEntity.roleGroupId
                                ) < 0
                            ) {
                                roleGroupIdTemp.push(
                                    item.roleGroupEntity.roleGroupId
                                );
                                let roleListObj = {
                                    roleSetsId:
                                        item.roleGroupEntity.roleGroupId,
                                    roleSetsName:
                                        item.roleGroupEntity.roleGroupName,
                                    roleList: [],
                                };
                                _this.roleTreeData.push(roleListObj);
                            }
                            _this.roleTreeData.reverse();
                            //处理已经勾选的角色
                            if (
                                _this.authRoleIdList.indexOf(
                                    item.roleInfoEntity.roleId
                                ) > -1
                            ) {
                                item.roleInfoEntity.checked = true;
                            }
                        });
                        //处理角色数据
                        roleWithRoleGroupListTemp.forEach((item1) => {
                            _this.roleTreeData.forEach((item2) => {
                                if (
                                    item1.roleGroupEntity.roleGroupId ==
                                    item2.roleSetsId
                                ) {
                                    item2.roleList.push(item1.roleInfoEntity);
                                }
                            });
                        });
                    }
                }
            });
        },

        //增加权限角色
        addAuthRole() {
            let _this = this;
            if (_this.roleTreeData.length == 0) {
                return;
            }
            let modifyParam = {
                perId: _this.chooseRoleQuery.perId,
                companyId: _this.chooseRoleQuery.companyId,
                resourceType: "data",
                roleList: _this.getRoleList(),
            };
            authorityApi.modifyPermission(modifyParam).then(function (result) {
                if (result && result.resultCode == 0) {
                    SnToast("添加成功");
                    setTimeout(function () {
                        _this.chooseRoleQuery.tabValue = "role";
                        setStorage(
                            "authDetailQuery",
                            JSON.stringify(_this.chooseRoleQuery)
                        );
                        if (!window.AlipayJSBridge) {
                            _this.$router.push({ path: "authdetail" });
                        } else {
                            setTimeout(function () {
                                AlipayJSBridge.call("popTo", {
                                    index: -1,
                                    data: {
                                        refreshPage: true,
                                    },
                                });
                            }, 1000);
                        }
                    }, 500);
                }
            });
        },

        //获取编辑权限角色信息入参，需要区分是新增还是删除
        getRoleList() {
            let _this = this;
            let selectedRoleIdList = []; //页面勾选的角色ID列表
            let selectedUserOrRole = [];
            _this.roleTreeData.forEach((item) => {
                if (item.roleList && item.roleList.length) {
                    item.roleList.forEach((item1) => {
                        if (item1.checked) {
                            selectedRoleIdList.push(item1.roleId);
                        }
                    });
                }
            });
            //页面勾选的数据，在跳转传递数据里没有，则直接增加
            if (selectedRoleIdList.length) {
                selectedRoleIdList.forEach((item) => {
                    if (_this.authRoleIdList.indexOf(item) < 0) {
                        let selectRoleObj = {
                            companyId: _this.userInfo.cpyId,
                            roleId: item,
                            state: "1",
                        };
                        selectedUserOrRole.push(selectRoleObj);
                    }
                });
            }
            //跳转传递数据有，而页面没有勾选，则标识删除
            if (_this.authRoleIdList.length) {
                _this.authRoleIdList.forEach((item) => {
                    if (selectedRoleIdList.indexOf(item) < 0) {
                        let selectRoleObj = {
                            companyId: _this.userInfo.cpyId,
                            roleId: item,
                            state: "2",
                        };
                        selectedUserOrRole.push(selectRoleObj);
                    }
                });
            }
            return selectedUserOrRole;
        },

        //切换角色选择状态
        changeCheckedType(item) {
            let _this = this;
            if (item.checked) {
                _this.$set(item, "checked", false);
            } else {
                _this.$set(item, "checked", true);
            }
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";

.mt50 {
    margin-bottom: 1.5rem;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    background-color: #fff;
    margin: 0 auto;
    max-width: 1080px;

    .outWrap {
        padding-bottom: 1rem;
        height: 100%;

        .lineWrap {
            position: relative;
            background: #fff;

            .roleGroupName {
                position: relative;
                padding-left: 0.3rem;
                font-size: 0.32rem;
                height: 1rem;
                line-height: 1rem;
                background: #fff;
                cursor: pointer;

                .roleSetStyle {
                    margin-left: 0.2rem;
                    color: #333333;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
            }

            .roleGroupName:after {
                content: " ";
                position: absolute;
                left: 0;
                bottom: 0;
                right: 0;
                height: 0px;
                border-top: 1px solid #ededed;
                -webkit-transform-origin: left bottom;
                transform-origin: left bottom;
            }

            .roleGroupNameHaveChildren {
                position: relative;
            }

            .roleGroupNameHaveChildren:before {
                content: "";
                display: block;
                position: absolute;
                left: 0.2rem;
                top: 50%;
                margin-top: -0.16rem;
                width: 0.32rem;
                height: 0.32rem;
                background: url(../../../../assets/img/authority/navigation.png)
                    no-repeat center;
                background-size: 0.32rem;
                transition: all 0.3s;
                transform: rotate(-90deg);
            }

            .roleGroupNameHaveChildren.roleGroupNameOpen:before {
                transform: rotate(0deg);
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
}

.submitButWrap {
    background: #fff;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    padding: 0.1rem 0.3rem;
    margin: auto;
    .sn-button {
        margin: 0 auto;
        border: 0;
    }
}

.childrenDef {
    display: none;

    .line {
        line-height: 1.08rem;
        padding-left: 0.3rem;
        font-size: 0.32rem;
        color: #191919;

        .linetext {
            position: relative;
            width: 100%;
            padding-left: 0.6rem;
            font-size: 0.3rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border-bottom: 1px solid @color-bgc;
        }

        .linetext:after {
            content: " ";
            position: absolute;
            left: 0;
            bottom: 0;
            right: 0;
            height: 0px;
            -webkit-transform-origin: left bottom;
            transform-origin: left bottom;
            transform: scaleY(0.5);
        }

        .check {
            background: url(../../../../assets/img/authority/tycheck.png)
                no-repeat left 0 center;
            background-size: 0.4rem;
        }
        .checked {
            background: url(../../../../assets/img/authority/tychecked.png)
                no-repeat left 0 center;
            background-size: 0.4rem;
        }
    }

    .line:last-child .linetext:after {
        display: none;
    }
}

@media (-webkit-device-pixel-ratio: 1.5), (min-device-pixel-ratio: 1.5) {
    .lineWrap,
    .roleGroupName {
        &::after {
            -webkit-transform: scaleY(0.7);
            transform: scaleY(0.7);
        }
    }
}
@media (-webkit-device-pixel-ratio: 2), (min-device-pixel-ratio: 2) {
    .lineWrap,
    .roleGroupName {
        &::after {
            -webkit-transform: scaleY(0.5);
            transform: scaleY(0.5);
        }
    }
}
@media (-webkit-device-pixel-ratio: 3), (min-device-pixel-ratio: 3) {
    .lineWrap,
    .roleGroupName {
        &::after {
            -webkit-transform: scaleY(0.33);
            transform: scaleY(0.33);
        }
    }
}
@media screen and (min-width: @pc-width) {
    .outWrap {
        padding-bottom: 50px;
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
        // border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
    }
    .roleGroupName {
        position: relative;
        padding-left: 20px;
        font-size: 14px;
        // color: #999;
        height: 46px;
        line-height: 46px;
        background: #fff;
        // margin-top: 10px;
        cursor: pointer;
    }
    .roleGroupName:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
    }
    .line {
        line-height: 54px;
        padding-left: 15px;
        font-size: 14px;
        color: #191919;
        cursor: pointer;
    }

    .noInfo {
        margin-top: 75px;
        height: 25px;
        padding-top: 150px;
        text-align: center;
        font-size: 16px;
        line-height: 25px;
        color: #b2b2b2;
        background: url(../../../../assets/img/authority/noInfo.png) no-repeat
            center;
        background-size: 135px;
    }
}

.children .roleGroupNameHaveChildren:before {
    left: 0.8rem;
}
.line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    font-size: 14px;
    color: #333;
    line-height: 46px;
    // border-bottom: 1px solid #eaeaee;
}

.moreMenu {
    display: block !important;
    position: absolute;
    right: 10px;
    top: 0;
    width: 40px;
    height: 40px;
    background: url(../../../../assets/img/authority/icon_7.png) no-repeat
        center;
    background-size: 30px 30px;
}

.moreMenu:hover {
    background: url(../../../../assets/img/authority/icon_8.png) no-repeat
        center;
    background-size: 30px 30px;
}

.moreline:hover {
    background: #d6e4fa;
}

@media screen and (min-width: @pc-width) {
    .mt50 {
        margin-bottom: 50px;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow-y: auto;
        margin: 0 auto;
        max-width: 1080px;
        background-color: #fff;
        // border-bottom: 1px solid @color-bgc;
    }
    .submitButWrap {
        background: @color-bgc;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
    }
    .linetext {
        position: relative;
        padding-left: 30px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-bottom: 1px solid @color-bgc;
    }
    .check {
        background: url(../../../../assets/img/authority/tycheck.png) no-repeat
            left 0 center;
        background-size: 20px;
    }
    .checked {
        background: url(../../../../assets/img/authority/tychecked.png)
            no-repeat left 0 center;
        background-size: 20px;
    }
    .linetext:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        // border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .line:last-child .linetext:after {
        display: none;
    }
    .roleGroupNameHaveChildren {
        position: relative;
    }

    .roleGroupNameHaveChildren:before {
        content: "";
        display: block;
        position: absolute;
        left: 10px;
        top: 50%;
        margin-top: -8px;
        width: 16px;
        height: 16px;
        background: url(../../../../assets/img/authority/navigation.png)
            no-repeat center;
        background-size: 16px;
        transition: all 0.3s;
        transform: rotate(-90deg);
    }

    .roleGroupNameHaveChildren.roleGroupNameOpen:before {
        transform: rotate(0deg);
    }

    .children .roleGroupNameHaveChildren:before {
        left: 40px;
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
//input model框
.inputModelWrap {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.3);
}
@media screen and (min-width: @pc-width) {
    .roleSetStyle {
        margin-left: 5px;
        color: #333333;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .lineWrap {
        position: relative;
    }
    .lineWrap:after {
        content: " ";
        position: absolute;
        left: 0.3rem;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: 0 0;
        transform-origin: 0 0;
    }
    .lineWrap:first-child:before {
        display: none;
    }
    .lineWrap:last-child:after {
        display: none;
    }
    .iconImg {
        display: block;
        position: absolute;
        width: 32px;
        height: 32px;
        top: 50%;
        margin-top: -16px;
        left: 0;
        border-radius: 5px;
        background-size: 32px;
    }

    .linetext:after {
        content: " ";
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        height: 0px;
        // border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .noInfo {
        margin-top: 75px;
        height: 25px;
        padding-top: 150px;
        text-align: center;
        font-size: 16px;
        line-height: 25px;
        color: #b2b2b2;
        background: url(../../../../assets/img/authority/noInfo.png) no-repeat
            center;
        background-size: 135px;
    }
    .menuWrap {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: #fff;
        line-height: 30px;
        padding: 20px 0;
        display: -ms-flexbox;
        display: -webkit-box;
        display: -webkit-flex;
        display: flex;
        -webkit-box-pack: space-around;
        -webkit-justify-content: space-around;
        -moz-justify-content: space-around;
        -ms-justify-content: space-around;
        -o-justify-content: space-around;
        justify-content: space-around;
        -ms-flex-align: center;
        -webkit-align-items: center;
        -moz-align-items: center;
        align-items: center;
        -webkit-flex-wrap: wrap;
        flex-wrap: wrap;
    }

    .menuWrap:before {
        display: none;
    }
    .menuWrap .menu {
        text-align: center;
        font-size: 14px;
        width: 170px;
        color: #fff;
        line-height: 30px;
        background-color: @colour-blue;
        border-radius: 3px;
        cursor: pointer;
        -webkit-box-flex: initial;
        -moz-box-flex: initial;
        -webkit-flex: initial;
        -ms-flex: initial;
        flex: initial;
    }
    //input model框
    .inputModel {
        position: absolute;
        display: table;
        width: 295px;
        max-width: 295px;
        height: 188px;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        margin: auto;
        background-color: #fff;
        text-align: center;
        border-radius: 6px;
        overflow: hidden;
        z-index: 101;
    }
    .inputModelWrap .title {
        padding: 24px 20px 23px 20px;
        font-size: 14px;
    }
    .inputModelWrap input {
        width: 80%;
        border: 1px solid #dedede;
        border-radius: 3px;
        // padding: 4px 5px;
        padding-left: 11px;
        -webkit-appearance: none;
        appearance: none;
        outline: none;
        font-size: 14px;
        margin: 0 auto 24px auto;
        line-height: 34px;
    }
    .inputModelWrap .butWrap {
        position: relative;
        line-height: 30px;
        font-size: 14px;
        display: -webkit-box;
        display: -webkit-flex;
        display: flex;
        margin-bottom: 30px;
        padding: 0 30px;
        -webkit-box-pack: space-between;
        -webkit-justify-content: space-between;
        -moz-justify-content: space-between;
        -ms-justify-content: space-between;
        -o-justify-content: space-between;
        justify-content: space-between;
    }
    .inputModelWrap .but.ok:after,
    .inputModelWrap .butWrap:after {
        display: none;
    }
    .inputModelWrap .but {
        width: 90px;
        height: 30px;
        border-radius: 3px;
        text-align: center;
        line-height: 30px;
        background: @colour-blue;
        color: #fff;
        cursor: pointer;
        -webkit-box-flex: initial;
        -webkit-flex: initial;
        flex: initial;
    }
    .inputModelWrap .but.cancel {
        color: #fff;
    }
    .inputModelWrap .butWrap:after {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        height: 1px;
        border-top: 1px solid #d5d5d6;
        color: #d5d5d6;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        -webkit-transform: scaleY(0.5);
        transform: scaleY(0.5);
    }

    .inputModelWrap .but.ok:after {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        width: 1px;
        bottom: 0;
        border-left: 1px solid #d5d5d6;
        color: #d5d5d6;
        -webkit-transform-origin: 0 0;
        transform-origin: 0 0;
        -webkit-transform: scaleX(0.5);
        transform: scaleX(0.5);
    }
    .fade-enter-active,
    .fade-leave-active {
        transition: all 0.5s;
        transition-delay: 0.5s;
    }
    .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
        display: none;
    }

    .lineWrap {
        background: #fff;
        position: relative;
        font-size: 0.32rem;
        color: #191919;
        .demo-content {
            // background: url(../../../resource/img/appusermgr/right.png) no-repeat right 0.35rem center;
            background-size: 0.18rem 0.37rem;
            padding-right: 1rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
    .delbut {
        display: block;
        position: absolute;
        top: 50%;
        margin-top: -12px;
        right: 45px;
        height: 24px;
        width: 56px;
        line-height: 24px;
        font-size: 14px;
        color: #ff6a6a;
        background: @color-bgc;
        text-align: center;
        border-radius: 3px;
        cursor: pointer;
    }
    .delbut:hover {
        background: #ffeaeb;
    }
    .editbut {
        position: absolute;
        top: 50%;
        margin-top: -12px;
        right: 111px;
        display: inline-block;
        height: 24px;
        width: 56px;
        line-height: 24px;
        font-size: 14px;
        color: @colour-blue;
        background: @color-bgc;
        text-align: center;
        border-radius: 3px;
        cursor: pointer;
    }
    .editbut:hover {
        background: #ecf3fd;
    }
}
</style>