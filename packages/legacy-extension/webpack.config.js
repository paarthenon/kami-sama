const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

process.traceDeprecation = true;

module.exports = {
    entry: {
        content: './vendor/chrome/content/chrome.ts',
        popup: './vendor/chrome/popup/bootstrap.tsx',
        background: './vendor/chrome/background/main.ts',
        options: './vendor/chrome/options/options.tsx'
    },
    output: {
        path: path.resolve(__dirname, 'build/webpack'),
        filename: '[name].min.js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            babelrc: false,
                            presets: [
                                ["@babel/preset-env", { "targets": { "node": "10" }, "modules": false }]
                            ],
                            plugins: [
                                '@babel/plugin-transform-async-to-generator',
                            ]
                        }
                    },
                    {
                        loader: 'ts-loader',
                    }
                ]

            },
        ]
    },
    resolve: {
        modules: [
            __dirname,
            'node_modules'
        ],
        extensions: ['.ts','.tsx','.js'],
        alias: {
            'react': 'preact-compat/dist/preact-compat.js',
            'react-dom': 'preact-compat/dist/preact-compat.js'
        }
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    mangle: false,
                    output: {
                        ascii_only: true,
                    }
                }
            }),
        ]
    },
    //TODO: separate these plugins between dev and prod.
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
}
