var express = require('express'),
  cors = require('cors'),
  app = express(),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  webRouter = require('./routes/web'),
  api = require('./routes/api'),
  proxy = require('proxy-middleware'),
  url = require('url'),
  port = 8080,
  ip = '10.132.126.219';

mongoose.connect('mongodb://wally:Wvvd8jCsW8NxXD@ds053380.mongolab.com:53380/wall');

app
  .set('view engine', 'ejs');

app
  .use(cors())
  .use(bodyParser.urlencoded({ extended : true }))
  .use(bodyParser.json())
  .use(express.static('public'))
  .use('/assets', proxy(url.parse('http://127.0.0.1:8080/assets')))
  .use('/', webRouter)
  .use('/api', api);

app
  .listen(port, ip, function() {
    console.log('Server started at ' + ip + ' on port ' + port + '...');
  });