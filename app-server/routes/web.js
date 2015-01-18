var express = require('express'),
  logger = require('morgan');

module.exports = ( function() {

  var webRouter = express.Router();

  webRouter.use(logger('short'));

  webRouter.route('/embeds').get( function(req, res) {
    res.render('index');
  });

  return webRouter;

})();