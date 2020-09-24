/*
 * @Author: yinfu
 * @Date: 2020-09-18 16:24:11
 * @LastEditTime: 2020-09-18 16:25:59
 * @Description: 编辑人员权限页面，当操作者为企业最高管理者时，展示管理员权限，其他人员不展示。当权限为角色权限时，不能编辑
 */
<template>
	<div>
		<transition name="fade">
			<div  class="usedContactDiv">
				<div class="quick_name_box modalTree">
					<div class="treeWrap authTree">										
						<div class="tree">
							<div class="treeNode" v-for="(itemW,index) in authTreeShowData" :key="index"> 
								<div class="title" :title="itemW.authName" :class="{authHaveChildren:itemW.childrenAuth}"><span>{{itemW.authName}}</span></div>
								<div class="childrenWrap" v-if="itemW.childrenAuth">
									<div class="children" v-for="(itemM,inde) in itemW.childrenAuth"  :key="inde">
                                        <div class="title" :class="{checked:itemM.checked,check:!itemM.childrenAuth,authHaveChildren:itemM.childrenAuth}" :title="itemM.name" @click="treeChange(itemM)"><span :class="{childMenu:itemM.childrenAuth}">{{itemM.name}}</span></div>
                                        <div class="childrenWrap" v-if="itemM.childrenAuth">
                                            <div class="children" v-for="(itemL,inde) in itemM.childrenAuth" :key="inde">
                                                <div class="title check" :class="{checked:itemL.checked}" :title="itemL.name" @click.stop="treeChange(itemL)"><span>{{itemL.name}}</span></div>
                                            </div>									
                                        </div>
									</div>								
								</div>
							</div>
						</div>				
					</div>						
				</div>															
				<div class="queding_button_box" @click.stop="addAuthDo">
					<SnButton type="primary"  >确定</SnButton>
				</div>				
			</div>
		</transition>				
	</div>
</template>

<script>
import {
    notifyAppBackEvent,
    OpenActionFunction,
    registerHandler,
    GetUserInfoFunction,
} from "@/lib/common/SnJsBridge";
import { throttle, initTitleMenu, getStorage } from "@/utils/commonUtil";
import { handleAuthTree } from "../../../../utils/authorityUtil";
import { PromiseJSBridgeReady } from "sinosun-ui/lib/support/native/JSBridge";
import { SnButton, SnToast } from "sinosun-ui";
import authorityApi from "@/service/authorityApi.ts";

export default {
    components: {
        SnButton,
    },
    data() {
        return {
            userInfo: {}, //用户信息
            UAId: "", //编辑的用户ID
            uName: "", //编辑的用户名称
            userAuthIdList: [], //用户从上个页面已经拥有的权限列表
            authTreeShowData: [], //权限树组件数据
            edituserauthinfo: {}, //上个页面传输过来的数据
        };
    },
    created() {
        let _this = this;
        if (getStorage("edituserauthinfo")) {
            _this.edituserauthinfo = JSON.parse(getStorage("edituserauthinfo"));
        }
        console.log("编辑人员信息页面数据==", _this.edituserauthinfo);
        _this.UAId = _this.edituserauthinfo.UAId;
        _this.uName = _this.edituserauthinfo.uName;
        _this.userAuthIdList = _this.edituserauthinfo.userAuthIdList;
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
            _this.getAuthList();
        } else {
            GetUserInfoFunction().then(function (Data) {
                if (Data) {
                    _this.userInfo = Data;
                    setTimeout(() => {
                        _this.getAuthList();
                    }, 300);
                }
            });
        }
        if (window.AlipayJSBridge) {
            initTitleMenu([_this.uName]);
        } else {
            initTitleMenu([
                _this.uName,
                {
                    name: "刷新",
                    menuId: "but_2_0",
                    type: 2,
                    func: function () {
                        _this.getAuthList();
                    },
                },
            ]);
        }
    },

    mounted() {
        $(document).off("click", ".authHaveChildren");
        $(document).on("click", ".authHaveChildren", function () {
            $(this).toggleClass("open");
            $(this).siblings().stop().slideToggle(300);
        });
    },
    methods: {
        //获取权限列表，企业最高管理者可以编辑管理员权限，其他人员不可以
        getAuthList: function () {
            let _this = this;
            let json = {
                companyId: _this.userInfo.cpyId,
                typeIdList: ["2"],
                isAdmin:
                    _this.userInfo.UAId == _this.userInfo.cpyCreatorId
                        ? true
                        : false,
            };
            authorityApi.listControlPermission(json).then(function (result) {
                if (result && result.resultCode == 0) {
                    console.log("获取全部权限数据返回===", result);
                    if (
                        result.result &&
                        result.result.permissionList &&
                        result.result.permissionList.length
                    ) {
                        let permissionListTemp = result.result.permissionList;
                        if (
                            _this.userAuthIdList &&
                            _this.userAuthIdList.length
                        ) {
                            permissionListTemp.forEach((item) => {
                                _this.userAuthIdList.forEach((items) => {
                                    if (items.perId == item.perId) {
                                        item.checked = true;
                                        item.sourceTypeList =
                                            items.sourceTypeList;
                                        item.beginTime = items.beginTime;
                                        item.endTime = items.endTime;
                                    }
                                });
                            });
                        }
                        _this.authTreeShowData = handleAuthTree(
                            permissionListTemp,
                            false,
                            _this.userInfo.UAId == _this.userInfo.cpyCreatorId
                                ? true
                                : false
                        );
                        console.log(
                            "处理后全部权限数据返回===",
                            _this.authTreeShowData
                        );
                    }
                } else {
                    SnToast(result.resultDesc);
                }
            });
        },

        //点击选择权限树节点，角色权限无法删除
        treeChange: function (item) {
            var _this = this;
            if (item.childrenAuth) {
                return;
            }
            if (item.checked) {
                if (_this.isRoleAuth(item)) {
                    SnToast("角色权限无法删除");
                    return;
                }
                _this.$set(item, "checked", false);
            } else {
                _this.$set(item, "checked", true);
            }
        },

        //编辑人员权限
        addAuthDo: function () {
            let _this = this;
            let modifyUserPermissionParam = {
                userId: _this.UAId,
                companyId: _this.userInfo.cpyId,
            };
            let perIdListTemp = [];
            _this.authTreeShowData.forEach((item1) => {
                if (item1.childrenAuth && item1.childrenAuth) {
                    item1.childrenAuth.forEach((item2) => {
                        if (item2.checked) {
                            let perIdLsitObj = {
                                perId: item2.perId,
                                beginTime: item2.beginTime,
                                endTime: item2.endTime,
                            };
                            perIdListTemp.push(perIdLsitObj);
                        }

                        //还有子集
                        if (item2.childrenAuth && item2.childrenAuth) {
                            item2.childrenAuth.forEach((item3) => {
                                if (item3.checked) {
                                    let perIdLsitObj = {
                                        perId: item3.perId,
                                        beginTime: item3.beginTime,
                                        endTime: item3.endTime,
                                    };
                                    perIdListTemp.push(perIdLsitObj);
                                }
                            });
                        }
                    });
                }
            });
            modifyUserPermissionParam.perIdList = perIdListTemp;
            authorityApi
                .modifyPermissionMembers(modifyUserPermissionParam)
                .then(function (result) {
                    if (result && result.resultCode == 0) {
                        SnToast("编辑成功");
                        setTimeout(function () {
                            if (!window.AlipayJSBridge) {
                                _this.$router.goBack();
                            } else {
                                AlipayJSBridge.call("popTo", {
                                    index: -1,
                                    data: {
                                        refreshPage: true,
                                    },
                                });
                            }
                        }, 500);
                    } else {
                        SnToast(result.resultDesc);
                    }
                });
        },

        //判断权限来源是否是角色权限
        isRoleAuth: function (data) {
            let _this = this;
            let isRoleAuth = false;
            if (!!data.sourceTypeList && data.sourceTypeList.length) {
                data.sourceTypeList.forEach((item) => {
                    if (item == 1) {
                        isRoleAuth = true;
                    }
                });
            }
            return isRoleAuth;
        },

        //操作安全硬件及保存安全硬件使用者信息
        setDssUser(selectedUserAuthArr) {
            var _this = this;
            // 要删的
            var delArr = [];
            if (_this.codeAllArr.length && _this.codeHasArr) {
                _this.codeAllArr.forEach(function (item) {
                    if (_this.codeHasArr.indexOf(item.authId) > -1) {
                        delArr.push({
                            UAId: _this.UAId,
                            mCode: item.authName.replace(/机具号/g, ""),
                            mCodeUserId: 1,
                            optType: 2,
                        });
                    }
                });
            }
            // 要加的
            var addArr = [];
            if (_this.codeAllArr.length && selectedUserAuthArr) {
                _this.codeAllArr.forEach(function (item) {
                    selectedUserAuthArr.forEach(function (item2) {
                        if (item2.authId == item.authId) {
                            addArr.push({
                                UAId: _this.UAId,
                                mCode: item.authName.replace(/机具号/g, ""),
                                mCodeUserId: 1,
                                optType: 1,
                            });
                        }
                    });
                });
            }

            if (delArr.length) {
                var json1 = {
                    UAId: _this.userInfo.UAId,
                    cpyId: _this.userInfo.cpyId,
                    mCodeUserList: delArr,
                };
                authorityApi.setMCodeUser(json1).then(function (result) {
                    //设置服务器安全硬件账号成功
                    if (result && result.code == 0) {
                        if (addArr.length) {
                            var json2 = {
                                UAId: _this.userInfo.UAId,
                                cpyId: _this.userInfo.cpyId,
                                mCodeUserList: addArr,
                            };
                            authorityApi
                                .setMCodeUser(json2)
                                .then(function (result) {
                                    //设置服务器安全硬件账号成功
                                });
                        }
                    }
                });
            } else {
                if (addArr.length) {
                    var json2 = {
                        UAId: _this.userInfo.UAId,
                        cpyId: _this.userInfo.cpyId,
                        mCodeUserList: addArr,
                    };
                    authorityApi.setMCodeUser(json2).then(function (result) {
                        //设置服务器安全硬件账号成功
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
.childrenWrap {
    display: none;
}
.usedContactDiv {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 2;
    transition: left 0.25s;
    background: #fff;
    margin: 0 auto;
}
.contactsShow {
    left: 0;
}
.quick_name_box {
    position: absolute;
    margin-bottom: 1rem;
    font-size: 0.32rem;
    color: #7f7f7f;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    overflow-y: auto;
}
.queding_button_box {
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

.treeWrap {
    margin-top: 0.3rem;
}
.treeWrap div.tree {
    margin-left: 0;
}
.tree {
    line-height: 1.08rem;
}
.title {
    position: relative;
    font-size: 0.32rem;
    padding: 0 0.3rem;
    cursor: pointer;
    transition: all 0.3s;
}
.authHaveChildren {
    position: relative;
}
.authHaveChildren:before {
    content: "";
    display: block;
    position: absolute;
    top: 50%;
    margin-top: -0.16rem;
    width: 0.32rem;
    height: 0.32rem;
    background: url(../../../../assets/img/authority/navigation.png) no-repeat
        center;
    background-size: 0.32rem;
    transition: all 0.3s;
    transform-origin: 50% 50%;
    transform: rotateZ(-90deg);
}
.authHaveChildren.open:before {
    transform: rotateZ(0deg);
}
.childMenu {
    padding-left: 0.42rem;
}
.title.active {
    background: #dae8fd;
    color: @colour-blue;
}
.title:hover {
    background: @color-bgc;
}
.treeNode > .title span {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 21px;
}
.treeNode > .children .title span {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 21px;
}
.modalTree {
    .treeWrap {
        margin-top: 0px;
        color: #191919;
    }
    .check {
        background: url(../../../../assets/img/authority/tycheck.png) no-repeat
            0.3rem center;
        background-size: 0.39rem;
    }
    .checked {
        background: url(../../../../assets/img/authority/tychecked.png)
            no-repeat 0.3rem center;
        background-size: 0.39rem;
    }
    .children .title {
        padding-left: 0.9rem;
    }
    .title:after {
        content: " ";
        position: absolute;
        left: 0.3rem;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .children .title:after {
        content: " ";
        position: absolute;
        left: 0.9rem;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .children .children .title:after {
        content: " ";
        position: absolute;
        left: 1.5rem;
        bottom: 0;
        right: 0;
        height: 0px;
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
        transform: scaleY(0.5);
    }
    .children .children .title {
        padding-left: 1.5rem;
    }
    .children .children .check {
        background: url(../../../../assets/img/authority/tycheck.png) no-repeat
            0.9rem center;
        background-size: 0.4rem;
    }
    .children .children .checked {
        background: url(../../../../assets/img/authority/tychecked.png)
            no-repeat 0.9rem center;
        background-size: 0.4rem;
    }
}

@media screen and (min-width: @pc-width) {
    .childrenWrap {
        display: none;
    }
    .usedContactDiv {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        // width: 100%;
        z-index: 2;
        transition: left 0.25s;
        background: #fff;
        max-width: 1080px;
        margin: 0 auto;
    }
    .contactsShow {
        left: 0;
    }
    .quick_name_box {
        position: absolute;
        margin-bottom: 50px;
        font-size: 14px;
        color: #7f7f7f;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        overflow-y: auto;
    }
    .queding_button_box {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        box-sizing: border-box;
        -moz-box-sizing: border-box;
        -webkit-box-sizing: border-box;
        z-index: 13;
        background-color: @color-bgc;
        padding: 0;
        .sn-button {
            margin: 0px auto;
            border: none;
        }
    }
    .treeWrap {
        margin-top: 0.3rem;
    }
    .treeWrap div.tree {
        margin-left: 0;
    }
    .tree {
        line-height: 54px;
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
        padding-left: 45px;
    }
    .authHaveChildren {
        position: relative;
    }
    .authHaveChildren:before {
        content: "";
        display: block;
        position: absolute;
        top: 50%;
        margin-top: -8px;
        width: 16px;
        height: 16px;
        background: url(../../../../assets/img/authority/navigation.png)
            no-repeat center;
        background-size: 16px;
        transition: all 0.3s;
        transform-origin: 50% 50%;
        transform: rotateZ(-90deg);
    }
    .authHaveChildren.open:before {
        transform: rotateZ(0deg);
    }
    .childMenu {
        padding-left: 21px;
    }
    .title.active {
        background: #dae8fd;
        color: @colour-blue;
    }
    .title:hover {
        background: @color-bgc;
    }
    .treeNode > .title span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 0.42rem;
    }
    .treeNode > .children .title span {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-left: 0.42rem;
    }
    .modalTree {
        .treeWrap {
            margin-top: 0px;
            color: #191919;
        }
        .check {
            background: url(../../../../assets/img/authority/tycheck.png)
                no-repeat 15px center;
            background-size: 20px;
        }
        .checked {
            background: url(../../../../assets/img/authority/tychecked.png)
                no-repeat 15px center;
            background-size: 20px;
        }
        .children .title {
            padding-left: 45px;
        }

        .title:after {
            content: " ";
            position: absolute;
            left: 15px;
            bottom: 0;
            right: 0;
            height: 0px;
            border-top: 1px solid #ededed;
            -webkit-transform-origin: left bottom;
            transform-origin: left bottom;
            transform: scaleY(0.5);
        }
        .children .title:after {
            content: " ";
            position: absolute;
            left: 45px;
            bottom: 0;
            right: 0;
            height: 0px;
            border-top: 1px solid #ededed;
            -webkit-transform-origin: left bottom;
            transform-origin: left bottom;
            transform: scaleY(0.5);
        }
        .children .children .title:after {
            content: " ";
            position: absolute;
            left: 75px;
            bottom: 0;
            right: 0;
            height: 0px;
            border-top: 1px solid #ededed;
            -webkit-transform-origin: left bottom;
            transform-origin: left bottom;
            transform: scaleY(0.5);
        }
        .children .children .check {
            background: url(../../../../assets/img/authority/tycheck.png)
                no-repeat 45px center;
            background-size: 20px;
        }
        .children .children .checked {
            background: url(../../../../assets/img/authority/tychecked.png)
                no-repeat 45px center;
            background-size: 20px;
        }
    }
}
</style>

