const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const chalk = require('chalk');
const rimraf = require('rimraf');
const baseConfig = require('./webpack.base.config');
const config = require('../config');
const utils = require('./utils');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// 导入样式压缩
let OptimizeCssPlugin = require('optimize-css-assets-webpack-plugin');
// 压缩js
let TerserPlugin = require('terser-webpack-plugin');
delete baseConfig.entry;
delete baseConfig.plugins;
delete baseConfig.output;
const dllConfig = {
	mode: "production",
	entry: {
		'lib': [
			'./src/utils/commonUtil.js',
		],
		'vendor': ['vue', 'vuex', 'vue-router', 'sinosun-ui', config.webpack.envEnv && 'mockjs'].filter(p => p)
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				exclude: /\.min\.js$/,
				cache: true, // Boolean/String,字符串即是缓存文件存放的路径
				parallel: true, // 启用多线程并行运行提高编译速度
				extractComments: false
			}),
			new OptimizeCssPlugin()
		],
		noEmitOnErrors: true
	},
	output: {
		path: path.resolve(__dirname, './dist/dll'),
		filename: 'js/[name].dll.js',
		library: 'dll_[name]'
	},
	resolve: {
		extensions: ['.js', '.vue', '.json', '.jsx', '.ts', '.tsx'],
		alias: {
			vue$: 'vue/dist/vue.esm.js',
			'@': utils.resolve('src'),
			'assets': utils.resolve('src/assets'),
			'components': utils.resolve('src/components'),
			'config': utils.resolve('src/config'),
			'model': utils.resolve('src/model'),
			'utils': utils.resolve('src/utils')
		},
	},
	plugins: [
		new webpack.DllPlugin({
			path: path.resolve(__dirname, './dist/dll/manifest/[name].manifest.json'),
		}),
		new MiniCssExtractPlugin({
			filename: "static/css/[name].[contenthash:8].css"
		})
	]
};

console.info(chalk.cyan('> 正在删除dll:' + utils.resolve('build/dist/') + ' 目录'))
// 删除当前输出目录下所有文件
rimraf(utils.resolve('build/dist/'), function (err) { if (err) { console.log('rimraf:' + err); } });

module.exports = merge(baseConfig, dllConfig);
