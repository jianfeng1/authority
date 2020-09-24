const htmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const utils = require('./utils');
const entry = require('./webpack.entry.config')
const config = require('../config');
let plugins = [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: utils.resolve('src/thirdparty'),
                to: `${config.build.assetsRoot}/thirdparty`
            }
        ]
    })
];

Object.keys(entry).forEach(item => {
    let h = new htmlWebpackPlugin({
        template: `./src/appauthmgr.html`,
        filename: `pages/${item}.html`,
        inject: true,            // js插入位置
        hash: true,
        minify: {
            collapseWhitespace: true, //去除空格
            removecomments: true //去除注释
        },
        chunks: [`manifest`, `sinosun_vendor`, `sinosun_common`, `${item}`]//引入entry里面的哪一个chunk
    })
    plugins.push(h)
})

module.exports = {
    entry: entry,
    output: {
        path: config.build.assetsRoot,
        filename: utils.assetsPath('js/[name].js'),
        chunkFilename: utils.assetsPath('js/[name].[chunkhash:8].js'),
        publicPath: config.webpack.envPro
            ? config.build.assetsPublicPath
            : config.dev.assetsPublicPath
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
    module: {
        rules: [{
            test: /\.(sa|sc|c)ss$/,// 正则表达式，指明要处理的文件类型
            use: [config.webpack.envDev ? `style-loader` : {
                loader: MiniCssExtractPlugin.loader, options: {
                    publicPath: '../../'
                }
            },
                'css-loader', 'postcss-loader', 'sass-loader'], // 处理资源所使用的loader, 处理顺序为从右向左
        },
        {
            test: /\.styl$/,// 正则表达式，指明要处理的文件类型
            use: [config.webpack.envDev ? `style-loader` : {
                loader: MiniCssExtractPlugin.loader, options: {
                    publicPath: '../../'
                }
            },
                'css-loader', 'postcss-loader', 'stylus-loader'], // 处理资源所使用的loader, 处理顺序为从右向左
        }, {
            test: /\.less$/,// 正则表达式，指明要处理的文件类型
            use: [config.webpack.envDev ? `style-loader` : {
                loader: MiniCssExtractPlugin.loader, options: {
                    publicPath: '../../'
                }
            },
                'css-loader', 'postcss-loader', 'less-loader', {
                loader: 'sass-resources-loader',
                options: {
                    resources: [
                        utils.resolve('node_modules/sinosun-ui/lib/style/themes/default.less'),
                        utils.resolve('node_modules/sinosun-ui/lib/style/mixins/hairLine.less'),
                    ]
                }
            }], // 处理资源所使用的loader, 处理顺序为从右向左
        },
        {
            test: /\.vue$/,
            loader: `vue-loader`,
            options: {
                loaders: utils.styleLoaders({
                    sourceMap: config.webpack.envPro
                        ? config.build.productionSourceMap
                        : config.dev.cssSourceMap,
                    extract: config.webpack.envPro,
                    usePostCSS: config.webpack.envPro
                })
            }
        },
        // {
        //     test: /\.(js|vue)$/,
        //     loader: 'eslint-loader',
        //     enforce: 'pre',
        //     include: [utils.resolve('src')],
        //     options: {
        //         formatter: require('eslint-friendly-formatter')
        //     }
        // }, 
        {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            enforce: 'pre',
            use: [
                {
                    loader: 'tslint-loader',
                    options: {
                        configFile: 'tslint.json'
                    }
                }
            ]
        }, {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            use: [
                'babel-loader',
                {
                    loader: "ts-loader",
                    options: { appendTsxSuffixTo: [/\.vue$/] }
                }
            ]
        },
        {
            test: /\.(jsx|js)$/,
            loader: 'babel-loader',
            include: [utils.resolve('src')]
        }, {
            test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
            exclude: [utils.resolve('node_modules/sinosun-ui')],
            use: [{
                loader: 'url-loader',
                options: {
                    limit: 1000,
                    esModule: false,
                    name: 'resource/img/[name].[ext]'
                }
            },
                // 生产模式启用图片压缩
                // config.webpack.envPro && {
                //     loader: `imagemin-loader`,
                //     options: {
                //         plugins: [
                //             {
                //                 use: `imagemin-pngquant`
                //             },
                //             {
                //                 use: `imagemin-mozjpeg`
                //             },
                //             {
                //                 use: `imagemin-gifsicle`
                //             },
                //             {
                //                 use: `imagemin-svgo`
                //             }
                //         ]
                //     }
                // }
            ].filter(p => p)
        }, {
            test: /\.svg$/,
            loader: 'svg-sprite-loader',
            options: {
                symbolId: '[name]'
            },
            include: [utils.resolve('node_modules/sinosun-ui')]
        }, {
            test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
            loader: 'url-loader',
            options: {
                limit: 10000,
                name: 'resource/fonts/[name].[ext]'
            }
        }]
    },
    plugins
}