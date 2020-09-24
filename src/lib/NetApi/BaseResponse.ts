/**
 * @author miaoju
 */

import './CommErrorCode'
import CommErrorCode from './CommErrorCode';
/**
 * 服务器返回的基础数据
 */

class BaseResponse {
    // 业务错误码
    resultCode: number;

    // 业务错误描述，一般只有 resultCode != 0 时有值, 由服务器返回的开发异常描述语言，不可直接展示给用户
    resultMessage: string;

    // 显示给用户的业务异常信息，resultCode != 0 时有值
    resultDesc: string;

    /**
     * 业务返回数据对象，一般只有在 resultCode == 0 时才有值
     */
    result: object;

    /**
     * 业务 url、Params 等请求时的参数
     */
    request: object;

    /**
     * 如果网络api层发生异常，会把异常信息通过error带上去
     */
    // error: object;

    constructor(resultCode: number = CommErrorCode.SUCCESS,
        resultDesc: string = '',
        resultMessage: string = '',
        result: object = {},
        request: object = {}) {
        this.resultCode = resultCode;
        this.resultMessage = resultMessage;
        this.resultDesc = resultDesc;
        this.result = result;
        this.request = request;
    }

    /**
     * 业务操作是否成功
     */
    isSuccess(): boolean {
        return CommErrorCode.SUCCESS === this.resultCode;
    }

    /**
     * 是否网络超时
     */
    isTimeout(): boolean {
        return CommErrorCode.REQUEST_TIMEOUT === this.resultCode;
    }

    /**
     * 是否网络不通
     */
    isNetWorkError(): boolean {
        return CommErrorCode.NETWORK_ERROR === this.resultCode;
    }
}

export default BaseResponse;