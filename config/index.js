/*
 * @Author: kegui
 * @Date: 2020-07-28 15:54:55
 * @LastEditTime: 2020-09-21 14:54:28
 * @Description: 
 */
'use strict'
let path = require('path');

const webpackEnv = process.env.NODE_ENV === `development` ? `development` : `production`;

let protocol = `http`;
let ip = `localhost`;
let port = `8081`;
if (webpackEnv === `development`) {
    const internalIp = require(`internal-ip`);
    ip = (internalIp.v4.sync() || `localhost`);
}
const host = `${protocol}://${ip}`;
const hostPort = `${host}:${port}`;

module.exports = {
    webpack: {
        //【views】，默认为views，修改这里的配置的同时，也要同时重命名/src/views的这个文件夹名称  
        moduleName: 'views',
        // 本地起的webpack服务地址
        hostPort: hostPort,
        env: JSON.stringify(webpackEnv),
        envPro: webpackEnv === `production`,
        envDev: webpackEnv === `development`
    },
    build: {
        env: webpackEnv,
        index: path.resolve(__dirname, '../dist/appauthmgr.html'),
        assetsRoot: path.resolve(__dirname, `../dist/authority`),
        assetsSubDirectory: 'static',
        assetsPublicPath: '../',
        productionSourceMap: true,
        // Gzip off by default as many popular static hosts such as
        // Surge or Netlify already gzip all static assets for you.
        // Before setting to `true`, make sure to:
        // npm install --save-dev compression-webpack-plugin
        productionGzip: false,
        productionGzipExtensions: ['js', 'css'],
        // Run the build command with an extra argument to
        // View the bundle analyzer report after build finishes:
        // `npm run build --report`
        // Set to `true` or `false` to always turn it on or off
        bundleAnalyzerReport: process.env.npm_config_report
    },
    dev: {
        env: webpackEnv,
        host: ip,
        port: port,
        autoOpenBrowser: true,
        assetsSubDirectory: 'static',
        assetsPublicPath: '/',
        //指定浏览器打开的页面
        openPage: `pages/appauthmgr.html`,
        proxy: {
            "/yqt/auth": {
                "target": "https://yqtdev.sinosun.com:18094",
                "changeOrigin": true
            },
            "/bizmate": {
                // "target": "https://bizmatesit.sinosun.com:17380/",
                "target": "https://bizmatedev.sinosun.com:17280/",
                "changeOrigin": true
            },
            "/conf": {
                "target": "https://confdev.sinosun.com:31443",
                "changeOrigin": true
            }
        }
    }
}
