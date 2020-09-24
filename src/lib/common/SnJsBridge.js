import * as JSBridge from "sinosun-ui/lib/support/native/JSBridge.js";

const {
    callHandler,
    bridgeOpenPage,
    goBackFunction_new,
    goBackFunction,
    RegisterMenuFunction,
    registerHandler,
    QrcodeScan,
    mPaasPopTo,
    getBankType,
    GetLocalDataFunction,
    CheckNetWorkFunction,
    GetUserInfoFunction,
    EncryptionFunction,
    DecryptionFunction
} = JSBridge;

export {
    callHandler,
    bridgeOpenPage,
    goBackFunction_new,
    goBackFunction,
    RegisterMenuFunction,
    registerHandler,
    QrcodeScan,
    mPaasPopTo,
    getBankType,
    GetLocalDataFunction,
    CheckNetWorkFunction,
    GetUserInfoFunction,
    EncryptionFunction,
    DecryptionFunction
}

/**
 * IOS独有，回退至根目录方法
 * 
 */
export function IOSgobackPageToApp() {
    callHandler('', '', 'exitIOSApp');
}
// js调用刷新方法
export function ReloadPageFunction() {
    return callHandler('ReloadPageFunction', '');
}

export function GetUserCompanyListFunction(data = {}) {
    return callHandler('GetUserCompanyListFunction', data);
}

/**
 * js调用 Native 获取头像信息
 * @export
 */
export function QueryUserIconFunction(data = {}) {
    return callHandler('QueryUserIconFunction', data);
}

/**
 * js调用 Native confirm 弹窗
 * @export
 */

export function CommonDialogFunction(confirmJson) {
    return callHandler('CommonDialogFunction', JSON.stringify(confirmJson));
}

/**
 * js调用 Native Toast弹窗
 * @export
 */

export function ToastFunction(tips) {
    return callHandler('ToastFunction', {
        toastData: tips,
        duration: 0 //toast时长，只能是系统默认的2个类型 0: 短时间显示(2s);  1:长时间显示(3.5s)
    });
}

/**
 * js调用 Native PopMenu弹窗
 * @export
 */

export function PopMenuFunction(appData) {
    return callHandler('PopMenuFunction', appData);
}

/**
 * js调用 Native 省市选择弹窗
 * @export
 */

export function SelectProvinceWidget(provinceListAll) {
    return callHandler('SelectProvinceWidgetFunction', provinceListAll);
}

/**
 * js调用app查看附件预览接口
 * @export
 */
export function FilePreviewWidget(previemJson) {
    return callHandler('PreviewFunction', previemJson);
}


/**
 * js调用 Native 时间选择弹窗
 * selectTimeJson
 * @export
 */

export function SelectTimeWidget(selectTimeJson) {
    return callHandler('SelectTimeWidgetFunction', selectTimeJson);
}

/**
 * 增加app页面监听事件
 * @param {Object} appViewId        事件Id
 * @param {Object} appViewAction    app事件
 * @param {Object} appViewOperator  app显示
 * @param {Object} appViewName      app显示名称
 * @param {Object} func             回调函数
 */
export function addAppViewListener(appViewId, appViewAction, appViewOperator, appViewName, func) {
    callHandler('addAppViewListener', {
        appViewId: appViewId,
        appViewAction: appViewAction,
        appViewOperator: appViewOperator,
        appViewName: appViewName
    });
    /**
     * 注册点击app按钮回调
     */
    registerHandler('appViewCallBack', function () {
        if (func) {
            func();
        }
    }.bind(this));
}

/*
 * 调用app通知返回事件
 *
 * */

export function notifyAppBackEvent() {
    callHandler('notifyAppBackEvent', '');
}

/**
 * 清除缓存
 * @param {Object}
 */
export function ClearWebViewCache() {
    callHandler('ClearWebViewCacheHandler', '');
}

/**
 * OpenActionFunction
 * @param {Object} str
 */
export function OpenActionFunction(str) {
    return callHandler('OpenActionFunction', str);
}

export function CallPeople(tel) {
    var Json = {
        action: 'ACTION_DIAL',
        dataList: [{ key: 'tel', value: tel, type: "uri" }],
        responseKeyList: [{ key: '', value: '', type: 'string' }]
    };
    callHandler('OpenActionFunction', Json).then(function () {
    })
}

/**
 * verifySignFunction
 * 验签调用函数，此处写为callHandler通用调用方法
 * @param {Object} fnt  接口名
 * @param {Object} signData   参数
 */
export function verifySignFunction(fnt, signData) {
    return callHandler(fnt, signData);
}


//密码器相关调用

/**
 * 检测密码器是否插入  TPayGetDssStatusFunction “0”密码器已经插入    “-1”密码器未插入
 * @param {Object}
 */
export function TPayGetDssStatusFunction() {
    return callHandler('TPayGetDssStatusFunction', '');
}

/**
 * 初始化密码器，返回mCode
 * ConnectDssBbFunction 已修改，不返回List<String> list
 */
export function ConnectDssBb(dev) {
    return callHandler('ConnectDssBbFunction', dev);
}

/**
 * 初始化密码器，返回mCode
 * ConnectDssBbFunction 已修改，不返回List<String> list
 */
export function OverwriteWindowopenFunction(data = {}) {
    return callHandler('OverwriteWindowopenFunction', data);
}



/**
 * 登录密码器
 * @param {Object} codeUserData
 */
export function LoginDss(codeUserData) {
    return callHandler('LoginDssFunction', codeUserData);
}

/**
 * CA登录
 */
export function LoginCA() {
    return callHandler('TPayCheckPinFunction', '');
}

/**
 * 从APP获取企业信息
 */
export function QueryCompanyDetailFunction(cpyInfo) {
    return callHandler('QueryCompanyDetailFunction', cpyInfo);
}

/**
 * 修改口令
 * @param {Object} dssPswData
 */
export function ModifyDssPsw(dssPswData) {
    return callHandler('ModifyDssPswFunction', dssPswData);
}
/**
 * 获取密码器付方账号列表
 * ConnectDssBbFunction 已修改，不返回List<String> list
 */
export function GetDssAccountList() {
    return callHandler('GetDssAccountListFunction', '');
}
/**
 * 调用app计算支付密码
 * @param {Object} signData
 */
export function CalculatePassword(signData) {
    return callHandler('CalculatePasswordFunction', signData);
}

/**
 * 添加密码器持有人
 * @param {Object} 
 */
export function SetDssUserFun(setUserData) {
    return callHandler('SetDssUserFunction', setUserData);
}

/**
 * 调用app获取配置信息
 * @param {Object} signData
 */

export function GetAppConfigFunction(data = {}) {
    return callHandler('GetAppConfigFunction', data);
}
/**
 * 用于对原数据先组装XML再取hash值
 */
export function TPayXMLHashCodeFunction(data) {
    return callHandler('TPayXMLHashCodeFunction', data);
}
/**
 * 用于转账验证服务器签名，并且生成签名接口
 */
export function TPayVerifyAndXmlSignFunction(data) {
    return callHandler('TPayVerifyAndXmlSignFunction', data);
}

/* 获取App的产品ID
 * */
export function getProdId() {
    return callHandler('GetAppConfigFunction', { key: 'tid' });
}

/**
 * 弹窗打开页面
 * @param {Object} url  //弹窗目标页面url
 */
export function popWindowFunction(targetUrl) {
    callHandler('PopWindowFunction', JSON.stringify({
        url: targetUrl
    }));
}

/**
 * 获取签名
 */
export function SignDataFunction(data) {
    return callHandler('SignDataFunction', data);
}
// 实时监听gps信息
export function LocationObserverFunction(data) {
    callHandler('LocationObserverFunction', data);
}
/**
 * 注册推送
 */
export function registerCommonPushEvent() {
    callHandler('RegisterCommonPushFunction', '');
}

/**
 * H5通知APP
 */
export function SendActionFunction(data) {
    callHandler('SendActionFunction', data);
}
/**
 * H5查询人员信息接口
 */
export function QueryUserInfoFunction(data = {}) {
    return callHandler('QueryUserInfoFunction', data);
}

/**
 * 从APP获取token
 */
export function GetAccessTokenFunction(force = false) {
    return callHandler('GetAccessTokenFunction', force);
}

//  监听页面回复运行
// document.addEventListener('resume', function (event) {
//     let backSteps = event.data && event.data.backSteps || 0;
//     if (backSteps) { 
//         mPaasPopTo(backSteps)
//     }
// });

/***
 *
 * FileUploadFunction H5 调取app上传文件 2019-11-18 华兴需求
 data:{ }

 上传成功返回
 status: 'success'
 fileId:'aabbccdd'

 上传失败返回：
 status: 'fail',

 上传取消返回：
 ret = -2
 * @param data
 * @returns {Promise<any>}
 * @constructor
 */
export function FileUploadFunction(data = {}) {
    return callHandler('FileUploadFunction', { ...data });
}
