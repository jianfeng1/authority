/**
 * @author miaoju
 */

/**
 * 最基础通用的错误码信息，业务错误码不要放在这里面
 */
enum CommErrorCode {
    /**
     * 业务成功
     */
    SUCCESS = 0,

    /**
     * 网络不通
     * 发送request之前就本地检查到网络不通
     */
    NETWORK_ERROR = -1000,

    /**
     * url错误
     */
    URL_FORMAT_ERROR = -1001,

    /**
     * 请求网络超时
     * 接口访问返回的请求超时
     */
    REQUEST_TIMEOUT = -1002,

    /**
     * 用户未授权 / 登录
     * httpCode 401
     * 表示“未授权”，通常是请求中缺少token，或者token无效（非法或过期）。 此时body为空
     */
    UN_AUTHORIZED_TOEKN = -4001,

    /**
     * 没有接口访问权限
     * httpCode 403
     * 表示“禁止访问”，通常是访问了token的scope之外的接口。 此时body为空
     */
    NO_PERMISSION_API = -4002,

    /**
     * 服务器故障
     * httpCode 555
     * B+扩展的、非标准的返回码，表示“中心故障，需要切换”。App在收到此返回码后，切换到备用数据中心（通常是启用DNS）。
     * 此外，系统错误码555也表示“中心故障，需要切换”，含义和HTTP状态码555相同。 此时body为空
     */
    SERVICE_ERROR = -4003,

    /**
     * 未知错误
     */
    UNKNOWN_ERROR = -9999,
}

/**
 * 获取通用异常描述
 * @param code 通用异常码 @link enum CommErrorCode
 */
export function getCommErrorDesc(code: number): string {
    switch (code) {
        case CommErrorCode.SUCCESS: {
            return '请求成功!';
        }
        case CommErrorCode.NETWORK_ERROR: {
            return '网络异常，请检查网络连接';
        }
        case CommErrorCode.URL_FORMAT_ERROR: {
            return '请求地址错误!';
        }
        case CommErrorCode.REQUEST_TIMEOUT: {
            return '请求超时，请检查网络稍后重试!';
        }
        case CommErrorCode.UN_AUTHORIZED_TOEKN: {
            return '用户认证失败!';
        }
        case CommErrorCode.NO_PERMISSION_API: {
            return '无访问权限!';
        }
        case CommErrorCode.SERVICE_ERROR: {
            return '服务故障，请稍后重试!';
        }
        case CommErrorCode.UNKNOWN_ERROR: {
            return '未知错误，请稍后重试!';
        }
    }
    return '';
}

export default CommErrorCode;