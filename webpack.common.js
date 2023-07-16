const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const platform = process.env.PLATFORM_ENV.trim()

module.exports = {
    entry: {
        content: './src/content/index.ts',
        background: `./src/background.${platform}.ts`,
        injected: './src/injected/index.ts',

    },
    devtool: false,
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: `src/manifest.${platform}.json`, to: "manifest.json"},
            ],
        }),
    ],
};
