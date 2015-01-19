var express = require('express'),
  logger = require('morgan'),
  config = require('../config.json');

var ctx = function() {
  myCtx = '';
  switch (process.env.NODE_ENV) {
    case 'development' :
      myCtx = 'http://localhost:3000';
      break;
    case 'production' :
      myCtx = 'http://rene.mn';
      break;
  }
  return myCtx;
};

var info = {
  env : process.env.NODE_ENV,
  ctx : ctx()
};

module.exports = ( function() {

  var webRouter = express.Router();

  webRouter.use(logger('short'));

  webRouter.route('/embeds').get( function(req, res) {
    res.render('index', { info : JSON.stringify(info) });
  });

  return webRouter;

})();