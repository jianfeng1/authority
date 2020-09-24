/**
 * @author miaoju
 */
import axios from 'axios';
import Qs from 'qs';
import CommErrorCode from './CommErrorCode';
// import { decrypt, encrypt, getAesKey, encryptKey } from '../../utils/common/crypto.js';
//设置超时时间
axios.defaults.timeout = 30000;
//配置响应拦截器
axios.interceptors.response.use(response => {
    //对响应数据做些事;
    return Promise.resolve(response.data);
}, error => {
    //响应错误时做些事
    return Promise.reject(error);
});
/**
 * B+业务网络请求模块
 * 这一层只处理通用网络请求，不处理任何其他业务，包括网络检测
 */

/** 接口response示例:
 *
 * 查询成功
 * Model
 *  {
 *  "resultCode": 0,
 *  "resultMessage": "success",
 *  "result": {
 *      "receiverInfo": {
 *      "province": "string",
 *      "provinceCode": "string",
 *      "city": "string",
 *      "cityCode": "string",
 *      "district": "string",
 *      "districtCode": "string",
 *      "townCode": "string",
 *      "town": "string",
 *      "address": "string",
 *      "name": "string",
 *      "phone": "string"
 *      }
 *  }
 *  }
 *  Headers:
 *  Name	Description	Type
 *  Bplus-Result-Code
 *  200 表示服务器收到了请求，并由业务端作出了响应。 有可能是成功的响应（比如下单成功），也有可能是（业务）失败的响应（比如余额不足导致下单失败）。 业务处理结果，由业务返回码进行说明。
 *
 *  string
 *  Retry-After
 *  表示客户端需要等待多长时间之后才能继续发送请求
 *
 *  string
 *  Content-Type
 *  表示返回body的格式
 *
 *  string
 *  401
 *  表示“未授权”，通常是请求中缺少token，或者token无效（非法或过期）。 此时body为空
 *
 *  403
 *  表示“禁止访问”，通常是访问了token的scope之外的接口。 此时body为空
 *
 *  555
 *  B+扩展的、非标准的返回码，表示“中心故障，需要切换”。App在收到此返回码后，切换到备用数据中心（通常是启用DNS）。 此外，系统错误码555也表示“中心故障，需要切换”，含义和HTTP状态码555相同。 此时body为空
 */

// class Net {
//     doRequest(url: string, params: object, headers: object, method: string): Promise<object> {
//         return new Promise((res, rej) => {
//             //根据不同的请求，设置对应的参数
//             const aesKey = getAesKey();
//             this.encryptData(params, aesKey).then(result => {
//                 const requestData = result;
//                 const requestConfig = method.toUpperCase() === 'GET' ? {
//                     method,
//                     url,
//                     headers,
//                     paramsSerializer(requestData: object): string {
//                         return Qs.stringify(requestData, { arrayFormat: 'repeat' })
//                     },
//                     params: requestData
//                 } : {
//                         method,
//                         url,
//                         headers,
//                         data: requestData
//                     }
//                 //使用axois进行网络请求
//                 axios(requestConfig as object).then((data: any) => {
//                     if (!!data && typeof data === 'string') {
//                         try {
//                             const dataCy = decrypt(data, aesKey);
//                             res(JSON.parse(dataCy));
//                         } catch (error) {
//                             res({ result: data });
//                         }
//                     } else if (!!data && typeof data === 'object') {
//                         res(data);
//                     }
//                 }).catch(error => { // 统一处理异常情况, 由调用层自己处理异常情况
//                     const localErrorCode = this.parseErrorCode(error);
//                     error = Object.assign(error, { localErrorCode });
//                     rej(error);
//                 })
//             })

//         });
//     }

//     /**
//      * 把网络层发生的异常情况统一封装到 定义好的CommErrorCode，由api层根据情况处理
//      */
//     parseErrorCode(error): number {
//         // 1、处理httpCode
//         if (error.response) {
//             const httpCode = error.response.status;
//             // 接口未授权(未登陆)
//             if (httpCode === 401) {
//                 return CommErrorCode.UN_AUTHORIZED_TOEKN;
//             } else if (httpCode === 403) {
//                 // 接口无访问权限
//                 return CommErrorCode.NO_PERMISSION_API;
//             } else if (httpCode === 555) {
//                 // 服务故障
//                 return CommErrorCode.SERVICE_ERROR;
//             }
//         }

//         // 2、处理请求超时 TODO
//         // return CommErrorCode.REQUEST_TIMEOUT;

//         // 3、都没处理的就算未知异常
//         return CommErrorCode.UNKNOWN_ERROR;
//     }

//     /**
//      * 加密数据
//      * @param data 请求参数
//      * @param aesKey 加密钥匙
//      */
//     encryptData(data = {}, aesKey) {
//         const p = new Promise(function (res, rej) {
//             //加密
//             // const aesKey = getAesKey();
//             const encrypteddata = encrypt(JSON.stringify(data), aesKey);
//             const encryptedKey = encryptKey(aesKey);
//             const pram = {
//                 bdata: JSON.stringify({
//                     data: encrypteddata,
//                     zip: 0,
//                     key: encryptedKey,
//                     keyType: 17
//                 })
//             };
//             res(pram)
//         });
//         return p;
//     }
// }
class Net {
    doRequest(url: string, params: object, headers: object, method: string): Promise<object> {
        return new Promise((res, rej) => {
            //根据不同的请求，设置对应的参数
            const requestConfig = method.toUpperCase() === 'GET' ? {
                method,
                url,
                headers,
                paramsSerializer(params: object): string {
                    return Qs.stringify(params, { arrayFormat: 'repeat' })
                },
                params
            } : {
                    method,
                    url,
                    headers,
                    data: params
                }
            //使用axois进行网络请求
            axios(requestConfig as object).then(data => {
                res(data.data || data);
            }).catch(error => { // 统一处理异常情况, 由调用层自己处理异常情况
                const localErrorCode = this.parseErrorCode(error);
                error = Object.assign(error, { localErrorCode });
                rej(error);
            })
        });
    }

    /**
     * 把网络层发生的异常情况统一封装到 定义好的CommErrorCode，由api层根据情况处理
     */
    parseErrorCode(error): number {
        // 1、处理httpCode
        if (error.response) {
            const httpCode = error.response.status;
            // 接口未授权(未登陆)
            if (httpCode === 401) {
                return CommErrorCode.UN_AUTHORIZED_TOEKN;
            } else if (httpCode === 403) {
                // 接口无访问权限
                return CommErrorCode.NO_PERMISSION_API;
            } else if (httpCode === 555) {
                // 服务故障
                return CommErrorCode.SERVICE_ERROR;
            }
        }

        // 2、处理请求超时 TODO
        // return CommErrorCode.REQUEST_TIMEOUT;

        // 3、都没处理的就算未知异常
        return CommErrorCode.UNKNOWN_ERROR;
    }
}
export default new Net();