/*
 * @Author: yinfu
 * @Date: 2020-08-24 16:51:07
 * @LastEditTime: 2020-08-26 19:30:33
 * @Description: 
 */
/**
 * 通用string utils工具类
 */

class StringUtils {
    constructor() {

    }

    /**
     * 是否空字符串
     * @param obj
     */
    isEmptyStr(obj) {
        if (typeof obj === 'undefined' || obj === null || obj === '') {
            return true;
        } else {
            return false;
        }
    }

}

export default new StringUtils();
