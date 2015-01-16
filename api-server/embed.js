var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var EmbedSchema = new Schema({
  createdAt : { type : Date, default : Date.now },
  url       : { type : String, required : true },
  image     : { type : String, required : false },
  type      : { type : String, required : true },
  title     : { type : String, required : false },
  html      : { type : String, required : false },
  width     : Number,
  height    : Number,
  author    : {
    name : String,
    url  : String
  },
  provider  : {
    name : { type : String, required : true },
    url  : { type : String, required : true }
  },
  thumb     : {
    url    : { type : String, required : false },
    width  : { type : Number, required : false },
    height : { type : Number, required : false }
  }
});

module.exports = mongoose.model('Embed', EmbedSchema);