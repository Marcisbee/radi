const path = require("path");

const resolve = _path => path.resolve(__dirname, _path);

module.exports = {
  mode: "development",
  devtool: "sourcemap",
  entry: resolve("../src/index.js"),
  watch: true,
  output: {
    filename: "[name].bundle.js",
    chunkFilename: "[name].bundle.js",
    path: resolve("../lib")
  }
};
