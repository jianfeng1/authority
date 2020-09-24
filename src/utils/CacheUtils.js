/**
 * 增加缓存数据
 * @param {*} type 缓存数据类型
 * @param {*} data 缓存数据
 */
export function addCacheData(type, list) {
    let result = {
        msg: '',
        code: 0,
        data: []
    };
    return new Promise((resolve, reject) => {
        if (list && list.length) {
            window.localStorage.setItem(type, JSON.stringify(list));
            result.msg = "ok";
            result.code = 0;
            result.data = list;
            resolve(result);
        } else {
            result.msg = "save cache error";
            result.code = 500;
            reject(result.msg);
        }
    });
}

/**
 * 加载缓存数据
 * @param {*} type 缓存数据类型
 */
export function loadCacheData(type) {
    let result = {
        msg: '',
        code: 0,
        data: []
    };
    return new Promise((resolve, reject) => {
        if (type) {
            let listStr = window.localStorage.getItem(type);
            let list = JSON.parse(listStr) || [];
            result.msg = "load cache ok";
            result.code = 0;
            result.data = list;
            resolve(result);
        } else {
            result.msg = "load cache null";
            result.code = 500;
            reject(result.msg);
        }
    });
}

/**
 * 删除缓存数据
 * @param {*} type 缓存数据类型
 */
export function delCacheData(type) {
    let result = {
        msg: '',
        code: 0,
        data: []
    };
    return new Promise((resolve, reject) => {
        window.localStorage.setItem(type, JSON.stringify([]));
        let listStr = window.localStorage.getItem(type);
        let list = JSON.parse(listStr) || [];
        if (!list.length) {
            result.msg = "delete cache ok";
            result.code = 0;
            resolve(result);
        } else {
            result.msg = "delete cache error";
            result.code = 500;
            reject(result.msg);
        }
    });
}







