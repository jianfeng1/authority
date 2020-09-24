import Vue from 'vue'
import Router from 'vue-router'

Router.prototype.goBack = function () {
    this.isBack = true
    window.history.go(-1)
}
Vue.use(Router)

