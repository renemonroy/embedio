var express = require('express'),
  logger = require('morgan'),
  config = require('../config.json');

var info = {
  env : process.env.NODE_ENV,
  ctx : 'http://' + config.ip + ':' + config.port
};

module.exports = ( function() {

  var webRouter = express.Router();

  webRouter.use(logger('short'));

  webRouter.route('/embeds').get( function(req, res) {
    res.render('index', { info : JSON.stringify(info) });
  });

  return webRouter;

})();