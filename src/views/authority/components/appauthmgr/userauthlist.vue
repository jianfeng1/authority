<template>
	<div class="bankListPopup">
        <div class="mt50">
            <SnLoading :spinning="loading" :turn="loading" size="small" tip="正在加载"/>
            <div class="searchWrap" v-if="!loading">
                <div class="inputWrap">
                    <input type="text" maxlength="30" v-model="searchName" @blur="blurValue()" @focus="focusValue()" @input="changeValue()">          		          		
                </div>			
                <div class="inputTips" v-show="0 == searchName.length && inputBlur" @click.stop="focusValue()">搜索姓名/手机号</div>
                <div class="unSearch" v-show="0 < searchName.length" @click.stop="unSearch()"></div>
            </div>
            <div class="outWrap popupDebit" v-if="!loading">
                <div class="noInfo" v-if="0 == userAuthTreeData.length">{{noinfoText}}</div>
                <div class="lineWrap" v-for="(groupItem,ind) in userAuthTreeData" :key="ind">
                    <div class="groupName" :id="'#'==groupItem.groupName?'AA':groupItem.groupName">{{groupItem.groupName}}</div>
                    <div class="line" v-for="(item,index) in groupItem.userList" :key="index" @click="gotoUserAuthInfoPage(item)" >
                        <div>
                            <SnAvatar class="icon" :uaid = item.bizMateId></SnAvatar>
                            <div class="linetext" :class="{haveAuth:item.haveAuth}">{{item.name}}</div>
                        </div>
                    </div>
                </div>
            </div>    	
            <div class="navTab" v-bind:style="{ marginTop: navTabmt + 'px' }">            		
                <div class="a2z" :key="item.id" v-for="(item,index) in indexList" :index="index"  v-html="item.name"></div>        	            		
            </div>
            <div class="atozshow" v-show="atozshow && ''!=atozText" v-html="atozText"></div>
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
    isPC,
} from "../../../../utils/commonUtil";
import SnAvatar from "../components/SnAvatar/SnAvatar.vue";
import { SnLoading, SnToast } from "sinosun-ui";
import authorityApi from "@/service/authorityApi.ts";
export default {
    components: {
        SnAvatar,
        SnLoading,
    },
    data() {
        return {
            userInfo: {}, //用户信息
            loading: true, //数据加载中
            initUserData: [], //人员数据
            userAuthTreeData: [], //权限树
            searchName: "", //搜索条件
            inputBlur: true,
            noinfoText: "人员信息为空",
            indexList: [],
            atozshow: false, //触摸组件是否显示大文字
            atozText: "", //触摸组件大文字内容
            atozIndex: "", //触摸选中的id
            xTouch: {
                cardH: 0, //取卡片高度
                cardLength: 0, //卡片数量
                startX: 0, //touch事件起始点坐标
                startY: 0, //touch事件起始点坐标
                scrollY: 0, //touch事件Y轴移动距离
            },
            navTabmt: 0, //
            view: false, //是否只展示信息
            isPC: false,
            imgIndex: 0,
            userauthlist: {},
        };
    },
    created() {
        let _this = this;
        if (isPC()) {
            _this.isPC = true;
        }
        if (getStorage("userauthlist")) {
            _this.userauthlist = JSON.parse(getStorage("userauthlist"));
        }
        _this.view = _this.userauthlist.view;
        _this.getIndex();
        $(document).off("touchstart", ".a2z");
        $(document).off("touchmove", ".a2z");
        $(document).off("touchend", ".a2z");
        $(document).off("mousemove", ".a2z");
        $(document).off("mouseleave", ".a2z");
        _this.$nextTick(function () {
            //银行列表导航栏触摸事件
            setTimeout(function () {
                _this.initxTouch();
            }, 200);
            //导航栏固定位置，键盘弹起时不动
            var wH = $(window).height();
            var tabH = $(".navTab").height();
            _this.navTabmt = (wH - tabH) / 2;
        });
        PromiseJSBridgeReady(function () {
            if (!window.AlipayJSBridge) {
                notifyAppBackEvent(); //调用app，通知返回事件
                registerHandler("notifyAppBack", function () {
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
        //需要判断是否管理员，显示报表按钮
        if (window.AlipayJSBridge) {
            initTitleMenu(["人员权限"]);
        } else {
            initTitleMenu([
                "人员权限",
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

        document.addEventListener("resume", function () {
            _this.initData();
        });
    },
    mounted() {},
    methods: {
        initData() {
            let _this = this;
            _this.loading = true;
            let json = {
                bizMateId: _this.userInfo.UAId,
                orgId: _this.userInfo.cpyId,
                pageNum: 1,
                pageSize: 10000,
            };
            authorityApi.getOrganizationUsers(json).then(function (result) {
                _this.loading = false;
                if (result && result.resultCode == 0) {
                    _this.initUserData = result.result.organizationUserList;
                    _this.userAuthTreeData = result.result.organizationUserList;
                } else {
                    SnToast(result.resultDesc);
                }
            });
        },

        //跳转到用户权限信息详情页
        gotoUserAuthInfoPage(item) {
            let _this = this;
            let userauthinfo = {
                UAId: item.bizMateId,
                uName: item.name,
                view: _this.view,
            };
            setStorage("userauthinfo", JSON.stringify(userauthinfo));
            if (!window.AlipayJSBridge) {
                _this.$router.push({ path: "userauthinfo" });
            } else {
                AlipayJSBridge.call("pushWindow", {
                    url: "appauthmgr.html#/userauthinfo",
                });
            }
        },

        //搜索按钮相关事件
        blurValue() {
            let _this = this;
            _this.inputBlur = true;
        },
        focusValue() {
            let _this = this;
            $(".inputWrap input").focus();
            _this.inputBlur = false;
        },
        unSearch() {
            let _this = this;
            _this.searchName = "";
            _this.searchlist();
        },
        changeValue() {
            let _this = this;
            _this.searchlist();
            $(".popupDebit").stop().scrollTop(0);
        },

        //搜索姓名和手机号
        searchlist() {
            let _this = this;
            let searchData = _this.initUserData;
            let afterSearch = [];
            for (var i = 0; i < searchData.length; i++) {
                //遍历group
                let userList = searchData[i].userList;
                let afterUserList = [];
                if (userList) {
                    for (var j = 0; j < userList.length; j++) {
                        //遍历userList
                        let uName = userList[j].name;
                        let userPhoneStr = userList[j].mobile;
                        //去除强数据关联
                        let userPhone = parseInt(userPhoneStr).toString();
                        if (
                            uName.indexOf(_this.searchName) >= 0 ||
                            ("NaN" != userPhone &&
                                userPhone.indexOf(_this.searchName) >= 0)
                        ) {
                            if (uName == _this.searchName) {
                                afterUserList.unshift(userList[j]);
                            } else {
                                afterUserList.push(userList[j]);
                            }
                        }
                    }
                }
                if (0 < afterUserList.length) {
                    afterSearch.push({
                        groupName: searchData[i]["groupName"],
                        userList: afterUserList,
                    });
                }
            }
            _this.userAuthTreeData = afterSearch;
            _this.noinfoText = "搜索结果为空";
        },

        //初始化
        getIndex: function () {
            let _this = this;
            for (var i = 0; i < 26; i++) {
                _this.indexList.push({
                    name: String.fromCharCode(65 + i),
                    id: String.fromCharCode(65 + i),
                });
            }
            _this.indexList.push({
                name: "#",
                id: String.fromCharCode(65 + i),
            });
        },
        goIndexTouch: function (item, e) {
            let itemOffset = $(e)
                .find("#" + item)
                .offset();
            let aOffset = $(e).find(".lineWrap:first-child").offset();
            if (undefined != itemOffset) {
                $(e)
                    .find(".popupDebit")
                    .stop()
                    .scrollTop(itemOffset.top - aOffset.top);
            }
        },
        //初始化xtouch
        initxTouch: function () {
            let _this = this;
            let atozNameMap = [
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
                "Q",
                "R",
                "S",
                "T",
                "U",
                "V",
                "W",
                "X",
                "Y",
                "Z",
                "#",
            ];
            let atozMap = [
                "A",
                "B",
                "C",
                "D",
                "E",
                "F",
                "G",
                "H",
                "I",
                "J",
                "K",
                "L",
                "M",
                "N",
                "O",
                "P",
                "Q",
                "R",
                "S",
                "T",
                "U",
                "V",
                "W",
                "X",
                "Y",
                "Z",
                "AA",
            ];
            _this.xTouch.cardH = $(".a2z").height();
            _this.xTouch.cardLength = $(".a2z").length;
            if (_this.isPC) {
                $(document).on("mousemove", ".a2z", function () {
                    _this.goIndexTouch(
                        atozMap[$(this).attr("index")],
                        $(this).parents(".bankListPopup")
                    );
                    _this.atozText = $(this).text();
                    _this.atozshow = true;
                });
                $(document).on("mouseleave", ".a2z", function () {
                    _this.atozshow = false;
                    _this.atozText = "";
                });
            } else {
                $(document).on("touchstart", ".a2z", function (e) {
                    _this.xTouch.startY =
                        e.originalEvent.changedTouches[0].pageY;
                    _this.goIndexTouch(
                        atozMap[$(this).attr("index")],
                        $(this).parents(".bankListPopup")
                    );
                    _this.atozText = $(this).text();
                    _this.atozshow = true;
                    _this.atozIndex = parseInt($(this).attr("index"));
                });
                $(document).on("touchmove", ".a2z", function (e) {
                    e.preventDefault(); //阻止默认滚动事件
                    _this.xTouch.moveEndY =
                        e.originalEvent.changedTouches[0].pageY;
                    _this.xTouch.scrollY =
                        _this.xTouch.moveEndY - _this.xTouch.startY;
                    var showAtozIndex =
                        _this.atozIndex +
                        parseInt(_this.xTouch.scrollY / _this.xTouch.cardH);
                    if (
                        _this.xTouch.cardLength - 1 >= showAtozIndex &&
                        0 <= showAtozIndex
                    ) {
                        if (_this.atozText != atozMap[showAtozIndex]) {
                            _this.atozText = atozNameMap[showAtozIndex];
                            _this.goIndexTouch(
                                atozMap[showAtozIndex],
                                $(this).parents(".bankListPopup")
                            );
                        }
                    } else {
                        _this.atozText = "";
                    }
                });
                $(document).on("touchend", ".a2z", function () {
                    _this.atozshow = false;
                    _this.atozText = "";
                });
            }
        },
    },
};
</script>
<style scoped lang="less">
@import "~@/style/variables.less";
@import "~@/style/mixins/mixins.less";
.searchWrap {
    position: relative;
    padding: 0.4rem 0.4rem 0.3rem 0.4rem;
    height: 0.68rem;
    .inputWrap {
        background: url(../../../../assets/img/authority/inputbg.png) no-repeat
            center;
        background-size: 95% 100%;
        height: 0.68rem;
        input {
            position: relative;
            height: 0.68rem;
            line-height: 0.68rem;
            padding: 0 0.2rem;
            box-sizing: border-box;
            background-color: #f6f9fd;
            border-radius: 0.2rem;
        }
    }

    .inputTips {
        position: absolute;
        top: 0.4rem;
        left: 50%;
        width: auto;
        height: 0.68rem;
        line-height: 0.68rem;
        padding-left: 0.44rem;
        margin-left: -1.1rem;
        color: #b2b2b2;
        font-size: 0.32rem;
        background: url(../../../../assets/img/authority/search.png) no-repeat
            left;
        background-size: 0.34rem 0.33rem;
        transform: all 0.3s;
    }

    .unSearch {
        width: 0.68rem;
        height: 0.68rem;
        position: absolute;
        top: 100%;
        margin-top: -0.3rem;
        right: 0.4rem;
        display: inline-block;
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAARVBMVEUAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMx7eaEzAAAAFnRSTlMA8KmkPzj17diRWU3p1VTkDApdW5dfRO/C/gAAAIpJREFUGNNtkVkOwyAMRIedsCSQtL7/UYswStrK7wOL0VgMNiY9mRpCNanj5oy0iAmLjb7YBG2pif7YgXaMGrSigdJhnEdno4H1RN5CTyuXYuGIHGxhC6dRDnuG8/NSoYjJQCYmyCK3e4f8tIsPiZE4fPkJ3+RvygMBXoIGvJ8hn7hpl4lKVXPxOj6/LBW1DpW8VwAAAABJRU5ErkJggg==")
            no-repeat center center;
        background-size: 0.32rem;
    }
}

.outWrap {
    margin-top: 0rem;
    position: absolute;
    top: 1.44rem;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;

    .noInfo {
        margin-top: 1.2rem;
        height: 0.5rem;
        padding-top: 3rem;
        text-align: center;
        font-size: 0.32rem;
        line-height: 0.42rem;
        color: #b2b2b2;
        background: url(../../../../assets/img/authority/noInfo.png) no-repeat
            center;
        background-size: 2.67rem;
    }

    .lineWrap {
        transform: all 0.3s;
        position: relative;
        background: #fff;
        margin-bottom: 0rem;

        .groupName {
            position: relative;
            padding-left: 0.3rem;
            font-size: 0.24rem;
            color: #999;
            height: 0.6rem;
            line-height: 0.6rem;
            background: @color-bgc;
        }

        .line {
            position: relative;
            line-height: 1.08rem;
            padding-left: 1.26rem;
            font-size: 0.32rem;
            color: #333;

            .linetext {
                position: relative;
                padding-right: 0.73rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                border-bottom: 0.5px solid #e8e8e8;
            }
            .linetext.haveAuth {
                background: url(../../../../assets/img/authority/haveauth.png)
                    no-repeat right 0.6rem center;
                background-size: 0.44rem;
            }
        }

        .line .icon {
            position: absolute;
            top: 50%;
            left: 0.3rem;
            margin-top: -0.36rem;
            width: 0.72rem;
            height: 0.72rem;
            border-radius: 0.36rem;
            background-position: center;
            background-repeat: no-repeat;
            background-size: 0.72rem;
        }
    }

    .lineWrap .line:last-child .linetext {
        border: none;
    }
}

.navTab {
    position: absolute;
    right: 0;
    top: 0;
    margin-top: 1.3rem;
    font-size: 0;
    z-index: 1;
}
.navTab div {
    width: 0.4rem;
    height: 0.33rem;
    line-height: 0.33rem;
    text-align: center;
    color: #b2b2b2;
    font-size: 0.3rem;
}

.atozshow {
    position: fixed;
    top: 50%;
    left: 50%;
    display: inline-block;
    margin-top: -0.5rem;
    margin-left: -0.5rem;
    width: 1rem;
    height: 1rem;
    line-height: 1rem;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    text-align: center;
    font-size: 0.5rem;
}

@media screen and (min-width: @pc-width) {
    body {
        background: #fff;
    }
    .searchWrap {
        position: relative;
        padding: 20px 20px 15px 20px;
        height: 34px;
        background: #fff;
        text-align: right;
        font-size: 0;
        .inputWrap {
            input {
                text-align: left;
                font-size: 14px;
                position: relative;
                height: 34px;
                line-height: 34px;
                padding: 0 10px;
                box-sizing: border-box;
                background-color: #f6f9fd;
                border-radius: 10px;
            }
        }
        .inputTips {
            position: absolute;
            top: 50%;
            left: 35%;
            width: auto;
            height: 26px;
            line-height: 26px;
            padding-left: 28px;
            margin-left: 20px;
            margin-top: -12px;
            color: #b2b2b2;
            font-size: 14px;
            background: url(../../../../assets/img/authority/search.png)
                no-repeat 5px center;
            background-size: 16px 16px;
            transform: all 0.3s;
        }
    }
    .unSearch {
        width: 34px;
        height: 34px;
        position: absolute;
        top: 100%;
        margin-top: -15px;
        right: 20px;
        display: inline-block;
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAARVBMVEUAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMx7eaEzAAAAFnRSTlMA8KmkPzj17diRWU3p1VTkDApdW5dfRO/C/gAAAIpJREFUGNNtkVkOwyAMRIedsCSQtL7/UYswStrK7wOL0VgMNiY9mRpCNanj5oy0iAmLjb7YBG2pif7YgXaMGrSigdJhnEdno4H1RN5CTyuXYuGIHGxhC6dRDnuG8/NSoYjJQCYmyCK3e4f8tIsPiZE4fPkJ3+RvygMBXoIGvJ8hn7hpl4lKVXPxOj6/LBW1DpW8VwAAAABJRU5ErkJggg==")
            no-repeat center center;
        background-size: 16px;
        cursor: pointer;
    }
    .outWrap {
        margin-top: 0rem;
        position: absolute;
        top: 72px;
        left: 0;
        right: 0;
        bottom: 0;
        overflow-y: auto;
    }
    .lineWrap {
        transform: all 0.3s;
        position: relative;
        background: #fff;
        margin-bottom: 0rem;
    }
    .groupName {
        position: relative;
        padding-left: 15px;
        font-size: 12px;
        color: #999;
        height: 30px;
        line-height: 30px;
        background: @color-bgc;
    }
    .line {
        position: relative;
        line-height: 54px;
        padding-left: 63px;
        font-size: 14px;
        color: #333;
        cursor: pointer;
        transition: all 0.3s;
    }
    .line:hover {
        background: #ecf3fd;
    }
    .line .icon {
        position: absolute;
        top: 50%;
        left: 15px;
        margin-top: -18px;
        width: 36px;
        height: 36px;
        border-radius: 18px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: 36px;
    }
    .linetext {
        position: relative;
        padding-right: 84px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .linetext.haveAuth {
        background: url(../../../../assets/img/authority/haveauth.png) no-repeat
            right 30px center;
        background-size: 22px;
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
    .navTab {
        position: absolute;
        right: 15px;
        top: 50%;
        margin-top: -150px !important;
        font-size: 0;
        z-index: 1;
    }
    .navTab div {
        width: 20px;
        height: 12px;
        line-height: 12px;
        text-align: center;
        color: #b2b2b2;
        font-size: 12px;
        cursor: pointer;
    }
    .navTab div:hover {
        color: #fff;
        background: @colour-blue;
    }
    .atozshow {
        position: fixed;
        top: 50%;
        left: 50%;
        display: inline-block;
        margin-top: -25px;
        margin-left: -25px;
        width: 50px;
        height: 50px;
        line-height: 50px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        text-align: center;
        font-size: 24px;
    }
}
@media screen and (min-width: @screen-md-min) {
    .mt50,
    .outWrap,
    .navTab {
        padding: 0 50px;
    }
}
</style>

