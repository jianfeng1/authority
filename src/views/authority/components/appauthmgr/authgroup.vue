<template>
	<div class="authgroups">
        <SnLoading :spinning="loading" :turn="loading" size="small" tip="正在加载"/>
        <SnEmpty
            v-if="!loading && 0 == authGroupList.length"
            image="../resource/img/noInfo.png"
            desc="权限信息为空"
        />
		
		<div class="outWrap" :class="{bigbottom:true}" v-else-if="!isPC">
            <div class="content" v-for="(item,ind) in authGroupList" :key="ind">
                <SnListItem 
                    :title="item.name"
                    value-position="left"
                    right-icon="right"
                    @click="gotoPage(item)"
                />
            </div>
		</div>
		
		<div class="outWrap" :class="{bigbottom:true}" v-else>	 			
            <div class="lineWrap noTopBorder">
                <div class="line" v-for="(item,ind) in authGroupList" @click="gotoPage(item)" :key="ind">
                    <div class="linetext">{{item.authName}}</div>
                </div>
            </div>	 			
        </div> 
        <!-- 当该页面是展示安全硬件权限时，底部添加审批额度按钮隐藏 -->
		<div class="submitButWrap" style="box-sizing: border-box;">
            <SnButton v-if="!view && !isbbMgr"  @click="addApproveAmountShow" type="primary">添加审批额度</SnButton>	
		</div>
        <div v-show="addApproveAmountmodalShow" class="inputModelWrap">
            <div class="inputModeBg" @click="closeModel()"></div>
			<div class="inputModel">
				<div class="title">添加审批额度</div>
				<input type="text" v-model="approveAmount" v-on:input="inputFrtValue($event.target.value)" placeholder="请输入审批额度" maxlength="14">
                <div class="butWrap addBuBtn">
					<div class="cancel but" @click="closeModel()">取消</div>
					<div class="ok but" @click="addApproveAmountDo()">确认</div>
				</div>	
			</div>
		</div>
	</div>		
</template>

<script>
import {
    registerHandler,
    GetUserInfoFunction,
    PromiseJSBridgeReady,
} from "sinosun-ui/lib/support/native/JSBridge";
import { notifyAppBackEvent } from "../../../../lib/common/SnJsBridge";
import {
    throttle,
    initTitleMenu,
    setStorage,
    getStorage,
    isPC,
    showConfirm,
} from "../../../../utils/commonUtil";
import { SnButton, SnEmpty, SnToast, SnLoading, SnListItem } from "sinosun-ui";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        SnButton,
        SnEmpty,
        SnLoading,
        SnListItem,
    },
    data() {
        return {
            loading: true, //数据加载中
            userInfo: {}, //用户信息
            authGroupList: [], //权限树
            addApproveAmountmodalShow: false, //添加审批额度弹框是否显示
            approveAmount: "", //审批额度
            isPC: false,
            view: false, //能否编辑权限
            authGroupQuery: {}, //权限信息
            isbbMgr: false, //是否是权限硬件权限
        };
    },
    created() {
        let _this = this;
        if (getStorage("authGroupQuery")) {
            _this.authGroupQuery = JSON.parse(getStorage("authGroupQuery"));
        }
        _this.view = _this.authGroupQuery.view;
        _this.isbbMgr =
            _this.authGroupQuery.bisCode.indexOf("bbMgr") > -1 ? true : false;
        if (isPC()) {
            _this.isPC = true;
        }
        if (window.AlipayJSBridge) {
            initTitleMenu([_this.authGroupQuery.name]);
        } else {
            initTitleMenu([
                _this.authGroupQuery.name,
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
        PromiseJSBridgeReady(function () {
            if (!window.AlipayJSBridge) {
                notifyAppBackEvent(); //调用app，通知返回事件
                registerHandler("notifyAppBack", function () {
                    //点击app返回事件
                    throttle(
                        function () {
                            _this.$router.push({ path: "/" });
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
                    setTimeout(() => {
                        _this.initData();
                    }, 300);
                }
            });
        }
    },
    mounted() {},
    methods: {
        initData() {
            var _this = this;
            _this.loading = true;
            let json = {
                companyId: _this.userInfo.cpyId,
                typeIdList: ["2"],
            };
            authorityApi.listControlPermission(json).then(function (result) {
                _this.loading = false;
                if (result && result.resultCode == 0) {
                    if (result.permissionList && result.permissionList.length) {
                        result.permissionList.forEach(function (itemW) {
                            if (
                                itemW.authName == _this.authGroupQuery.tag &&
                                itemW.childrenAuth &&
                                itemW.childrenAuth.length
                            ) {
                                itemW.childrenAuth.forEach(function (item) {
                                    if (
                                        item.name == _this.authGroupQuery.name
                                    ) {
                                        _this.authGroupList = _this.sortAmount(
                                            item.childrenAuth
                                        );
                                    }
                                });
                            }
                        });
                    }
                }
            });
        },

        //跳转到权限详情页，安全硬件管理权限需要单独处理
        gotoPage(item) {
            let _this = this;
            item.isFromAuthgroup = true; //标记是从authgroup跳转过去
            item.view = _this.view; //标记是从authgroup跳转过去
            if (item.bisCode.indexOf("bbMgr") >= 0) {
                //安全硬件管理权限
                setStorage("ddsauthDetail", JSON.stringify(item));
                if (!window.AlipayJSBridge) {
                    _this.$router.push({ path: "ddsauthDetail" });
                } else {
                    AlipayJSBridge.call("pushWindow", {
                        url: "appauthmgr.html#/ddsauthDetail",
                    });
                }
            } else {
                setStorage("authDetailQuery", JSON.stringify(item));
                if (!window.AlipayJSBridge) {
                    _this.$router.push({ path: "authDetail" });
                } else {
                    AlipayJSBridge.call("pushWindow", {
                        url: "appauthmgr.html#/authDetail",
                    });
                }
            }
        },
        //关闭model框
        closeModel() {
            var _this = this;
            _this.addApproveAmountmodalShow = false;
        },
        //添加审批额度显示
        addApproveAmountShow: function () {
            var _this = this;
            _this.approveAmount = "";
            _this.addApproveAmountmodalShow = true;
        },
        //添加审批额度
        addApproveAmountDo: function () {
            let _this = this;
            if ("" == _this.approveAmount) {
                SnToast("请输入审批额度");
                return;
            }
            let reg = /\s/;
            if (reg.test(_this.approveAmount)) {
                SnToast("审批额度不能包含空格");
                return;
            }
            let patrn = /^[0-9]*$/;
            if (!patrn.test(_this.approveAmount)) {
                SnToast("审批额度只能是整数");
                return;
            }
            if (0 == _this.approveAmount) {
                SnToast("审批额度不能为0");
                return;
            }
            let json = {
                addPermissionList: [
                    {
                        bisCode: `${_this.authGroupQuery.bisCode}_${_this.approveAmount}`,
                        bisValue: `${Number(_this.approveAmount) * 100}`,
                        name: `${_this.authGroupQuery.name}：${_this.approveAmount}元`,
                        perType: "2",
                        resourceType: "data",
                        companyId: _this.userInfo.cpyId,
                        tag: _this.authGroupQuery.tag,
                        bis: `amount`,
                    },
                ],
            };
            authorityApi.addPermission(json).then(function (result) {
                if (result && result.resultCode == 0) {
                    if (
                        result.result.repeateBisCodeList &&
                        result.result.repeateBisCodeList.length
                    ) {
                        if (
                            result.result.repeateBisCodeList.includes(
                                `${_this.authGroupQuery.bisCode}_${_this.approveAmount}`
                            )
                        ) {
                            SnToast("该额度已存在");
                            return;
                        }
                    }
                    _this.initData();
                    _this.closeModel();
                    SnToast("添加成功");
                }
            });
        },
        //校验数字前面无效的0
        regexParse: function (valueItem) {
            var _this = this;
            var value = (valueItem + "")
                .replace(/[^\d.]/g, "")
                .replace(/\.{2,}/g, ".")
                .replace(".", "$#$")
                .replace(/\./g, "")
                .replace("$#$", "."); //去掉非数字字符

            if (value.split(".")[0].indexOf("0") == 0) {
                var a = value.split(".")[0];
                var inter = a.replace(/\b(0+)/gi, ""); //如果第一位是0,则替换前面的0为空
                if (inter == "") {
                    inter = "0";
                }

                if (value.split(".").length == 1) {
                    value = inter;
                } else if (value.split(".").length == 2) {
                    value = inter + "." + value.split(".")[1];
                }
            }
            _this.approveAmount = value;
        },
        inputFrtValue: function (value) {
            this.regexParse(value);
        },

        //对额度进行排序，如果是密码器则不需要排序
        sortAmount(array) {
            if (array[0].bisCode.indexOf("bbMgr") < 0) {
                for (var i = 0; i < array.length - 1; i++) {
                    for (var j = 0; j < array.length - i - 1; j++) {
                        if (
                            Number(array[j].bis.split("_")[1]) >
                            Number(array[j + 1].bis.split("_")[1])
                        ) {
                            var tmp = array[j];
                            array[j] = array[j + 1];
                            array[j + 1] = tmp;
                        }
                    }
                }
            }
            return array;
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";
.authgroups {
    .outWrap {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0.92rem;
        padding-bottom: 0.3rem;
        overflow-y: auto;
    }
    .outWrap.bigbottom {
        bottom: 1.2rem;
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

    //input model框
    .inputModelWrap {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 502;

        .inputModeBg {
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 100;
        }

        .inputModel {
            position: inherit;
            display: table;
            width: 80%;
            max-width: 500px;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            margin: auto;
            background-color: #fff;
            text-align: center;
            border-radius: 0.2rem;
            overflow: hidden;
            z-index: 503;

            .title {
                padding: 0.4rem 0.5rem;
                font-size: 0.36rem;
            }

            input {
                width: 80%;
                border: 0.5px solid #dedede;
                border-radius: 0.08rem;
                padding: 0.14rem 0.1rem;
                appearance: none;
                outline: none;
                font-size: 0.28rem;
                margin: 0 auto 0.6rem auto;
            }

            .butWrap {
                position: relative;
                line-height: 0.9rem;
                font-size: 0.3rem;
                display: flex;
                border-top: 0.5px solid #dedede;
                .modalBut {
                    height: 0.88rem;
                    flex: 1;
                }
                .fixBut {
                    color: @colour-blue;
                }
            }

            .but {
                display: block;
                flex: 1;
                text-decoration: none;
                position: relative;
                height: 1.06rem;
                line-height: 1.06rem;
                text-align: center;
                color: @colour-blue;
                width: 50%;
                cursor: pointer;
                flex: initial;
            }

            .but.cancel {
                color: #333 !important;
                background-color: #fff !important;
                width: 50%;
                border-right: 0.5px solid #dedede;
                border-radius: 0;
            }
        }
    }
}
.child-view {
    background-color: @color-bgc !important;
}

@media screen and (min-width: @pc-width) {
    body {
        background: #fff;
    }
    .outWrap {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        padding-bottom: 15px;
        overflow-y: auto;
    }
    .outWrap.bigbottom {
        bottom: 70px;
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
        border-top: 1px solid #ededed;
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
        border-top: 1px solid #ededed;
        -webkit-transform-origin: left bottom;
        transform-origin: left bottom;
    }
    .line {
        line-height: 54px;
        font-size: 14px;
        color: #333;
        cursor: pointer;
    }
    .linetext {
        position: relative;
        padding-left: 15px;
        padding-right: 40px;
        background: url(../../../../assets/img/authority/right.png) no-repeat
            right 16px center;
        background-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        text-align: center;
        border-radius: 0.2rem;
        cursor: pointer;
        border: 1px solid #e32d2d;
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
    .submitButWrap {
        background: #fff;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
    }
    //input model框
    .inputModel {
        position: inherit;
        display: table;
        width: 295px;
        max-width: 295px;
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
        font-size: 16px;
    }
    .inputModelWrap input {
        width: 80%;
        border: 0.5px solid #dedede;
        border-radius: 4px;
        padding: 7px 10px;
        -webkit-appearance: none;
        appearance: none;
        outline: none;
        font-size: 14px;
        margin: 0 auto 30px auto;
        height: 20px;
        line-height: 20px;
    }
    .inputModelWrap .butWrap {
        position: relative;
        line-height: 30px;
        font-size: 14px;
        border-top: 0.5px solid #dedede;
        display: flex;
        justify-content: space-between;
    }
    .inputModelWrap .but.ok:after,
    .inputModelWrap .butWrap:after {
        display: none;
    }
    .inputModelWrap .but {
        // width: 90px;
        height: 44px;
        line-height: 44px;
        border-radius: 3px;
        text-align: center;
        color: @colour-blue;
        width: 50%;
        cursor: pointer;
        flex: initial;
    }
    .inputModelWrap .but.cancel {
        color: #333 !important;
        background-color: #fff !important;
        width: 50%;
        border-right: 0.5px solid #dedede;
        border-radius: 0;
    }
}
@media screen and (max-width: @pc-width) {
    .inputModelInput {
        width: 6.5rem !important;
    }
    .submitButWrap {
        display: flex !important;
        padding: 0.2rem 0.3rem !important;
        flex-wrap: nowrap !important;
    }
    .modelTwo {
        width: 100% !important;
        height: 100% !important;
        .inputModelInput {
            margin: 0.2rem 0.3rem !important;
            border: none;
            border-bottom: 1px solid #dedede;
            border-radius: 0;
        }
        .popupInput {
            margin: 0 !important;
            width: 6.5rem !important;
            border: none;
            border-bottom: 1px solid #dedede;
            border-radius: 0;
        }
        .addBuBtn {
            display: flex;
            position: absolute;
            bottom: 0;
            width: 100%;
        }
        .SnTree .weui-cell:after {
            display: none !important;
        }
    }
}
</style>

