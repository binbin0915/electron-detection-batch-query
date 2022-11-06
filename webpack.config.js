const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  target: "web",
  // target: "electron-renderer",
  // 多入口文件
  entry: {
    home: "./src/renderer/home/index.jsx",
  },
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
    new HtmlWebpackPlugin({
      template: "./src/renderer/home/index.html",
      filename: "index.html",
      chunks: ['home']
    })
  ],

  resolve: {
    extensions: [".js", ".jsx"]
  },

  devServer: {
    port: 3000,
  },

  mode: "development"
}