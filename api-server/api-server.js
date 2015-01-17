var express = require('express'),
  cors = require('cors'),
  app = express(),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  api = require('./api'),
  port = 8081,
  ip = '10.132.126.219',
  // port = process.env.PORT || 3000,
  server = null;

mongoose.connect('mongodb://wally:Wvvd8jCsW8NxXD@ds053380.mongolab.com:53380/wall');

app
  .use(cors())
  .use(bodyParser.urlencoded({ extended : true }))
  .use(bodyParser.json())
  .use('/api', api);

server = app.listen(port, ip, function() {
  console.log('Listening on port %d', server.address().port);
});