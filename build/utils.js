const path = require('path');
const config = require('../config');
const MiniCssExtractPlugin = require(`mini-css-extract-plugin`);


function cssLoaders(options) {
    options = options || {};
    const cssLoader = {
        loader: `css-loader`,
        // options是loader的选项配置
        options: {
            // 根据参数是否生成sourceMap文件
            sourceMap: options.sourceMap
        }
    };

    const postcssLoader = {
        loader: `postcss-loader`,
        // options是loader的选项配置
        options: {
            // 根据参数是否生成sourceMap文件
            sourceMap: options.sourceMap

        }
    };

    // 生成loader
    function generateLoaders(loader, loaderOptions) {
        const rules = [`vue-style-loader`, cssLoader];
        if (options.usePostCSS) {
            rules.push(postcssLoader);
        }
        if (loader) {
            rules.push({
                loader: `${loader}-loader`,
                options: Object.assign({}, loaderOptions, {
                    sourceMap: options.sourceMap
                })
            });
        }

        // Extract CSS when that option is specified
        // (which is the case during production build)
        if (options.extract) {
            rules.push({
                loader: MiniCssExtractPlugin.loader,
                options: {
                    publicPath: '../../'
                }
            });
        }
        return rules;
    }

    // 返回css类型对应的loader组成的对象 generateLoaders()来生成loader
    return {
        css: generateLoaders(),
        postcss: generateLoaders(),
        less: generateLoaders(`less`),
        sass: generateLoaders(`sass`, { indentedSyntax: true }),
        scss: generateLoaders(`sass`),
        stylus: generateLoaders(`stylus`),
        styl: generateLoaders(`stylus`)
    };
}

function styleLoaders(options) {
    // 定义返回的数组，数组中保存的是针对各类型的样式文件的处理方式
    const output = [];
    // 调用cssLoaders方法返回各类型的样式对象(css: loader)
    const loaders = cssLoaders(options);
    // 循环遍历loaders
    for (const extension in Object.keys(loaders)) {
        if (Object.hasOwnProperty.call(loaders, extension)) {
            // 根据遍历获得的key(extension)来得到value(loader)
            const loader = loaders[extension];
            output.push({
                // 处理的文件类型
                test: new RegExp(`\\.${extension}$`),
                // 用loader来处理，loader来自loaders[extension]
                use: loader
            });
        }
    }
    return output;
}

function resolve(dir) {
    return path.join(__dirname, '..', dir);
}

function assetsPath(dirPath) {
    let assetsSubDirectory = config.webpack.envPro
        ? config.build.assetsSubDirectory
        : config.dev.assetsSubDirectory

    return path.posix.join(assetsSubDirectory, dirPath)
}
module.exports = {
    resolve,
    assetsPath,
    styleLoaders
}