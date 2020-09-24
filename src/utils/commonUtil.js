import {
    RegisterMenuFunction,
    callHandler
} from "sinosun-ui/lib/support/native/JSBridge";
import { CommonDialogFunction } from "../lib/common/SnJsBridge";
import { imgBase64Map } from "../service/imgBase64Map";
import Vue from 'vue';

/**
 * 时间格式化
 * @param {Object} fmt
 */
Date.prototype.format = function (fmt) {
    var showDayArr = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "E+": showDayArr[this.getDay()], //周
        "D+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/i.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}
/**
 * 生产随机数 函数
 */
export function GUID() {
    /* 判断是否初始化过，如果初始化过以下代码，则以下代码将不再执行，实际中只执行一次 */
    if (typeof this.newGUID != 'function') {   /* 生成GUID码 */
        GUID.prototype.newGUID = function () {
            this.date = new Date();
            var guidStr = '';
            var sexadecimalDate = this.hexadecimal(this.getGUIDDate(), 16);
            var sexadecimalTime = this.hexadecimal(this.getGUIDTime(), 16);
            for (var i = 0; i < 9; i++) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            guidStr += sexadecimalDate;
            guidStr += sexadecimalTime;
            while (guidStr.length < 32) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            return this.formatGUID(guidStr);
        }
        /* * 功能：获取当前日期的GUID格式，即8位数的日期：19700101 * 返回值：返回GUID日期格式的字条串 */
        GUID.prototype.getGUIDDate = function () {
            return this.date.getFullYear() + this.addZero(this.date.getMonth() + 1) + this.addZero(this.date.getDay());
        }
        /* * 功能：获取当前时间的GUID格式，即8位数的时间，包括毫秒，毫秒为2位数：12300933 * 返回值：返回GUID日期格式的字条串 */
        GUID.prototype.getGUIDTime = function () {
            return this.addZero(this.date.getHours()) + this.addZero(this.date.getMinutes()) + this.addZero(this.date.getSeconds()) + this.addZero(parseInt(this.date.getMilliseconds() / 10));
        }
        /* * 功能: 为一位数的正整数前面添加0，如果是可以转成非NaN数字的字符串也可以实现 * 参数: 参数表示准备再前面添加0的数字或可以转换成数字的字符串 * 返回值: 如果符合条件，返回添加0后的字条串类型，否则返回自身的字符串 */
        GUID.prototype.addZero = function (num) {
            if (Number(num).toString() != 'NaN' && num >= 0 && num < 10) {
                return '0' + Math.floor(num);
            } else {
                return num.toString();
            }
        }
        /*  * 功能：将y进制的数值，转换为x进制的数值 * 参数：第1个参数表示欲转换的数值；第2个参数表示欲转换的进制；第3个参数可选，表示当前的进制数，如不写则为10 * 返回值：返回转换后的字符串 */GUID.prototype.hexadecimal = function (num, x, y) {
            if (y != undefined) { return parseInt(num.toString(), y).toString(x); } else { return parseInt(num.toString()).toString(x); }
        }
        /* * 功能：格式化32位的字符串为GUID模式的字符串 * 参数：第1个参数表示32位的字符串 * 返回值：标准GUID格式的字符串 */
        GUID.prototype.formatGUID = function (guidStr) {
            var str1 = guidStr.slice(0, 8) + '-', str2 = guidStr.slice(8, 12) + '-', str3 = guidStr.slice(12, 16) + '-', str4 = guidStr.slice(16, 20) + '-', str5 = guidStr.slice(20);
            return str1 + str2 + str3 + str4 + str5;
        }
    }
}


/**
 * 判断是否PC端
 */
export function isPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) { flag = false; break; }
    }
    return flag;
}


/**
 * 时间格式化函数
 * @param {*} fmt   //格式化参数
 * @param {*} date  //时间戳
 */
export function dateFormat(fmt, date) {
    let ret;
    let weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString(),         // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
        "XQ": weekday[date.getDay()]                // 星期几
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        }
    }
    return fmt
}

/**
 * 获取当前函数的节流函数(就是在xx毫秒内只能触发一次func)
 * 
 * @param {any} func 
 * @param {any} context func的上下文环境
 */
export function throttle(func, context) {
    if (throttle.ready) {
        throttle.ready = false;
        func.call(context);
        window.setTimeout(function () {
            throttle.ready = true;
        }, 1000);
    }
}
throttle.ready = true;

/**
 * 设置storage
 * @param {Object} key
 * @param {Object} value
 */
export function setStorage(key, value) {
    if (window.localStorage) {
        var storage = window.localStorage;
        storage.setItem(key, value);
    }
}

/**
 * 获取storage
 * @param {Object} key
 */
export function getStorage(key) {
    if (window.localStorage) {
        var storage = window.localStorage;
        if ("undefined" != typeof (storage.getItem(key)) && null != storage.getItem(key) && "" != storage.getItem(key)) {
            return storage.getItem(key);
        } else {
            return "";
        }
    }
}

/**
 * 删除storage
 * @param {Object} key
 */
export function deleteStorage(key) {
    if (window.localStorage) {
        localStorage.removeItem(key);
    }
}

/**
* 解析token
* @param {*} str 
*/
export function decodeToken(str) {
    str = str.split('.')[1];
    str = str.replace('/-/g', '+');
    str = str.replace('/_/g', '/');
    switch (str.length % 4) {
        case 0:
            break;
        case 2:
            str += '==';
            break;
        case 3:
            str += '=';
            break;
        default:
            throw 'Invalid token';
    }

    str = (str + '===').slice(0, str.length + (str.length % 4));
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    str = decodeURIComponent(escape(atob(str)));
    str = JSON.parse(str);
    return str;
}

/**
 * 获取当前url的参数 
 */
export function getUrlParams() {
    var url = window.location.href;
    var regexP = /[^#&?]+=[^#&?]*/ig,
        res = {};
    var ms = url.match(regexP);
    if (ms) {
        for (var i = 0; i < ms.length; i++) {
            var arr = ms[i].split('=');
            res[arr[0]] = decodeURI(arr[1]);
        }
    }
    return res;
}

/**
 * 判断是否是表情
 */
export function isEmojiCharacter(substring) {
    for (var i = 0; i < substring.length; i++) {
        var hs = substring.charCodeAt(i);
        if (0xd800 <= hs && hs <= 0xdbff) {
            if (substring.length > 1) {
                let ls = substring.charCodeAt(i + 1);
                var uc =
                    (hs - 0xd800) * 0x400 + (ls - 0xdc00) + 0x10000;
                if (0x1d000 <= uc && uc <= 0x1f77f) {
                    return true;
                }
            }
        } else if (substring.length > 1) {
            let ls = substring.charCodeAt(i + 1);
            if (ls == 0x20e3) {
                return true;
            }
        } else {
            if (0x2100 <= hs && hs <= 0x27ff) {
                return true;
            } else if (0x2b05 <= hs && hs <= 0x2b07) {
                return true;
            } else if (0x2934 <= hs && hs <= 0x2935) {
                return true;
            } else if (0x3297 <= hs && hs <= 0x3299) {
                return true;
            } else if (
                hs == 0xa9 ||
                hs == 0xae ||
                hs == 0x303d ||
                hs == 0x3030 ||
                hs == 0x2b55 ||
                hs == 0x2b1c ||
                hs == 0x2b1b ||
                hs == 0x2b50
            ) {
                return true;
            }
        }
    }
}
/**
*实现手机号3-4-4格式
*/
export function regPhone(phoneNumber) {
    if (phoneNumber && phoneNumber.length == 11) {
        return (
            phoneNumber.substring(0, 3) +
            " " +
            phoneNumber.substring(3, 7) +
            " " +
            phoneNumber.substring(7, 11)
        );
    }
}
/**
 * 阻止enter键入换行
 */
export function checkEnter(e) {
    var et = e || window.event;
    var keycode = et.charCode || et.keyCode;
    if (keycode == 13) {
        if (window.event) {
            window.event.returnValue = false;
        } else {
            e.preventDefault();
        }
    }
}
/**
 * 
 * @param {Array} menuList 
 * 设置title
 */
export function initTitleMenu(menuList) {
    var menuMap = {
        menuTitle: { name: menuList[0], menuId: 'title', type: 3 },
        menuOpenHistory: { iconNormalBase64: imgBase64Map['path_1_0'], menuId: 'but_1_0', type: 1, func: function () { } },
    }
    var titleMenuList = [menuMap.menuTitle];
    for (var i = 1; i < menuList.length; i++) {
        var menuName = menuList[i];
        if ('String' == getClass(menuName)) {
            titleMenuList.push(menuMap[menuName]);
        } else if ('Object' == getClass(menuName)) {
            titleMenuList.push(menuName);
        }
    }
    RegisterMenuFunction(titleMenuList);
}

/**
    * 调用app获取配置信息
    * @param {Object} signData
    */

export function GetAppConfigFunction(data = {}) {
    return callHandler('GetAppConfigFunction', data);
}

/**
 * 获取类型名称
 * @param {Object} object
 * __getClass(5); // => "Number"
 * __getClass({}); // => "Object"
 * __getClass(/foo/); // => "RegExp"
 * __getClass(''); // => "String"
 * __getClass(true); // => "Boolean"
 * __getClass([]); // => "Array"
 * __getClass(undefined); // => "Window"
 * __getClass(Element); // => "Constructor"
 *
 */
export function getClass(object) {
    return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
}

/**
 * 确认框提示
 * @param {Object} content      内容
 * @param {Object} rightFunction   右侧按钮点击事件
 * @param {Object} title        title
 * @param {Object} typeItem         类型       1-单个按钮  2-两个按钮  3-多个按钮      默认为两个按钮
 * @param {Object} strLeftBtn   左侧按钮
 * @param {Object} strRightBtn  右侧按钮
 * @param {Object} leftFunction   左侧按钮点击事件
 * @param {Object} H5Flag       是否调用H5方法
 */
export function showConfirm(content, rightFunction, typeItem, strLeftBtn, strRightBtn, title, leftFunction, H5Flag) {
    var type = typeItem || 2;//默认两个按钮	
    if (!H5Flag) {//非H5方法
        if (2 == type) {//两个按钮
            strLeftBtn = strLeftBtn || '取消';
            strRightBtn = strRightBtn || '确认';
            if (isPC()) {//PC默认为左侧确定，右侧取消	
                var tempFun = rightFunction;
                rightFunction = leftFunction;
                leftFunction = tempFun;
                var tempText = strRightBtn;
                strRightBtn = strLeftBtn || '取消';
                strLeftBtn = tempText || '确认';
            }
        }
        var confirmJson = {//调用native弹框方法请求参数
            requestCode: 0,
            strTitle: title,
            message: content,
            strLeftBtn: strLeftBtn,
            rightBtnFontColor: '#478aee',//右边按钮默认颜色
            strRightBtn: strRightBtn
        };
        //调用native弹框方法
        CommonDialogFunction(confirmJson).then(function (data) {
            if (3 == data.clickType) {//两个按钮点击右侧按钮     //选择按钮类型 1:关闭按钮  2:左侧按钮  3:右侧按钮
                if (rightFunction) {//函数存在则执行函数
                    rightFunction();
                }
            } else if (2 == data.clickType) {//两个按钮点击左侧按钮
                if (leftFunction) {//函数存在则执行函数
                    leftFunction();
                }
            }
        });
    } else {
        if (2 == type) {
            Vue.$vux.confirm.show({ //显示confirm弹窗   暂时屏蔽H5方法
                title: title || '',
                content: content,
                onShow() {
                    console.log('show')
                },
                onHide() {
                    console.log('hide')
                },
                onCancel() {
                    leftFunction();
                },
                onConfirm() {
                    rightFunction();
                }
            });
        } else {
            alert(content);
        }
    }
}


