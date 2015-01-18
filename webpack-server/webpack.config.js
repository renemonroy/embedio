var path = require('path'),
  webpack = require('webpack'),
  devServer = 'http://10.132.126.219:8081';

var escapeRegExpString = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var pathToRegExp = function(p) {
  return new RegExp("^" + escapeRegExpString(p));
};

function getEntry(type) {
  var entry = {
    "vendor" : ['react/addons', 'reflux'],
    "app" : ['./app/app.jsx']
  };
  if ( type === 'dev' ) {
    for ( var bundleName in entry ) {
      entry[bundleName].push("webpack/hot/dev-server");
    }
  }
  return entry;
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

    plugins : [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    // new webpack.optimize.UglifyJsPlugin({ output : { comments : false } }),
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 20 }),
    // new webpack.optimize.CommonsChunkPlugin("commons", "commons.bundle.js", Infinity),
    new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js", Infinity)
    ]
  };
};