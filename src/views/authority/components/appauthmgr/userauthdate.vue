<template>
    <div class="userauthdatas">
        <div class="mt50">
            <div class="cardLineWrap">
                <SnAvatar class="cardIcon"  :uaid = UAId></SnAvatar>
                <div class="textWrap">
                    <div class="textName">{{uName}}</div>
                    <div class="date in" v-if="1==initItemJson.authValidity">永久有效</div>
                    <div class="date" :class="authDateStyleMap[initItemJson.authValidityType]" v-else-if="2==initItemJson.authValidity">{{authDateTypeMap[initItemJson.authValidityType]+'：'+new Date(initItemJson.beginTime*1000).format('yyyy-MM-dd')+' - '+new Date(initItemJson.endTime*1000).format('yyyy-MM-dd')}}</div>																										
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
        </div>
        <div class="submitButWrap">
            <SnButton @click="modifyAuth" type="primary">提交</SnButton>
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
    getStorage,
} from "../../../../utils/commonUtil";
import { imgBase64Map } from "../../../../service/imgBase64Map";
import authDateTypeMap from "@/model/AuthDateType";
import authDateStyleMap from "@/model/AuthDateStyle";
import authorityApi from "@/service/authorityApi.ts";
import SnAvatar from "../components/SnAvatar/SnAvatar.vue";
import {
    SnListItem,
    SnButton,
    SnWhiteSpace,
    SnRangePicker,
    SnToast,
} from "sinosun-ui";
export default {
    components: {
        SnButton,
        SnAvatar,
        SnListItem,
        SnWhiteSpace,
        SnRangePicker,
    },
    data() {
        return {
            loading: true, //数据加载中
            userInfo: {}, //用户信息
            UAId: 0,
            uName: "",
            radioList: [
                { id: 1, text: "永久" },
                { id: 2, text: "自定义" },
            ],
            authValidity: 1, //存储当前有效期类型：1=永久；2=自定义
            initItemJson: {}, //初始化数据，顶部显示用
            timeJson: [], // 事件插件数据
            authDateTypeMap, //权限有效期状态
            authDateStyleMap, //权限有效期状态
            userauthdate: {},
        };
    },
    created() {
        let _this = this;
        if (getStorage("userauthdate")) {
            _this.userauthdate = JSON.parse(getStorage("userauthdate"));
        }
        _this.UAId = _this.userauthdate.UAId;
        _this.uName = _this.userauthdate.uName;
        _this.initItemJson = JSON.parse(_this.userauthdate.item);
        _this.initData();
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
                        _this.initData();
                    },
                },
            ]);
        }
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
        } else {
            GetUserInfoFunction().then(function (Data) {
                if (Data) {
                    _this.userInfo = Data;
                }
            });
        }
    },
    mounted() {},
    methods: {
        //初始化页面数据
        initData() {
            let _this = this;
            if (_this.initItemJson.authValidity) {
                _this.authValidity = _this.initItemJson.authValidity;
            }
            if (2 == _this.authValidity) {
                _this.timeJson.push(
                    new Date(_this.initItemJson.beginTime * 1000).format(
                        "yyyy-MM-dd"
                    )
                );
                _this.timeJson.push(
                    new Date(_this.initItemJson.endTime * 1000).format(
                        "yyyy-MM-dd"
                    )
                );
            } else if (1 == _this.authValidity) {
                let nowTime = new Date(new Date().setHours(0, 0, 0, 0));
                _this.timeJson.push(nowTime.getTime());
                _this.timeJson.push(nowTime.getTime());
            }
        },

        //单选框点击事件
        changeCheck: function (item) {
            let _this = this;
            _this.authValidity = item.id;
        },

        //编辑权限
        modifyAuth() {
            let _this = this;
            let validityArr = [];
            validityArr = _this.timeJson.map((item) => {
                return (item = new Date(item).getTime());
            });
            let userListObj = {
                userId: _this.UAId,
                companyId: _this.userInfo.cpyId,
                state: "3",
            };
            //永久有效到时候，起止时间不用传
            if (2 == _this.authValidity) {
                userListObj.beginTime = parseInt(validityArr[0] / 1000);
                userListObj.endTime = parseInt(
                    validityArr[1] / 1000 + 3600 * 24 - 1
                );
            }
            let modifyParam = {
                perId: _this.initItemJson.perId,
                companyId: _this.initItemJson.companyId,
                resourceType: "data",
                userList: userListObj,
            };
            authorityApi.modifyPermission(modifyParam).then(function (result) {
                if (result && result.resultCode == 0) {
                    SnToast("保存成功");
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
        background-color: #f6f9fd;
        margin: 0 auto;
        max-width: 1080px;
        // border-bottom: 1px solid #e5e5e5;
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