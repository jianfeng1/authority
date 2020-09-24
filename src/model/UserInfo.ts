/*
 * @Author: yinfu
 * @Date: 2020-08-24 16:51:07
 * @LastEditTime: 2020-09-01 16:46:53
 * @Description: 
 */
/**
 * @author jiangzhe
 *
 * 用户数据模型
 */
class UserInfo {
    private _UAId: string = '';
    public get UAId(): string {
        return this._UAId;
    }
    public set UAId(value: string) {
        this._UAId = value ? value : '';
    }

    private _cpyId: string = '';
    public get cpyId(): string {
        return this._cpyId;
    }
    public set cpyId(value: string) {
        this._cpyId = value ? value : '';
    }

    private _uName: string = '';
    public get uName(): string {
        return this._uName;
    }
    public set uName(value: string) {
        this._uName = value ? value : '';
    }

    private _cpyCreatorId: string = '';
    public get cpyCreatorId(): string {
        return this._cpyCreatorId;
    }
    public set cpyCreatorId(value: string) {
        this._cpyCreatorId = value ? value : '';
    }

    constructor(result: any) {
        this.UAId = result.UAId;
        this.cpyId = result.cpyId;
        this.uName = result.uName;
        this.cpyCreatorId = result.cpyCreatorId
    }
}

export default UserInfo;