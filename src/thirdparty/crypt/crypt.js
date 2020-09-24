
/**
 * RSA2048+AES128
 */

/**
 * 公钥参数
 */
var PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAngyZig4cMO3FHzLYFOM2F8opTxTFeOryjy5iCrCSjUwYdQsmdu7g4mrv25ngKNKgM8HqQyH+DmrbfGcw537wxChEgs8ZpnQRDLUJM5bk7fHtZlcO13tWIlkKJOwjTcRT7dIlQ72cNpfheJZcbhmadphx7sv0pdsaZ5sq7DapD8RmONi8tqKVqictj1LGot/i3qsyG3rZfIMxdaG47L+qIjQ1kx+RI56sfeNZ4csTIabXe6UcwLp/wKzpqwSHGU/1gF/i2n64x13xg6TVFYMLmsAIfpEW0wuRbdZvUWHMqKP7bUrTy5I/CDbyA01gt15E8sw3etMo1AV2q/V3vvQW6wIDAQAB';
//AES向量
var _mAESIV = [109, 115, 116, 112, 115, 105, 110, 111, 115, 117, 110, 99, 111, 109, 99, 110];

var CommonCrypt = {
    /**
     * 生成AES加密key
     * @param len
     * @returns
     */
    getAesKey: function(len) {　　
        len = len || 16;　　
        var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
        var maxPos = $chars.length;
        var keyStr = '';　　
        for(var i = 0; i < len; i++) {　　　　
            keyStr += $chars.charAt(Math.floor(Math.random() * maxPos));　　
        }　　
        return keyStr;
    },
    
    /**
     * AES加密
     * @param word
     * @returns {*}
     */
    encrypt:function (word, keyStr){
        var key = CryptoJS.enc.Utf8.parse(keyStr);
        
        var ivBv = new Uint8Array(_mAESIV);
        var ivWA = CryptoJS.enc.u8array.parse(ivBv);
        var srcs = CryptoJS.enc.Utf8.parse(word);
        var encrypted = CryptoJS.AES.encrypt(srcs, key, {
            iv: ivWA,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        var result = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        return result;
    },

    
    /**
     * 加密AES key
     * 参数:待加密key
     */
    encryptKey: function(key) {
        //使用公钥加密
        var encrypt = new JSEncrypt();
        encrypt.setPublicKey('-----BEGIN PUBLIC KEY-----' + PUBLIC_KEY + '-----END PUBLIC KEY-----');
        var encryptedKey = encrypt.encrypt(key);
        return encryptedKey;
    },

    /**
     * AES解密
     * @param word
     * @returns {*}
     */
    decrypt:function (word, keyStr){
        var word = CommonCrypt._base64UrlSafe2Base64UrlUnsafe(word);
        var key = CryptoJS.enc.Utf8.parse(keyStr);
        var ivBv = new Uint8Array(_mAESIV);
        var ivWA = CryptoJS.enc.u8array.parse(ivBv);

        var decrypt = CryptoJS.AES.decrypt(word, key, {
            iv: ivWA,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        var deData = CryptoJS.enc.Utf8.stringify(decrypt).toString();
        return deData;
    },
    //base65UrlSafe转base64
    _base64UrlSafe2Base64UrlUnsafe: function(base64UrlSafeStr) {
        var result;
        result = base64UrlSafeStr.replace(/_/g, "/");
        result = result.replace(/-/g, "+");
        return result;
    },
};