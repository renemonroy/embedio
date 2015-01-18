var webpack = require('webpack'),
  WebpackDevServer = require('webpack-dev-server'),
  config = require('./webpack.config.js')('dev');

var server = new WebpackDevServer(webpack(config), {
  contentBase : __dirname,
  hot : false,
  quiet : false,
  noInfo : false,
  publicPath : "/assets",
  stats : { colors : true }
});

server.listen(8081, '10.132.126.219', function() {});