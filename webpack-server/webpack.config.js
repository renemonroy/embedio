var config = require('./config');

var path = require('path'),
  webpack = require('webpack'),
  devServer = config.ip + ':' + config.port;
  // devServer = '127.0.0.1:8081';
  // devServer = 'http://10.132.126.219:8081';

var escapeRegExpString = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var pathToRegExp = function(p) {
  return new RegExp("^" + escapeRegExpString(p));
};

var getEntry = function(type) {
  var entry = {
    "vendor" : ['./helpers/log.js', 'react/addons', 'reflux', 'react-draggable'],
    "app" : ['./app/app.jsx']
  };
  if ( type === 'development' ) {
    for ( var bundleName in entry ) {
      entry[bundleName].push("webpack/hot/dev-server");
    }
  }
  console.log('>>>>> Entry', entry);
  return entry;
};

var getPlugins = function(type) {
  var arr = [];
  arr.push(new webpack.HotModuleReplacementPlugin());
  arr.push(new webpack.optimize.DedupePlugin());
  arr.push(new webpack.optimize.OccurenceOrderPlugin());
  if ( type === 'production') {
    arr.push(new webpack.optimize.UglifyJsPlugin({ output : { comments : false } }));
  }
  arr.push(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 20 }));
  arr.push(new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js", Infinity));
  return arr;
  // [
  // new webpack.optimize.DedupePlugin(),
  // new webpack.optimize.OccurenceOrderPlugin(),
  // // new webpack.optimize.UglifyJsPlugin({ output : { comments : false } }),
  // new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 20 }),
  // // new webpack.optimize.CommonsChunkPlugin("commons", "commons.bundle.js", Infinity),
  // new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js", Infinity)
  // ]
};

module.exports = function(type) {
  return {

    context : __dirname,

    entry : getEntry(type),

    output : {
      path : path.join(__dirname, "assets"),
      publicPath : devServer + '/assets/',
      filename : '[name].bundle.js',
      chunkFilename : '[hash]/js/[id].bundle.js'
    },

    module : {
      loaders : [
        { test: /\.scss$/, loader: 'style!css!sass' },
        { test: /\.jsx$/, loader : 'jsx-loader' }
      ],
      preloaders : [
        {
          test : /\.js$/,
          include : pathToRegExp(path.join(__dirname, "app")),
          loader : 'jshint-loader'
        }
      ]
    },

    resolve : {
      extensions : ['', '.js', '.jsx', '.css', '.scss'],
      modulesDirectories : ['node_modules']
    },

    plugins : getPlugins(type)
  };
};