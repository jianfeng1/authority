import Vue from 'vue'
import routes from './router/index.js'
import app from '../../app.vue';
import Router from 'vue-router'
import "../../router/baseRouter.js";
import vuei18n from 'vue-i18n'
// import store from './store/store';

const EventBus = new Vue();
const router = new Router({ routes });

Vue.use(vuei18n)

router.beforeEach((to, from, next) => {
    /* 路由发生变化修改页面title */
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    next();
})

// 混合全局控制 进行后退按钮控制 内部路由的事件监听必须放在created之后
Vue.mixin({
    created() {
        this.$EventBus = EventBus;
    }
});

new Vue({
    router,
    // store,
    render: h => h(app)
}).$mount('#app');