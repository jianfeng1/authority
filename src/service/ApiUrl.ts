/*
 * @Author: liuxiaoman
 * @Date: 2020-07-29 17:26:55
 * @LastEditTime: 2020-09-21 14:06:41
 * @Description: 枚举当前api文档里面需要的接口url
 */
/**
 * 权限服务下面的接口url
 */
export enum AUTHORITY_API_URL {
    ADDPERMISSION = `/bizmate/authority/v1/addPermission`,//添加权限
    LISTPERMISSION = `/bizmate/authority/v1/listPermission`,//查询权限列表和用户查询所属权限列表
    LISTPERMITTEDROLEANDUSERBYPERID = `/bizmate/authority/v1/listPermittedRoleAndUserByPerId`,//根据权限查找角色和用户
    LISTPERMITTEDROLEANDUSERBYCOMPANY = `/bizmate/authority/v1/listPermittedRoleAndUserByCompanyId`,//根据公司Id查询公司下拥有权限的角色和用户
    MODIFYPERMISSION = `/bizmate/authority/v1/modifyPermission`,//修改权限下人员角色列表
    MODIFYPERMISSIONMEMBERS = `/bizmate/authority/v1/modifyPermissionMembers`,//人员编辑绑定的权限
    DELETEPERMISSION = `/bizmate/authority/v1/deletePermission`,//删除权限
    //20200921新增接口
    LISTCONTROLPERMISSION = `/bizmate/authority/v1/listControlPermission`,//用户查询可管理的权限列表，不会返回2_-1_root
    LISTPERMISSONBYUSER = `/bizmate/authority/v1/listPermissionByUser`,//通过用户查询权限列表
    LISTPERMISSONBYROLE = `/bizmate/authority/v1/listPermissionByRole`,//通过角色查询权限列表
}


/**
 * user服务下面的接口url
 */
export enum USER_API_URL {
    LISTROLEGROUPBYORGID = `/bizmate/user/v1/listRole`,//查询企业用户的角色列表
    GETORGANIZATIONUSERS = `/bizmate/user/v1/getOrganizationUsers`,//查询企业通讯录人员列表
    LISTROLEUSER = `/bizmate/user/v1/listRoleUser`,//角色下用户查询：根据企业ID,角色ID列表
}
