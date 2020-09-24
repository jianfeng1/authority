import Vue from 'vue'
import Vuex from 'vuex'
import * as getters from './getters'
import mutations from './mutations'
import createPersistedState from 'vuex-persistedstate'
Vue.use(Vuex);

const state = {
    // meetingInfo: {},
    // userInfo: {},
    // meetingDate: [],
    // groupId: 0
}

const store = new Vuex.Store({
    state,
    getters,
    mutations,
    plugins: [createPersistedState({
        storage: window.sessionStorage
    })]//会自动保存创建的状态，浏览器强制刷新数据存在
})

export default store