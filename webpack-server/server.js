var config = require('./config');
process.env.NODE_ENV = config.env;

var webpack = require('webpack'),
  WebpackDevServer = require('webpack-dev-server'),
  webpackConfig = require('./webpack.config.js')(process.env.NODE_ENV);

var bundleConfig = {
  contentBase : __dirname,
  quiet : false,
  noInfo : false,
  publicPath : "/assets",
  stats : { colors : true }
};
if ( process.env.NODE === 'development' ) {
  bundleConfig.hot = false;
}

var server = new WebpackDevServer(webpack(webpackConfig), bundleConfig);
server.listen(config.port, config.ip, function() {});