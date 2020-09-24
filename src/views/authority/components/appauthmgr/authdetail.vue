<template>
	<div>
		<div class="outWrap">
			<div class="lineWrap">
				<div class="line">
					<div class="tabBut" :class="{titleChecked:tabValue == 'user'}" @click="tableChange('user')">人员</div>
					<div class="tabBut" :class="{titleChecked:tabValue == 'role'}" @click="tableChange('role')">角色</div>
				</div>
			</div>
		</div>
		<div class="topTipsWrap" v-if="tipsShow">
			<span class="topTips">企业最高管理者拥有所有权限</span>
		</div>
        <!-- 人员信息 -->
        <div :class="{mt50:!view,imgFlx:!loading && 0 == authUserList.length,tipsShowStyle:tipsShow}" v-show="tabValue == 'user'" >
            <div class="contentWrap">
                <div class="cardWrap">
                    <SnEmpty
                        v-if="!loading && 0 == authUserList.length && isDelSuccess"
                        image="../resource/img/noInfo.png" 
                        desc="暂无人员拥有该权限"
                    />
                    <div class="cardLineWrap borderB" v-for="(item,index) in authUserList" @click.stop="gotoUserAndRoleDetail(item,index)" :key="index">
                        <SnAvatar class="cardIcon"  :uaid = item.userId></SnAvatar>
                        <div class="textWrap" :class="{noRight:view}">
                            <div class="textName">{{item.name}}</div>
                            <div class="date in" v-if="1==item.authValidity">永久有效</div>
                            <div class="date" :class="authDateStyleMap[item.authValidityType]" v-else-if="2==item.authValidity">{{authDateTypeMap[item.authValidityType]+'：'+new Date(item.beginTime*1000).format('yyyy-MM-dd')+' - '+new Date(item.endTime*1000).format('yyyy-MM-dd')}}</div>																										
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- 角色信息 -->
        <div :class="{mt50:!view,imgFlx:!loading && 0 == authRoleList.length ,tipsShowStyle:tipsShow}" v-show="tabValue == 'role'" >
            <div class="contentWrap" >
                <div class="cardWrap">	
                    <SnEmpty
                            v-if="!loading && 0 == authRoleList.length && isDelSuccess"
                        image="../resource/img/noInfo.png"
                        desc="暂无角色拥有该权限"
                    />
                    <div class="cardLineWrap borderB" v-for="(item,index) in authRoleList" @click.stop="gotoUserAndRoleDetail(item,index)" :key="index">
                        <div class="textWrap rolepad" :class="{noRight:view}">
                            <div class="textName">{{item.roleName}}</div>
                            <div class="date in" v-if="1==item.authValidity">永久有效</div>
                            <div class="date" :class="authDateStyleMap[item.authValidityType]" v-else-if="2==item.authValidity">{{authDateTypeMap[item.authValidityType]+'：'+new Date(item.beginTime*1000).format('yyyy-MM-dd')+' - '+new Date(item.endTime*1000).format('yyyy-MM-dd')}}</div>																										
                        </div>
                    </div>
                </div>
            </div>	
        </div>	 
        <div class="delPermissionBut" @click="deletePermission()" v-if="candelete && !view"><span>删除该权限</span></div>
        <div class="submitButWrap" v-if="!view">
            <SnButton v-if="tabValue == 'user'"  @click="adduser" type="primary">添加人员</SnButton>
            <SnButton v-if="tabValue == 'role'"  @click="addrole" type="primary">添加角色</SnButton>
        </div> 
	</div>		
</template>

<script>
import {
    notifyAppBackEvent,
    OpenActionFunction,
    QueryUserInfoFunction,
} from "../../../../lib/common/SnJsBridge";
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
    showConfirm,
} from "../../../../utils/commonUtil";
import { sortUserListByName } from "../../../../utils/authorityUtil";
import SnAvatar from "../components/SnAvatar/SnAvatar.vue";
import { SnButton, SnEmpty, SnToast } from "sinosun-ui";
import authDateTypeMap from "@/model/AuthDateType";
import authDateStyleMap from "@/model/AuthDateStyle";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        // VueLazyLoad,
        SnAvatar,
        SnButton,
        SnEmpty,
    },
    data() {
        return {
            loading: true, //数据加载中
            userInfo: {}, //用户信息
            authDetailQuery: {}, //权限信息对象
            candelete: false, //该权限能否删除
            userIdList: [], //已经拥有权限的人员ID列表，新增人员时，需要屏蔽这部分人员信息
            authUserList: [], //人员信息
            authRoleList: [], //角色信息
            authRoleIdList: [], //角色ID列表
            tabValue: "user", //显示用户还是角色
            isFromAuthgroup: false, //是否是从authgroup页面跳转进来
            authDateTypeMap, //权限有效期状态
            authDateStyleMap, //权限有效期状态
            view: false, //是否只展示信息
            tipsShow: false, //是否是最高管理者
            isDelSuccess: false,
            isResume: false,
        };
    },
    created() {
        let _this = this;
        if (getStorage("authDetailQuery")) {
            _this.authDetailQuery = JSON.parse(getStorage("authDetailQuery"));
        }
        _this.tabValue = _this.authDetailQuery.tabValue || "user";
        _this.view = _this.authDetailQuery.view || false;
        if (
            _this.authDetailQuery.bisCode &&
            _this.authDetailQuery.bisCode == "2_-1_funMgr"
        ) {
            _this.tipsShow = true;
        }
        _this.candelete = _this.getCandeleteValue();
        document.addEventListener("resume", function (event) {
            let refreshPage = (event.data && event.data.refreshPage) || false;
            if (refreshPage) {
                _this.isResume = true;
                _this.loading = true;
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
            }
        });
        if (!_this.isResume) {
            PromiseJSBridgeReady(function () {
                if (!window.AlipayJSBridge) {
                    notifyAppBackEvent(); //调用app，通知返回事件
                    registerHandler("notifyAppBack", function () {
                        //点击app返回事件
                        throttle(
                            function () {
                                if (_this.isFromAuthgroup) {
                                    //如果是从authgroup页面跳转过来，返回到原来页面，authGroupQuery缓存数据还在，不需要重复缓存
                                    _this.$router.push({ path: "authgroup" });
                                } else {
                                    if (
                                        !navigator.userAgent.match(
                                            /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
                                        ) &&
                                        _this.view
                                    ) {
                                        _this.$router.goBack(); //隐藏pc客户端权限查询的返回图标
                                    } else {
                                        _this.$router.push({ path: "/" });
                                    }
                                }
                            }.bind(this)
                        );
                    });
                }
            });
            if (getStorage("userInfo")) {
                _this.userInfo = JSON.parse(getStorage("userInfo"));
                _this.initData();
            } else {
            }
        }
    },
    mounted() {
        let _this = this;
        if (window.AlipayJSBridge) {
            initTitleMenu([_this.authDetailQuery.name]);
        } else {
            initTitleMenu([
                _this.authDetailQuery.name,
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
        this.$nextTick(function () {});
    },

    methods: {
        initData() {
            let _this = this;
            _this.isFromAuthgroup =
                _this.authDetailQuery.isFromAuthgroup || false;
            let Json = {
                perId: _this.authDetailQuery.perId,
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
                        _this.authRoleList = [];
                        _this.authRoleIdList = [];
                        if (
                            result.result.roleList &&
                            result.result.roleList.length
                        ) {
                            _this.authRoleList = result.result.roleList;
                            _this.authRoleList.forEach((item) => {
                                _this.authRoleIdList.push(item.roleId);
                            });
                        }

                        _this.isDelSuccess = true;
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
					console.log(Data);
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
                        for (var i = 0; i < userList.length; i++) {
                            if (!userList[i].name) {
                                userList.splice(i, 1);
                                i--;
                            }
                        }
                        userList = sortUserListByName(userList, false);
                        res(userList);
                    }
                });
            });
        },

        //添加权限人员信息
        modifyPermission(type = "user", infoList = []) {
            let _this = this;
            _this.loading = false;
            let modifyParam = {
                perId: _this.authDetailQuery.perId,
                companyId: _this.authDetailQuery.companyId,
                resourceType: "data",
            };
            if (infoList.length > 0) {
                if (type == "user") {
                    modifyParam.userList = infoList;
                } else {
                    modifyParam.roleList = infoList;
                }
            }
            authorityApi.modifyPermission(modifyParam).then(function (result) {
                _this.loading = true;
                if (result && result.resultCode == 0) {
                    _this.initData();
                    SnToast("添加成功");
                }
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
                    { key: "select_model", value: "1", type: "string" },
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
                if (selectUser.length > 0) {
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
                    _this.modifyPermission("user", userList);
                }
            });
        },

        //跳转到人员角色详情页面
        gotoUserAndRoleDetail(item) {
            var _this = this;
            _this.isDelSuccess = false;
            if (_this.view) {
                return;
            } else {
                //打开权限人员或者角色有效期编辑页面
                _this.authDetailQuery.userOrRoleObj = item;
                _this.authDetailQuery.tabValue = _this.tabValue;
                _this.authDetailQuery.isFrom = "authdetail";
                setStorage(
                    "authDataObj",
                    JSON.stringify(_this.authDetailQuery)
                );
                if (!window.AlipayJSBridge) {
                    _this.$router.push({ path: "authdate" });
                } else {
                    AlipayJSBridge.call("pushWindow", {
                        url: "appauthmgr.html#/authdate",
                    });
                }
            }
        },

        //删除整个权限；当bisCode格式为xxx_xxx_xxx_xxx且最后面的不是-1是，允许删除
        deletePermission() {
            let _this = this;
            showConfirm("确认删除此权限？", function () {
                let json = {
                    perIdList: [_this.authDetailQuery.perId],
                };
                authorityApi.deletePermission(json).then(function (result) {
                    if (result && result.resultCode == 0) {
                        SnToast("删除成功");
                        _this.$router.push({ path: "authgroup" });
                    }
                });
            });
        },

        //增加角色信息，角色信息页面只有这一个入口
        addrole: function () {
            var _this = this;
            _this.authDetailQuery.authRoleIdList = _this.authRoleIdList;
            setStorage(
                "chooseRoleQuery",
                JSON.stringify(_this.authDetailQuery)
            );
            if (!window.AlipayJSBridge) {
                _this.$router.push({ path: "chooserole" });
            } else {
                AlipayJSBridge.call("pushWindow", {
                    url: "appauthmgr.html#/chooserole",
                });
            }
        },

        //tab页切换
        tableChange: function (key) {
            let _this = this;
            _this.tabValue = key;
        },

        //判断当前权限能够被删除,xxx_xxx_xxx_-1的权限不能被删除
        getCandeleteValue() {
            let _this = this;
            let candeleteValue = false;
            if (_this.authDetailQuery.bisCode) {
                let bisCodeArr = _this.authDetailQuery.bisCode.split("_");
                if (
                    bisCodeArr.length > 3 &&
                    bisCodeArr[bisCodeArr.length - 1] != "-1"
                ) {
                    candeleteValue = true;
                }
            }
            return candeleteValue;
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";
.outWrap {
    .lineWrap {
        position: relative;
        background: #fff;

        .line {
            display: flex;
            justify-content: space-around;
            vertical-align: top;
            height: 0.84rem;
            line-height: 0.84rem;

            .tabBut {
                cursor: pointer;
                padding-bottom: 0.1rem;
                font-size: 0.3rem;
            }
            .tabBut.active {
                color: @colour-blue;
                border-bottom: 3px solid @colour-blue;
            }
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
    .lineWrap:after {
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
}

.topTipsWrap {
    height: 1.2rem;
    line-height: 1.2rem;
    text-align: center;
    .topTips {
        font-size: 0.28rem;
        color: #999;
        padding-left: 0.42rem;
        background: url(../../../../assets/img/authority/icon_tips.png)
            no-repeat left;
        background-size: 0.32rem;
    }
}

.mt50 {
    margin-bottom: 0rem;
    position: absolute;
    top: 0.92rem;
    left: 0;
    right: 0;
    bottom: 1rem;
    overflow-y: auto;
    background-color: #fff;
    margin: 0 auto;
}
.tipsShowStyle {
    top: 2.06rem;
}

.contentWrap {
    .titleText {
        display: -ms-flexbox;
        display: -webkit-box;
        display: -webkit-flex;
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
            padding: 0 0.26rem 0 0.3rem;
            background: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
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
                -webkit-box-flex: 1;
                -moz-box-flex: 1;
                -webkit-flex: 1;
                -ms-flex: 1;
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
                    font-size: 0.26rem;
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
            .rolepad {
                margin-left: 0;
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
        top: 46px;
        left: 0;
        right: 0;
        bottom: 50px;
        overflow-y: auto;
        background-color: #fff;
        margin: 0 auto;
        max-width: 1080px;
        // border-bottom: 1px solid #e5e5e5;
    }
    .tipsShowStyle {
        top: 103px;
    }
    .lineWrap {
        position: relative;
        background: #fff;
    }
    .line {
        display: flex;
        justify-content: space-around;
        border-bottom: 1px solid @color-bgc;
        vertical-align: top;
        height: 44px;
        line-height: 44px;
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
                padding: 0 13px 0 15px;
                background: #fff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
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
                    -webkit-box-flex: 1;
                    -moz-box-flex: 1;
                    -webkit-flex: 1;
                    -ms-flex: 1;
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
                        font-size: 13px;
                    }
                }
                .textWrap.noRight {
                    background: none;
                }
                .rolepad {
                    margin-left: 0;
                }
            }
        }
        .noInfo {
            // margin-top: 75px;
            height: 25px;
            padding-top: 125px;
            text-align: center;
            font-size: 14px;
            line-height: 25px;
            color: #b2b2b2;
            background: url(../../../../assets/img/authority/noInfo.png)
                no-repeat center;
            background-size: 135px;
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
        height: 60px;
        line-height: 60px;
        text-align: center;
        background: #fff;
        .topTips {
            font-size: 13px;
            color: #999;
            padding-left: 32px;
            background: url(../../../../assets/img/authority/icon_tips.png)
                no-repeat left 16px center;
            background-size: 13px;
        }
    }
    .titTips {
        position: relative;
    }
    .blueBut {
        position: absolute;
        top: 50%;
        margin-top: -12px;
        right: 20px;
        display: inline-block;
        line-height: 24px;
        font-size: 14px;
        color: @colour-blue;
        text-align: center;
        border-radius: 3px;
        cursor: pointer;
    }
    .pcdisplay {
        display: none !important;
    }
    .tabBut {
        cursor: pointer;
        padding-bottom: 7px;
        font-size: 15px;
    }
    .tabBut.active {
        color: @colour-blue;
        border-bottom: 2px solid @colour-blue;
    }
}
.titleChecked {
    border-bottom: 2px solid @colour-blue;
    color: @colour-blue;
}
.imgFlx {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80%;
}

@media screen and (min-width: @screen-md-min) {
    .submitBut {
        width: 300px !important;
    }
    .mt50 {
        padding: 0 50px;
    }
}

//删除该权限样式
.delPermissionBut {
    text-align: center;
    bottom: 1.5rem;
    width: 100%;
    color: red;
    position: fixed;
}
</style>

