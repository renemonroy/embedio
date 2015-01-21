var express = require('express'),
  logger = require('morgan'),
  Embed = require('../models/embed'),
  oembed = require('oembed-auto');

var setEmbedSize = function(embedHTML, embedWidth, embedHeight) {
  return embedHTML.replace(/(width=")\d+("\W+height=")\d+/, '$1' + embedWidth + '$2' + embedHeight);
};

module.exports = ( function() {

  var api = express.Router();

  api.use(logger('short'));

  /**
  * Main API route that responds with an empty object as JSON, this by
  * following RESTful "best practices".
  */
  api.route('/').get( function(req, res) {
    res.json({});
  });

  /**
  * Responds with an array list of all the embeds saved on the database.
  */
  api.route('/embeds').get( function(req, res) {
    Embed.find({}).limit(3).sort('-createdAt').exec(function(err, embeds) {
      if (err) res.send(err);
      res.json({ embeds : embeds });
    });
  });

  /**
  * Saves a new embed into the database and responds with a message as
  * notification for front.
  */
  api.route('/embeds').post( function(req, res) {
    Embed.findOne({ url : req.body.url }, function(findError, embedFound) {
      if (findError) res.send(findError);
      if ( embedFound ) {
        res.json({ status : 'fail', message : 'You had this Embed already.' });
      } else {
        oembed(req.body.url, function(oembedError, d) {
          if (oembedError) res.send(oembedError);
          var e = new Embed();
          e.url           = req.body.url;
          e.createdAt     = new Date();
          e.image         = d.url ? d.url : '';
          e.type          = d.type;
          e.title         = d.title ? d.title : '';
          e.width         = d.width ? d.width : '100%';
          e.height        = d.height ? d.height : '100%';
          e.html          = d.html ? responsiveEmbed(d.html, e.width, e.height) : '';
          e.author.name   = d.author_name ? d.author_name : '';
          e.author.url    = d.author_url ? d.author_url : '';
          e.provider.name = d.provider_name;
          e.provider.url  = d.provider_url;
          e.thumb.url     = d.thumbnail_url ? d.thumbnail_url: '';
          e.thumb.width   = d.thumbnail_width ? d.thumbnail_width : 0;
          e.thumb.height  = d.thumbnail_height ? d.thumbnail_height : 0;
          e.save(function(saveError) {
            if (saveError) res.send(saveError);
            console.log('>>> Embed created:', e);
            res.json({ status : 'success', message : 'Embed created!', embed : e });
          });
        });
      }
    });
  });

  /**
  * Responds an embed found from its specific id added by the post on
  * the database.
  */
  api.route('/embeds/:embed_id').get( function(req, res) {
    Embed.findById(req.params.embed_id, function(err, e) {
      if (err) res.send(err);
      res.json(e);
    });
  });

  /**
  * Deletes an embed from the database found using its specific id.
  */
  api.route('/embeds/:embed_id').delete( function(req, res) {
    Embed.remove({ _id : req.params.embed_id }, function(err) {
      if (err) res.send(err);
      res.json({ status : 'success', message : 'Embed deleted!', embedId : req.params.embed_id });
    });
  });

  return api;

})();