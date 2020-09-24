<!--
 * @Author: chengMingRui
 * @Date: 2020-07-14 15:30:31
 * @LastEditTime: 2020-08-11 14:26:56
 * @Description: 
--> 
<template>
    <div class="sn-main-con page-transition" :style="{'overflow':this.$route.meta.isTop?'hidden':'hidden auto'}">
        <transition :name="transitionName">
            <router-view class="child-view"></router-view>
        </transition>
    </div>
</template>
<script>
import "sinosun-ui/lib/style/core/index.less";
import BaseApp from "./baseView/baseApp";
export default {
    extends: BaseApp,
};
</script>
<style lang="less">
@import "~@/style/variables.less";
html {
    font-size: 10000/750vw;
}
body {
    background-color: #fff;
}
.child-view {
    position: absolute;
    width: 100%;
    min-height: 100%;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: 0 auto;
    overflow: auto;
    max-width: 1080px;
    transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
    -moz-transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
    -webkit-transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
    -o-transition: all 0.3s cubic-bezier(0.55, 0, 0.1, 1);
}
// 左右转场
.slide-left-enter,
.slide-right-leave-active {
    opacity: 0;
    -webkit-transform: translate(50px, 0);
    transform: translate(50px, 0);
}
.slide-left-leave-active,
.slide-right-enter {
    opacity: 0;
    -webkit-transform: translate(-50px, 0);
    transform: translate(-50px, 0);
}
// 上下转场
.slide-top-enter,
.slide-bottom-leave-active {
    opacity: 0;
    -webkit-transform: translate(0, 100vh);
    transform: translate(0, 100vh);
}
.slide-top-leave-active,
.slide-bottom-enter {
    opacity: 0;
    -webkit-transform: translate(0, -100vh);
    transform: translate(0, -100vh);
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
@media screen and (min-width: @screen-sm) {
    .child-view {
        padding: 0 30px;
        background: #fff;
    }
}
@media screen and (min-width: @screen-md) {
    .child-view {
        padding: 0 50px;
    }
}
@media screen and (min-width: @pc-width) {
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
</style>

