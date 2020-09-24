/*
 * @Author: kegui
 * @Date: 2020-07-20 10:58:13
 * @LastEditTime: 2020-09-24 08:51:43
 * @Description: 用户管理接口请求的方法封装
 */

import BaseApi from '../lib/NetApi/BaseApi';
import BaseResponse from 'src/lib/NetApi/BaseResponse';
import { sortUserListByName, handleValidity, handleAuthTree } from '../utils/authorityUtil';
import { AUTHORITY_API_URL, USER_API_URL } from './ApiUrl';

class AuthorityApi extends BaseApi {
    constructor() {
        super();
    }

    //查询企业人员列表，以及通过企业ID查询企业拥有权限的人员和角色
    getOrganizationUsers(param: any) {
        const companyParam = {
            companyId: param.orgId,
        }
        const listPermittedRoleAndUserByCompanyId = new Promise((res, rej) => {
            this.doGet(AUTHORITY_API_URL.LISTPERMITTEDROLEANDUSERBYCOMPANY, companyParam).then((result: any) => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
        const getOrganizationUsers = new Promise((res, rej) => {
            this.doGet(USER_API_URL.GETORGANIZATIONUSERS, param).then((result: any) => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
        let companyUserList: string[] = []; //拥有权限的人员ID列表
        return new Promise((res) => {
            Promise.all([getOrganizationUsers, listPermittedRoleAndUserByCompanyId]).then((result: any) => {
                if (!!result[1].result) {
                    companyUserList = result[1].result.userIdList
                }
                if (result[0].result && result[0].result.organizationUserList && result[0].result.organizationUserList.length) {
                    result[0].result.organizationUserList.forEach((items) => {
                        if (companyUserList.indexOf(items.bizMateId) > -1) {
                            items.haveAuth = true;
                        } else {
                            items.haveAuth = false;
                        }
                    })
                    result[0].result.organizationUserList = sortUserListByName(result[0].result.organizationUserList);
                }
                res(result[0]);
            })
        }).catch((error) => {
            console.log(error)
        })
    }

    //获取角色列表，过滤掉-1角色
    listRoleGroupByOrgId(param: object) {
        return new Promise((res, rej) => {
            this.doGet(USER_API_URL.LISTROLEGROUPBYORGID, param).then((result: any) => {
                if (result.result && result.result.roleWithRoleGroupList && result.result.roleWithRoleGroupList.length) {
                    const roleGroupListTemp: any = result.result.roleWithRoleGroupList
                    for (var i = 0; i < roleGroupListTemp.length; i++) {
                        if (roleGroupListTemp[i].roleInfoEntity.roleId == '-1') {
                            roleGroupListTemp.splice(i, 1);
                            break;
                        }
                    }
                    result.result.roleWithRoleGroupList = roleGroupListTemp;
                }
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //添加权限
    addPermission(param: object) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.ADDPERMISSION, param).then(result => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //查询权限列表和用户查询所属权限列表
    listPermission(param: any): Promise<BaseResponse> {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.LISTPERMISSION, param).then((result: any) => {
                if (result.result && result.result.permissionList && result.result.permissionList.length) {
                    if (!param.sourseData) {
                        result.permissionList = handleAuthTree(result.result.permissionList, param.isCreater)
                    }
                }
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //根据权限和企业查找角色和用户，过滤掉-1角色
    listPermittedRoleAndUserByPerId(param: object) {
        return new Promise((res, rej) => {
            this.doGet(AUTHORITY_API_URL.LISTPERMITTEDROLEANDUSERBYPERID, param).then((result: any) => {
                if (result && result.resultCode == 0) {
                    const userInfo: any = result.result.userList;
                    if (userInfo && userInfo.length) {
                        userInfo.forEach(item => {
                            item = handleValidity(item);
                        })
                    }
                    const roleInfo: any = result.result.roleList;
                    if (roleInfo && roleInfo.length) {
                        for (var i = 0; i < roleInfo.length; i++) {
                            roleInfo[i] = handleValidity(roleInfo[i]);
                            if (roleInfo[i].roleId == '-1') {
                                roleInfo.splice(i, 1);
                                i--;
                            }
                        }
                    }
                }
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //修改权限
    modifyPermission(param: object) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.MODIFYPERMISSION, param).then(result => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //人员编辑绑定的权限
    modifyPermissionMembers(param: object) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.MODIFYPERMISSIONMEMBERS, param).then(result => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //删除权限
    deletePermission(param: object) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.DELETEPERMISSION, param).then(result => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //角色下用户查询：获取企业最高管理者根据企业ID,角色ID列表，需要校验token
    listRoleUser(param: object) {
        return new Promise((res, rej) => {
            this.doPost(USER_API_URL.LISTROLEUSER, param).then(result => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //用户查询可管理的权限列表，不会返回2_-1_root (20200921新增接口)
    //企业最高管理者返回所有，其他用户不返回2_-1_funMgr
    listControlPermission(param: any) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.LISTCONTROLPERMISSION, param).then((result: any) => {
                if (result.result && result.result.permissionList && result.result.permissionList.length) {
                    result.permissionList = handleAuthTree(result.result.permissionList, false, param.isAdmin)
                }
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //通过用户查询权限列表 (20200921新增接口)
    listPermissionByUser(param: any) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.LISTPERMISSONBYUSER, param).then((result: any) => {
                if (result.result && result.result.permissionList && result.result.permissionList.length) {
                    result.permissionList = handleAuthTree(result.result.permissionList, true)
                }
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }

    //通过角色查询权限列表 (20200921新增接口)
    listPermissionByRole(param: object) {
        return new Promise((res, rej) => {
            this.doPost(AUTHORITY_API_URL.LISTPERMISSONBYROLE, param).then(result => {
                res(result);
            }).catch(error => {
                rej(error);
            })
        });
    }



}

export default new AuthorityApi();
