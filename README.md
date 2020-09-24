<!--
 * @Author: kegui
 * @Date: 2020-07-28 15:54:55
 * @LastEditTime: 2020-07-28 16:17:31
 * @Description: 
 * @FilePath: \authority\README.md
--> 
# User
H5企业广场相关代码
### 注意事项
1、使用 `npm i` 安装如果有报错，强烈建议给 `npm` 设置 taobao 的 registry，`npm install --registry=https://registry.npm.taobao.org`

2、 由于项目中使用到了图片压缩插件 `imagemin-gifsicle`，第一次下载的时候会出现丢包现象，建议重新 `npm i` 

3、项目中使用了打包缓存的配置，所以第一次下载项目跑之前，需要 `npm run dll`，成功之后才能 `npm run dev` 或者 `npm run build`


## 目录结构
```
|-- user
    |-- .babelrc.js
    |-- .editorconfig       # 编辑器统一配置
    |-- .eslintrc.js        # eslint自定义配置
    |-- .gitignore          # 忽略文件
    |-- package.json        # 项目包管理
    |-- postcss.config.js   # 项目移动端样式兼容配置
    |-- README.md
    |-- tsconfig.json       # 项目TypeScript配置
    |-- tslint.json         # 项目TypeScript-lint配置
    |-- build
    |   |-- utils.js
    |   |-- webpack.base.config.js
    |   |-- webpack.build.config.js
    |   |-- webpack.dev.config.js
    |   |-- webpack.dll.config.js
    |   |-- webpack.entry.config.js   # 设置入口文件
    |-- config
    |   |-- index.js
    |-- src
        |-- app.vue     # 用户入口vue文件
        |-- index.html
        |-- shims-tsx.d.ts
        |-- shims-vue.d.ts
        |-- assets
        |   |-- font    # 公共的字体文件
        |       |-- sinosun-number.ttf
        |-- baseView
        |   |-- baseApp.vue     # 基础公共的入口页面处理
        |   |-- baseRouter.vue  # 公共的路由跳转处理
        |   |-- EventType.ts
        |-- components          # 存放公共组件
        |   |-- SnAvatar
        |       |-- index.vue
        |-- config
        |   |-- errorConfig.js
        |   |-- userConfig.js   # 定义公共的设置（后台接口地址等）
        |-- lib
        |   |-- NetApi
        |       |-- BaseApi.ts
        |       |-- BaseResponse.ts
        |       |-- BPlusToken.js
        |       |-- CommErrorCode.ts
        |       |-- Net.ts
        |-- model
        |   |-- PageInfo.ts     #  用于定于分页信息
        |   |-- UserInfo.ts     #  用于定于用户信息
        |-- router
        |   |-- baseRouter.js
        |-- service
        |   |-- ApiUrl.ts
        |   |-- README.md
        |   |-- UserErrorCode.ts
        |-- thirdparty
        |   |-- keycloak.json
        |   |-- keycloak.sino.js
        |-- utils
        |   |-- CacheUtils.js   # 公共操作store的方法
        |   |-- commonUtil.js   # 公共的一些函数方法
        |   |-- StringUtils.ts  # 操作字符串的方法
        |   |-- userBridge.js   # 与客户端交互的方法
        |-- views
            |-- user
                |-- index.js
                |-- index.less
                |-- components
                |   |-- index
                |       |-- index.less
                |       |-- index.vue
                |-- router
                |   |-- index.js
                |-- store
                    |-- getters.js
                    |-- mutations.js
                    |-- store.js
```