const merge = require('webpack-merge');
const webpack = require('webpack');
const chalk = require('chalk');
const rimraf = require('rimraf');
// const glob = require('glob-all');
const baseConfig = require('./webpack.base.config');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// 导入样式压缩
let OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');
// 压缩js
let TerserPlugin = require('terser-webpack-plugin');
//去除无用的css
// const PurifyCSSPlugin = require('purifycss-webpack')
const utils = require('./utils');
let prodConfig = {
    mode: 'production',
    // 压缩 model 必须是production才有效果
    optimization: {
        runtimeChunk: {
            name: `manifest`
        },
        minimizer: [
            // new TerserPlugin({
            //     exclude: /\.min\.js$/,
            //     cache: true, // Boolean/String,字符串即是缓存文件存放的路径
            //     parallel: true, // 启用多线程并行运行提高编译速度
            //     extractComments: false
            // }),
            new OptimizeCssPlugin()
        ],
        noEmitOnErrors: true,
        splitChunks: {
            chunks: `async`, // 必须三选一： "initial" | "all" | "async"
            minSize: 30000, // 最小尺寸
            minChunks: 1, // 在拆分之前共享模块的最小块数
            maxAsyncRequests: 5, // 最大异步请求数
            maxInitialRequests: 3, // 最大初始化请求数
            name: true, // 名称，此选项可接收 function
            cacheGroups: {
                vendor: { // key 为entry中定义的 入口名称
                    name: `sinosun_vendor`, // 要缓存的 分隔出来的 chunk 名称
                    chunks: `all`, // all-异步加载快，但初始下载量较大，文件共用性好； initial-初始下载量较小，但异步加载量较大，文件间有重复内容
                    minChunks: 4,
                    priority: -10,
                    reuseExistingChunk: false, // 选项用于配置在模块完全匹配时重用已有的块，而不是创建新块
                    test: /[\\/]node_modules[\\/]/
                },
                // vendor_async: { // key 为entry中定义的 入口名称
                //     name: `sinosun_vendor_async`, // 要缓存的 分隔出来的 chunk 名称
                //     chunks: `async`, // all-异步加载快，但初始下载量较大，文件共用性好； initial-初始下载量较小，但异步加载量较大，文件间有重复内容
                //     priority: -10,
                //     reuseExistingChunk: false, // 选项用于配置在模块完全匹配时重用已有的块，而不是创建新块
                //     test: /[\\/]node_modules[\\/]/
                // },
                common: { // key 为entry中定义的 入口名称
                    name: `sinosun_common`, // 要缓存的 分隔出来的 chunk 名称
                    chunks: `all`, // all-异步加载快，但初始下载量较大，文件共用性好； initial-初始下载量较小，但异步加载量较大，文件间有重复内容                  
                    minChunks: 2,
                    priority: -10,
                    reuseExistingChunk: false, // 选项用于配置在模块完全匹配时重用已有的块，而不是创建新块
                    test: /[\\/]src[\\/]/
                }
            }
        }
    },
    plugins: [
        // new webpack.DllReferencePlugin({
        //     context: __dirname,
        //     manifest: require('./dist/dll/manifest/lib.manifest.json')
        // }),
        // new webpack.DllReferencePlugin({
        //     context: __dirname,
        //     manifest: require('./dist/dll/manifest/vendor.manifest.json')
        // }),
        new MiniCssExtractPlugin({
            filename: utils.assetsPath("css/[name].[contenthash:8].css"),
        }),
        /**
         * 消除未使用的css
         * @return {*} is
         */
        // new PurifyCSSPlugin({
        //     // glob为扫描模块，使用其同步方法
        //     paths: glob.sync([
        //         utils.resolve(`src/**/*.html`),
        //         utils.resolve(`src/**/*.vue`),
        //         utils.resolve(`src/**/*.js`)
        //     ])
        // }),
        new CleanWebpackPlugin()
    ]
}

console.info(chalk.cyan('> 正在删除:' + utils.resolve('dist/') + ' 目录'))
// 删除当前输出目录下所有文件
rimraf(utils.resolve('dist/'), function (err) { if (err) { console.log('rimraf:' + err); } });
console.info(chalk.cyan('> 删除完成,正在构建...'))

module.exports = merge(baseConfig, prodConfig);