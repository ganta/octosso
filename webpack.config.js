const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin: CleanPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: process.env.NODE_ENV,

  entry: {
    content: "./src/scripts/content.ts",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].js",
  },

  resolve: {
    extensions: [".ts"],
  },

  plugins: [
    new CleanPlugin(),
    new CopyPlugin({
      patterns: [
        { from: "src/manifest.json", to: "." },
        { from: "src/icons/", to: "icons" },
      ]
    })
  ],

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
};
