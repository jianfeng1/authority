
import pinyin from 'js-pinyin';
import AuthCode from "@/model/AuthCode";

/**
 * 对姓名进行排序
 * @param array
 * @param isTag表示需不需要展示姓名大写首字母，通讯录页面需要，权限详情页人员信息列表不需要
 */
export function sortUserListByName(arr, isTag = true) {
    let letters = "*abcdefghjklmnopqrstwxyz".split('');
    let zh = "阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀".split('');
    let sortedList = [];
    let curr;
    letters.forEach(function (item, i) {
        curr = {
            groupName: item.toUpperCase(),
            userList: []
        };
        arr.forEach(function (items) {
            if (zh[i] !== '*' && isChinese(items.name)) {
                if ((pinyin.getCamelChars(items.name).charAt(0) == item.toUpperCase())) {
                    items.groupName = item.toUpperCase();
                    curr.userList.push(items);
                }
            } else if (isCharacter(items.name)) {
                if (items.name.slice(0, 1).toLowerCase() == item) {
                    items.groupName = item.toUpperCase();
                    curr.userList.push(items);
                }
            }
        });
        if (curr.userList.length) {
            sortedList.push(curr);
            curr.userList.sort(function (a, b) {
                return (a.name).localeCompare(b.name);
            });
        }
    });
    //对数字开头的用户名称进行处理
    let numTemp = {
        groupName: '#',
        userList: []
    };
    arr.forEach(function (items) {
        if (isNumber(items.name)) {
            numTemp.userList.push(items);
        }
    });
    if (numTemp.userList && numTemp.userList.length) {
        numTemp.userList.sort(function (a, b) {
            return (a.name).localeCompare(b.name);
        });
        sortedList.push(numTemp);
    }
    //排序之后字母在汉字后面，需要将顺序调换过来
    if (sortedList && sortedList.length) {
        sortedList.forEach(function (item, i) {
            let chineseList = []
            let characterList = []
            for (var j = 0, len = item.userList.length; j < len; j++) {
                if (isChinese(item.userList[j].name)) {
                    chineseList.push(item.userList[j]);
                } else if (isCharacter(item.userList[j].name)) {
                    characterList.push(item.userList[j]);
                }
            }
            if (characterList.length || chineseList.length) {
                item.userList = characterList.concat(chineseList);
            }
        })
    }
    //处理返回数据
    if (isTag) {
        return sortedList;
    } else {
        let noTagUserList = []
        sortedList.forEach(item => {
            noTagUserList = noTagUserList.concat(item.userList)
        })
        //去重
        let object = {};
        let sortUserList = noTagUserList.reduce((item, next) => {
            object[next.userId] ? "" : object[next.userId] = item.push(next);
            return item;
        }, []);
        return sortUserList;
    }
}

/**
 * 判断字符串是否汉字开头
 * @param string
 */
export function isChinese(temp) {
    var re = /[^\u4E00-\u9FA5]/;
    if (re.test(temp.slice(0, 1))) return false;
    return true;
}

//判断是否数字开头
export function isNumber(temp) {
    var re = /[0-9]/;
    if (re.test(temp.slice(0, 1))) return true;
    return false;
}

//判断是否字母开头
export function isCharacter(temp) {
    let t = temp.charAt(0).toLowerCase();
    if (t <= 'z' && t >= 'a') return true;
    return false;
}


//处理有效期,authValidity：1=永久有效；2=设置了有效期。authValidityType：0=未生效；1=生效中；2=已过期
export function handleValidity(item = {}) {
    if ((!item.beginTime && !item.endTime) || (item.endTime == 9999999999)) {
        item.authValidity = 1;
    } else {
        item.authValidity = 2;
        let timestamp = Date.parse(new Date()) / 1000;
        if (item.beginTime > timestamp) {
            item.authValidityType = 0;
        } else if (item.endTime < timestamp) {
            item.authValidityType = 2;
        } else {
            item.authValidityType = 1;
        }
    }
    return item;
}

//处理权限树,根据分组名称进行分组，未设置分组名称的权限分到“其他”组里面，页面展示时优先展示，剩下的权限依据创建时间排序
//查询人员权限时，最高管理者会返回所有的权限，当为最高管理者时，只需要展示一个权限2_-1_root即可
export function handleAuthTree(permissionList, isUser = false, isAdmin = false) {
    if (permissionList && permissionList.length) {
        let permissionListResult = [];
        let tagList = [];
        let permissionListTemp = [];
        if (isUser) {
            for (let item of permissionList) {
                if (item.bisCode == AuthCode.CPY_ROOT) {
                    permissionListTemp.push(item);
                    break;
                }
            }
            if (!permissionListTemp.length) {
                permissionListTemp = permissionList;
            }
        } else {
            if (isAdmin) {
                permissionListTemp = permissionList;
            } else {
                for (const [idx, item] of permissionList.entries()) {
                    if (item.bisCode == AuthCode.CPY_AUTH) {
                        permissionList.splice(idx, 1);
                        break;
                    }
                }
                permissionListTemp = permissionList;
            }

        }
        //第一步：获取分组名称,“其他”分组排在最前面，后面的分组按照创建时间排序，并且屏蔽企业所有权限
        tagList.push('其他');
        for (var i = 0; i < permissionListTemp.length; i++) {
            permissionListTemp[i].tag = !!permissionListTemp[i].tag ? permissionListTemp[i].tag : '其他';
            if (tagList.indexOf(permissionListTemp[i].tag) < 0) {
                tagList.push(permissionListTemp[i].tag)
            }
        }
        //根据分组名称处理权限树结构，先处理两层树结构
        tagList.forEach((item) => {
            let currentObj = {
                isGroup: false,
                authName: item,
                childrenAuth: []
            }
            permissionListTemp.forEach((items, index) => {
                if (item == items.tag) {
                    currentObj.childrenAuth.push(items);
                }
            })
            if (currentObj.childrenAuth.length) {
                currentObj.isGroup = true;
                permissionListResult.push(currentObj);
            }
        })
        //处理权限三层树结构，如果权限码是2_268435457_amount_xxx形式，表明可以新增和删除
        permissionListResult.forEach((item) => {
            let amountObj = {
                bisCode: '',
                name: '',
                tag: '',
                childrenAuth: []
            }
            let bbMgrObj = {
                bisCode: '',
                name: '',
                tag: '',
                childrenAuth: []
            }
            if (item.childrenAuth && item.childrenAuth.length > 0) {
                item.childrenAuth.forEach((items) => {
                    if ((items.bisCode).split('_').length > 3) {
                        if (!amountObj.bisCode) {
                            amountObj.tag = items.tag;
                            amountObj.name = items.name.split('：')[0];
                            amountObj.bisCode = items.bisCode.slice(0, items.bisCode
                                .lastIndexOf('_'));
                        } else if (amountObj.bisCode != items.bisCode.slice(0, items.bisCode
                            .lastIndexOf('_'))) {
                            bbMgrObj.tag = items.tag;
                            bbMgrObj.name = items.name.split('：')[0];
                            bbMgrObj.bisCode = items.bisCode.slice(0, items.bisCode
                                .lastIndexOf('_'));
                        }
                        items.canAdd = true;
                        if (amountObj.bisCode == items.bisCode.slice(0, items.bisCode
                            .lastIndexOf('_'))) {
                            amountObj.childrenAuth.push(items);
                        }
                        if (bbMgrObj.bisCode == items.bisCode.slice(0, items.bisCode
                            .lastIndexOf('_'))) {
                            bbMgrObj.childrenAuth.push(items);
                        }

                    }
                })
                for (var i = 0; i < item.childrenAuth.length; i++) {
                    if ((item.childrenAuth[i].bisCode).split('_').length > 3) {
                        item.childrenAuth.splice(i, 1);
                        i--;
                    }
                }
            }
            if (amountObj.bisCode) {
                item.childrenAuth.push(amountObj);
            }
            if (bbMgrObj.bisCode) {
                item.childrenAuth.push(bbMgrObj);
            }
        })
        return permissionListResult;
    }
}