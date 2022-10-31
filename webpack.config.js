const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: "web",
  // target: "electron-renderer",
  // 多入口文件
  entry: {
    // index: "./src/renderer/index.ts",
    home: "./src/renderer/home/index.jsx",
    // about: "./src/renderer/about/index.tsx",
  },
  // entry: "./src/renderer/home/index.tsx",
  output: {
    filename: "[name].[hash:8].bundle.js",
    path: path.resolve(__dirname, "./dist")
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)?$/,
        use: ["babel-loader"],
        exclude: path.resolve(__dirname, "node_modules")
      },
      {
        test: /\.(css|scss)?$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),
    // 多个模板
    // new HtmlWebpackPlugin({
    //   template: "./public/index.html",
    //   filename: "index-temp.html",
    //   chunks: ['index']
    // }),
    new HtmlWebpackPlugin({
      template: "./src/renderer/home/index.html",
      filename: "index.html",
      chunks: ['home']
    }),
    // new HtmlWebpackPlugin({
    //   template: "./src/renderer/about/index.html",
    //   filename: "about.html",
    //   chunks: ['about']
    // }),
  ],

  resolve: {
    extensions: [".js", ".jsx"]
  },

  devServer: {
    // hot: false,
    port: 3000,
  },

  mode: "development"
}