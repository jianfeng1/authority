<!--
 * @Author: liuxiaoman
 * @Date: 2020-07-29 17:26:54
 * @LastEditTime: 2020-08-05 13:37:10
 * @Description: 
 * @FilePath: \productd:\Git代码\半正事代码\authority-new\src\baseView\baseApp.vue
--> 
<!--
    所有page页面基础类，封装处理注册app的back、refresh事件
    设置页面的前进、回退动画
-->
<script>
import EventType from "./EventType";
import BrowserApi from "sinosun-ui/lib/support/native/BrowserApi.js";
export default {
    data() {
        return {
            transitionName: "slide-left",
        };
    },
    created() {
        this.registerBack();
        this.registerRefresh();
    },
    methods: {
        /**
         * 注册APP回退事件
         */
        registerBack() {
            BrowserApi.registeAppBackEvent(() => {
                this.$EventBus.$emit(
                    this.getEventName(EventType.NOTIFYAPPBACK)
                );
            });
        },

        /**
         * 注册APP刷新事件
         */
        registerRefresh() {
            //注册APP刷新事件
            BrowserApi.registPageRefreshEvent(() => {
                this.$EventBus.$emit(this.getEventName(EventType.REFRESHPAGE));
            });
        },

        /**
         * 获取浏览器事件名称
         */
        getEventName(type) {
            const path = this.$route.path ? this.$route.path : "/";
            return `${this.$route.name}_${path}_${type}`;
        },
    },
    watch: {
        /**
         * 设置进入、回退页面动画
         */
        $route() {
            let isBack = this.$router.isBack;
            if (isBack) {
                if (this.$route.meta.isTop) {
                    this.transitionName = "slide-bottom";
                } else {
                    this.transitionName = "slide-right";
                }
            } else {
                if (this.$route.meta.isTop) {
                    this.transitionName = "slide-top";
                } else {
                    this.transitionName = "slide-left";
                }
            }
            this.$router.isBack = false;
        },
    },
};
</script>