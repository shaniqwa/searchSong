var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var docSchema = new Schema({
    author : String,
    title : String,
    date: { type: Date, default: Date.now },
    summery : String,
    link: String,
    delete: { type: Boolean, default: false }
});

exports.docSchema = docSchema; 