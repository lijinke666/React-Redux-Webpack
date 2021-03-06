const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const AutoDllPlugin = require("autodll-webpack-plugin");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const { host, port, enableBundleAnalyzer } = require("./config");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const isDev = process.env.NODE_ENV === "development";

module.exports = () => {
  const options = {
    mode: process.env.NODE_ENV || "development",
    target: "web",

    devServer: {
      stats: {
        cached: true,
        chunkModules: false,
        colors: true
      },
      port,
      hot: true,
      inline: true,
      historyApiFallback: true,
      open: true,
      publicPath: "/"
    },

    entry: isDev
      ? [
          "react-hot-loader/patch",
          `webpack-dev-server/client?${host}:${port}`,
          "webpack/hot/only-dev-server",
          path.resolve(__dirname, "src")
        ]
      : {
          app: path.resolve(__dirname, "src")
        },

    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].[hash].js",
      chunkFilename: "[name].[hash].js",
      publicPath: "/"
    },

    module: {
      rules: [
        {
          test: /\.(j|t)s[x]?$/,
          use: [
            {
              loader: "babel-loader"
            }
          ],
          exclude: "/node_modules/",
          include: [path.resolve("src")]
        },
        {
          test: /\.(le|c)ss$/,
          use: isDev
            ? [
                { loader: "style-loader" },
                {
                  loader: "css-loader",
                  options: {
                    importLoaders: 1
                  }
                },

                {
                  loader: "postcss-loader",
                  options: { javascriptEnabled: true, sourceMap: true }
                },
                {
                  loader: "less-loader",
                  options: {
                    sourceMap: false,
                    javascriptEnabled: true
                  }
                }
              ]
            : ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: [
                  {
                    loader: "css-loader",
                    options: {
                      importLoaders: 1
                    }
                  },
                  {
                    loader: "postcss-loader",
                    options: { javascriptEnabled: true, sourceMap: false }
                  },
                  {
                    loader: "less-loader",
                    options: {
                      sourceMap: false,
                      javascriptEnabled: true
                    }
                  }
                ]
              })
        },
        {
          test: /\.(jpg|jpeg|png|gif|cur|ico|eot|ttf|svg|woff|woff2)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[path][name].[hash:8].[ext]",
                limit: 50000
              }
            }
          ]
        }
      ]
    },

    //自动补全后缀
    resolve: {
      enforceExtension: false,
      extensions: [".js", ".jsx", ".json", ".less", ".css", ".ts", ".tsx"],
      modules: [
        path.resolve("src"),
        path.resolve("."),
        path.resolve("src/shared"),
        "node_modules"
      ]
    },

    optimization: {
      concatenateModules: true,
      noEmitOnErrors: true,
      splitChunks: {
        chunks: "all",
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors"
          },
          commons: {
            name: "commons",
            minChunks: 2,
            chunks: "initial"
          },
          styles: {
            name: "styles",
            test: /\.css$/,
            chunks: "all",
            minChunks: 2,
            enforce: true
          }
        }
      },
      runtimeChunk: {
        name: "runtime"
      },
      minimizer: isDev
        ? []
        : [
            new UglifyJsPlugin({
              cache: true,
              parallel: true,
              uglifyOptions: {
                compress: {
                  drop_debugger: true,
                  drop_console: false
                }
              }
            }),
            new OptimizeCssAssetsPlugin({
              cssProcessor: require("cssnano"),
              cssProcessorOptions: { discardComments: { removeAll: true } },
              canPrint: true
            })
          ]
    },

    plugins: []
  };
  if (isDev) {
    options.plugins = options.plugins.concat([
      new webpack.HotModuleReplacementPlugin()
    ]);
  } else {
    options.plugins = options.plugins.concat([
      new webpack.HashedModuleIdsPlugin(),
      new ExtractTextPlugin({
        filename: "css/[name].[chunkhash:8].css",
        allChunks: true
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true
      })
    ]);
  }
  options.plugins.push(
    new ProgressBarPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new HtmlWebpackPlugin({
      title: "bpm-web",
      filename: "index.html",
      inject: true,
      template: path.resolve(__dirname, "src/index.html"),
      hash: true
    }),
    new AutoDllPlugin({
      inject: true, // will inject the DLL bundles to index.html
      filename: "[name].[contenthash].js",
      entry: {
        vendor: [
          "react",
          "react-dom",
          "moment",
          "react-router",
          "react-router-dom"
        ]
      }
    })
  );

  if (enableBundleAnalyzer) {
    options.plugins.push(new BundleAnalyzerPlugin());
  }
  return options;
};
