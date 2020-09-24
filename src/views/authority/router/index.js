/*
 * @Author: liuxi1
 * @Date: 2020-08-10 15:30:14
 * @LastEditTime: 2020-09-22 17:17:24
 * @Description: 路由
 */
//权限设置首页
const home = r => require.ensure([], () => r(require('../components/appauthmgr/home')), 'authority_home');
//审批额度二级页面
const authgroup = r => require.ensure([], () => r(require('../components/appauthmgr/authgroup')), 'authority_authgroup');
//权限详情页
const authdetail = r => require.ensure([], () => r(require('../components/appauthmgr/authdetail')), 'authority_authdetail');
//人员或者角色编辑页
const authdate = r => require.ensure([], () => r(require('../components/appauthmgr/authdate')), 'authority_authdate');
//角色选择页
const chooserole = r => require.ensure([], () => r(require('../components/appauthmgr/chooserole')), 'authority_chooserole');
//安全硬件权限详情页
const ddsauthdetail = r => require.ensure([], () => r(require('../components/appauthmgr/ddsauthdetail')), 'authority_ddsauthdetail');
//HS通讯录页
const userauthlist = r => require.ensure([], () => r(require('../components/appauthmgr/userauthlist')), 'authority_userauthlist');
//人员详情页
const userauthinfo = r => require.ensure([], () => r(require('../components/appauthmgr/userauthinfo')), 'authority_userauthinfo');
//人员权限详情页
const userauthdate = r => require.ensure([], () => r(require('../components/appauthmgr/userauthdate')), 'authority_userauthdate');
//人员权限编辑页
const edituserauthinfo = r => require.ensure([], () => r(require('../components/appauthmgr/edituserauthinfo')), 'authority_edituserauthinfo');

const routes = [
    {
        path: '/',
        name: 'home',
        component: home,
        meta: {
            title: "权限设置",
        }
    },
    {
        path: '/authgroup',
        name: 'authgroup',
        component: authgroup,
        meta: {
            title: "",
        }
    },
    {
        path: '/authdetail',
        name: 'authdetail',
        component: authdetail,
        meta: {
            title: "",
        }
    },
    {
        path: '/authdate',
        name: 'authdate',
        component: authdate,
        meta: {
            title: "",
        }
    },
    {
        path: '/chooserole',
        name: 'chooserole',
        component: chooserole,
        meta: {
            title: "",
        }
    },
    {
        path: '/ddsauthdetail',
        name: 'ddsauthdetail',
        component: ddsauthdetail,
        meta: {
            title: "",
        }
    },
    {
        path: '/userauthlist',
        name: 'userauthlist',
        component: userauthlist,
        meta: {
            title: "",
        }
    },
    {
        path: '/userauthinfo',
        name: 'userauthinfo',
        component: userauthinfo,
        meta: {
            title: "",
        }
    },
    {
        path: '/userauthdate',
        name: 'userauthdate',
        component: userauthdate,
        meta: {
            title: "",
        }
    },
    {
        path: '/edituserauthinfo',
        name: 'edituserauthinfo',
        component: edituserauthinfo,
        meta: {
            title: "",
        }
    },

];
export default routes