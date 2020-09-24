import {
    doPost as request,
    isSuccess
} from "sinosun-ui/lib/support/request/request.js";

import { GetUserInfoFunction, CheckNetWorkFunction } from 'sinosun-ui/lib/support/native/JSBridge';

/***************  前端请求url host  **************/
var urlhost = 'https://yqtdev.sinosun.com:18094/yqt/testnotice/home/notice/'; //TODO 这里需要从配置获取请求url，暂时默认写成黑盒环境，后续调整
if (window.CLIENT_HOST) { //从config文件获取host
    urlhost = window.CLIENT_HOST;
}
/*************** ********* **************/
export function doPost(url, data = {}, showBisError = true, orgId) {
    let hostUrl;
    if (typeof url === 'object') {
        hostUrl = url.prefix + url.url;
    } else {
        hostUrl = urlhost + url;
    }
    return new Promise((res, rej) => {
        checkNetWrok().then(function () {
            return getUserInfo(data);
        }).then(function (result) {
            data.bizmateId = result.bizmateId; // 填充用户信息, TODO 后续的session可以在这里添加
            data.orgId = orgId || result.orgId;
            request(hostUrl, data).then(result => {
                res(handleResult(result, showBisError));
            }).catch(e => {
                console.log("formRequest e = " + JSON.stringify(e));
                // 处理网络层的异常提示
                if (showBisError) {
                    let errorMsg = "网络请求异常";
                    if (e.errorDesc) {
                        errorMsg = e.errorDesc;
                    }
                    console.log(errorMsg);
                }
                rej(e);
            });
        })
    });
}

/**
 * 处理服务器响应结果, 主要是处理错误码提示
 * @param {} result
 */
function handleResult(result, showBisError = true) {
    // 如果code非0，表示业务失败，转换错误提示，并根据调用者showError决定是否自动提示toast
    if (!isSuccess(result)) {
        var localDesc = '';
        // emsg 为服务器接口返回的可直接展示用户的 msg描述, 如果不为空，优先展示emsg，否则从本地取desc
        if (result.emsg) {
            localDesc = result.emsg;
        } else {
            result.desc = transferErrorDesc(result);
            localDesc = result.desc;
        }
        // 错误描述追加显示 ecode， 如： "账号不存在[21111003]"
        if (result.ecode) {
            localDesc += ("[" + result.ecode + "]");
        }
        if (showBisError) {
            console.log(localDesc);
        }
        // 本地拼接的用于显示给用户的edesc："账号不存在[21111003]"， 如果界面需要自己提示toast，可以用这个edesc字段
        result.edesc = localDesc;
    }
    return result;
}

/**
 * 获取用户信息
 * @returns {Promise<any>}
 * @constructor
 */
// 当前从native获取的用户信息
export var nativeInfo = {};

function getUserInfo() {
    var p = new Promise(function (res, rej) {
        // 如果内存中已经取到过uaid，不在从app获取
        if (nativeInfo.bizmateId) {
            res(nativeInfo);
        } else {
            // 从app获取用户信息
            return GetUserInfoFunction({
                isNeedSeesion: true
            }).then(function (uaData) {
                if (uaData) { //如果native登录
                    nativeInfo.bizmateId = uaData.bizMateId;
                    nativeInfo.cpyId = uaData.cpyId;
                    nativeInfo.UAName = uaData.uName;
                    nativeInfo.orgId = uaData.orgId;
                    nativeInfo.orgName = uaData.orgName;
                    nativeInfo.uPhone = uaData.uPhone;
                    // end 添加登录校验lgparam

                    if (uaData.deviceId) {
                        nativeInfo.deviceId = uaData.deviceId;
                    }
                    if (uaData.token) {
                        nativeInfo.token = JSON.parse(uaData.token);
                    }
                    res(nativeInfo);
                } else {
                    var errInfo = {
                        errorCode: "100003",
                        errorDesc: "用户信息获取失败"
                    };
                    console.log("GetUserInfo - getuser info from native failed...");
                    rej(errInfo);
                }
            });
        }
    });
    return p;
}

/**
 * 检查网络状态
 * @constructor
 */
function checkNetWrok() {
    var p = new Promise(function (res, rej) {
        CheckNetWorkFunction().then(function (statusData) { //获取网络状态
            if (statusData.contectState) {
                res(statusData);
            } else {
                var errInfo = {
                    errorCode: "100004",
                    errorDesc: "网络连接不可用"
                };
                rej(errInfo);
            }
        });
    });
    return p;
}

/**
 * 兼容SWP的webserver后端代码
 * @param {Object} result
 */
// function compatiableData(result) {
//     if (result.data) {
//         result.data["code"] = result.code;
//         return result.data;
//     }
//     return result;
// }

/**
 * 将server的错误码转换为用户提示信息
 * @param result
 * @returns {string}
 */
function transferErrorDesc(result) {

    return result.desc || "抱歉，网络不给力，请您稍后重试!";
}