var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var indexTableSchema = new Schema({
	term: String,
	docID: String,
	freq: Number
});

exports.indexTableSchema = indexTableSchema; 