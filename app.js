var express = require('express');
var app = express();
var mongoose = require('mongoose');
var id = mongoose.Types.ObjectId();
var configDB = require('./config/db.js');
mongoose.Promise = global.Promise;
mongoose.connect(configDB.url); // connect to our database
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var stem = require('stem-porter');
var bodyParser = require('body-parser')
var Tokenizer = require('tokenize-text');
var tokenize = new Tokenizer();
var _ = require("underscore");
var stoplist = require('stopwords').english;
var async = require("async");
var app = express();

//***************************************************
//MODEL
var docSchema = require("./schemas/doc.js").docSchema; 
var Doc = mongoose.model('doc', docSchema, 'doc');

var indexTableSchema = require("./schemas/indexTable.js").indexTableSchema; 
var Index = mongoose.model('index', indexTableSchema, 'index');
//***************************************************



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // support json encoded bodies

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/panel', function(req, res){
  res.sendFile(path.join(__dirname, 'views/panel.html'));
});

app.get('/help', function(req, res){
  res.sendFile(path.join(__dirname, 'views/help.html'));
});

app.get('/stats', function(req, res){
	fs.readdir('source', function(err, files){
		if (err) {
        	throw err;
    	}
    	Doc.find({}, function(err, documents){
    		Index.count({}, function(err, indexCount){
    			Index.distinct('term').exec(function (err, terms) {
					res.setHeader('Content-Type', 'application/json');
			    	res.send(JSON.stringify({ 
			    		numOfFiles: files.length - 1,
			    		numOfDocs: documents.length,
			    		numOfIndex: indexCount,
			    		numOfWords: terms.length,
			    		documents: documents
			    	}, null, 3));
		    	});
		    });
		});
	});
});



//***************************************************
//UPLOAD NEW FILES
app.post('/upload', function(req, res){

	var data = "";
	// create an incoming form object
	var form = new formidable.IncomingForm();

	// specify that we want to allow the user to upload multiple files in a single request
	form.multiples = true;

	// store all uploads in the /source directory
	form.uploadDir = path.join(__dirname, '/source');

	// every time a file has been uploaded successfully,
	// rename it to it's orignal name
	form.on('file', function(field, file) {
		fs.rename(file.path, path.join(form.uploadDir, file.name));
		data+= file.name + ", ";
	});

	// log any errors that occur
	form.on('error', function(err) {
	    console.log('An error has occured: \n' + err);
	});

	// once all the files have been uploaded, send a response to the client
	form.on('end', function() {
		data = data.substring(0, data.length-2);
	    res.end(data);
	});

	// parse the incoming request containing the form data
	form.parse(req);

});
//***************************************************






//***************************************************
//INDEX SOURCE FOLDER CONTENT
app.post('/index', function(req, res){
	// read each file from source folder, assign new docID and save general data about each doc and create temp index table
	var tempIndexArray = [];
	var resData = "";
	fs.readdir('source/', function(err, files) {
    if (err) {
      onError(err);
      return;
    }
    if(files[0] == '.DS_Store'){
    	files.splice(0,1);
    }

	async.waterfall([
	    function(callback) {
	    	var filesProcessed = 0;
	    	var filesLength = files.length;
		    
		    files.forEach(function(files) {

			    fs.readFile('source/' + files, 'utf-8', function(err, content) {
			        if (err) {
			          onError(err);
			          return;
			        }

			        //body
					var body = content.substring(content.lastIndexOf(">")+1);	
					if(body == null){
						body = "undefined";
					}

					
			        //extract general information about the document
			        //author
					var author = content.match(/<author>(.*?)<\/author>/g);
					if(author !== null){
						author = author[0].substring(8,author[0].lastIndexOf("<"));	
					}else{
						author = "undefined";
					}
					
					//title
					var title = content.match(/<title>(.*?)<\/title>/g);
					if(title !== null){
						title = title[0].substring(7,title[0].lastIndexOf("<"));
					}else{
						title = "undefined";
					}

					//summery
					var summery = content.match(/<summery>(.*?)<\/summery>/g);
					if(summery !== null && summery.length > 1){
						summery = summery[0].substring(9,summery[0].lastIndexOf("<"));
					}else{
						summery = body.split(/\s+/).slice(0,50).join(" ");
						summery += "...";
					}	
        

					//save new document information 
					var newDoc = new Doc({
						author: author,
						title: title,
						summery: summery,
						link: 'storage/' + files
					});
					newDoc.save(function(err,doc) {
					  	if (err) throw err;
					  	console.log('Doc '+ doc.id +' saved successfully!');
					  	
					  	var itemsProcessed = 0;
					  	var tokens = tokenize.words()(body);
					  	//tokenize all content and save to temp Index Array with the following item structure: { term: string, docID: string, freq: nubmer }
			        	tokens.forEach(function(item){
			        		console.log(item);
			        		var newItem = {};
			        		newItem.term = item.value;
			        		newItem.docID = doc.id;
			        		tempIndexArray.push(newItem);	
			        		itemsProcessed++;
						    if(itemsProcessed === tokens.length) {
						      	console.log('doc '+ doc.id +' was indexed');
						      	filesProcessed++;
						      	console.log('filesProcessed: ' + filesProcessed);
						      	if(filesProcessed == filesLength){
						      		console.log("all files have been proccesed");
						      		callback();
						      	}
						    }
			        	});
					});
		     	});
		    });
	    },
	    function(callback) {
	    	//normalaize and stem all tokens 
	    	for ( var i = 0; i < tempIndexArray.length; i++ ) {
	    		tempIndexArray[i].term = tempIndexArray[i].term.toLowerCase();
	    		tempIndexArray[i].term = stem(tempIndexArray[i].term);
	    	}

	    	//sort temp index array and remove duplicates
			tempIndexArray.sort(function (a, b) {
			    var aSize = a.term;
			    var bSize = b.term;
			    var aLow = a.docID;
			    var bLow = b.docID;

			    if(aSize == bSize)
			    {
			        return (aLow < bLow) ? -1 : (aLow > bLow) ? 1 : 0;
			    }
			    else
			    {
			        return (aSize < bSize) ? -1 : 1;
			    }
			});

			
			//remove duplicates from sorted array. (leave duplicates only from different documents)
			var indexArray = [], prev = { term: null, docID: null, freq: 0}

			for ( var i = 0; i < tempIndexArray.length; i++ ) {
		        if ( tempIndexArray[i].term !== prev.term || (tempIndexArray[i].term === prev.term &&  tempIndexArray[i].docID !== prev.docID)) {
		            tempIndexArray[i].freq = 1;
		            indexArray.push(tempIndexArray[i]);
		        } else {
		            indexArray[indexArray.length-1].freq++;
		        }
		        prev = tempIndexArray[i];
		    }

		    console.log(indexArray);
		    console.log('LENGTH:' + indexArray.length);

		    //declare a queue with one task: save index to DB
		    var q = async.queue(function (index, taskCallback) {
			    var newIndex = new Index();
			    newIndex.term = index.term;
			    newIndex.docID = index.docID;
			    newIndex.freq = index.freq;
			    newIndex.save(function(err,index) {
				  	if (err) throw err;
				  	taskCallback();
				});
			}, 30);

		    //push tasks to queue: all indexes in indexArray
		    console.log('updating the index table........ please be patient.');
			for ( var i = 0; i < indexArray.length; i++ ) {
				q.push(indexArray[i], function (err) { });
			}
			
			//all index have been added to DB
			q.drain = function() {	
				console.log('Done!');
				callback();
			}

			
			
	    },
	    function(callback) {
	    	//move all files from Source folder to Storage folder
	    	var filesProcessed = 0;
	    	var filesLength = files.length;
	    	fs.readdir('source/', function(err, files) {
	    		if(files[0] == '.DS_Store'){
			    	files.splice(0,1);
			    }
	    		files.forEach(function(files) {
					fs.rename('source/' + files, 'storage/' + files, function (err) {
						if (err) throw err;
						resData += files + ", ";
						filesProcessed++;
					  	if(filesProcessed == filesLength){
					      		console.log("all files have been proccesed");
					      		callback();
					    }
					});
	    		});

	    	});

	    }

	    //finish waterfall
	    ], 	function(err) {
		        if (err) {
					console.log(err);  
		        }
		        resData = resData.substring(0, resData.length-2);
		        var msg = 'Indexing is done\n' + resData;
		        console.log(msg);
		        res.setHeader('Content-Type', 'application/json');
    			res.send(JSON.stringify({ success: msg }, null, 3));
	    	});
  	});
});
//***************************************************



//***************************************************
//GET DOCUMENT
app.param('link', function ( req, res, next, value){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});

app.get('/storage/:link', function(req, res){
  res.sendFile(path.join(__dirname, 'storage/' + req.params.link));
});
//***************************************************





//***************************************************
//SEARCH KEYWORD
app.param('keyword', function ( req, res, next, value){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
});
app.get('/search/:keyword', function(req, res){
	console.log('searching ' + req.params.keyword + '...');
	// var searchResults = [];
	var keyword = req.params.keyword;
	
	//check for brackets
	var matches = keyword.match(/\((.*?)\)/);
	var searchResults = [];
	if (matches) {
		console.log(matches);
	    var submatch = matches[1];
	}

	var query = { term: stem(keyword.toLowerCase()) };
	
	//check for operators
	var or = keyword.indexOf("OR");
	var not = keyword.indexOf("NOT");
	var and = keyword.indexOf("AND");
	
	if(not >= 0){
		searchNOT(keyword,function(result){
			if(result){
				getDocuments(result,function(searchResults){
					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({success: searchResults}, null, 3));
				});
			}else{
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({fail: 'Opps..! We have no results for "' + keyword + '"'}, null, 3));
			}
		});
	}else if(and >= 0){
		searchAND(keyword,function(result){
			if(result){
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({success: result}, null, 3));
			}else{
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({fail: 'Opps..! We have no results for "' + keyword + '"'}, null, 3));
			}
		});
		
	}else{
			
			var q = async.queue(function (keyword, taskCallback) {
				console.log(keyword);
			    if(checkStopList(keyword) == -1){
			    	var query = { term: stem(keyword.toLowerCase()) };
					searchOneWord(keyword,function(results){
						if(results){

							searchResults = searchResults.concat(results);
							taskCallback();
						}else{
							taskCallback();
						}
					});	
				}else{
					taskCallback(keyword + ' is in stoplist, try something else');
				}
			}, 30);
			
			var tokens = keyword.split(" ");
		    //push tasks to queue: find all documents 
			for( var i = 0; i < tokens.length; i++ ) {
				if(tokens[i] !== "OR"){
					q.push(tokens[i], function (err) { });	
				}
				
			}
			
			//all index have been added to DB
			q.drain = function() {	
				if(searchResults.length > 0){
					var uniqueList = _.map(_.groupBy(searchResults,function(doc){
					  return doc.id;
					}),function(grouped){
					  return grouped[0];
					});

					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({success: uniqueList}, null, 3));		
				}else{
					res.send(JSON.stringify({fail: 'Opps..! We have no results for "' + keyword + '"'}, null, 3));	
				}
				
			}
	}
});
//***************************************************




//***************************************************
//Hide documents from search
app.post('/hideDocs', function(req, res) {
    var docArr = req.body.selection;

    Doc.update({_id: {$in: docArr}, delete: false}, {delete:true} , {multi: true}, function(err,docs){
    	if(err) throw err;
    	console.log(docs);
    	res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: "documents are now hidden"}, null, 3));		
    });
    
});
//***************************************************


//***************************************************
//Show hidden documents on search
app.post('/showDocs', function(req, res) {
    var docArr = req.body.selection;

    Doc.update({_id: {$in: docArr}, delete: true}, {delete:false} , {multi: true}, function(err,docs){
    	if(err) throw err;
    	console.log(docs);
    	res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: "documents are now visible"}, null, 3));		
    });
    
});
//***************************************************


var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});



function searchOneWord(keyword,callback){
	var searchResults = [];
	var term = stem(keyword.toLowerCase());

	var joker = keyword.indexOf("*");
	if(joker >= 0){
		keyword = keyword.slice(0, -1);
		term = new RegExp(keyword.toLowerCase(), "i");
	}
	Index.aggregate([
	    {$match: {
	        'term': term
	    }},
	    {$group: {
	        _id: '$docID',
	        term:  { $max: '$term' }, 
	        freq: { $max: '$freq' } 
	    }},
	     {$sort : {"freq": -1}}
	], function(err, indexs) {
	    if(err) throw err;
	    if(indexs.length > 0){

		    var q = async.queue(function (index, taskCallback) {
			    var item = {};
				Doc.findOne({ _id: index._id, delete: false}, function(err,doc){
					if(err){
						throw err;
					}
					if(doc){
						item.id = doc._id;
						item.title = doc.title;
						item.author = doc.author;
						item.date = doc.date;
						item.link = doc.link;
						item.summery = doc.summery;
						item.freq = index.freq;
						searchResults.push(item);	
						taskCallback();
					}else{
						taskCallback();
					}
				});
			}, 30);

		    //push tasks to queue: find all documents 
			for( var i = 0; i < indexs.length; i++ ) {
				q.push(indexs[i], function (err) { });
			}
			
			//all index have been added to DB
			q.drain = function() {	
				callback(searchResults);
			}
		}else{
			callback();
		}
	});
}




function searchAND(keyword,callback){
	var tokens = keyword.split(" ");
	// var query1 = { term: stem(tokens[0].toLowerCase()) };
	// var query2 = { term: stem(tokens[2].toLowerCase()) };

	var word1 = stem(tokens[0].toLowerCase());
	var word2 = stem(tokens[2].toLowerCase());
	searchOneWord(word1,function(results1){
		if(results1){
			searchOneWord(word2,function(results2){
				if(results2){						
					//intersection of 2 arrays
					getIntersectionOfArray(results1,results2,function(res){
						callback(res);	
					});
					
				}else{
					callback();
				}
			});
		}else{
			callback();
		}
	});
}


function searchNOT(keyword,callback){
	var tokens = keyword.split(" ");
	// var query =  {term: {'$eq':stem(tokens[1].toLowerCase()) }};
	var word1 = stem(tokens[1].toLowerCase());
	var word2 = stem(tokens[1].toLowerCase());

		Index.aggregate([
	    {$group: {
	        _id: '$docID',
	        term:  { $max: '$term' }, 
	        freq: { $max: '$freq' } 
	    }}
	], function(err, results1) {
		if(results1){
			searchOneWord(word2,function(results2){
				if(results2){						
					//difference of 2 arrays
					arr_diff(results1,results2,function(res){
						callback(res);		
					});
					
				}else{
					callback();
				}
			});
		}else{
			callback();
		}
	});

}
function getDocuments(array,callback){
	var searchResults = [];
	//queue
	var q = async.queue(function (index, taskCallback) {
	    var item = {};
		Doc.findOne({ _id: index._id, delete: false}, function(err,doc){
			if(err){
				throw err;
			}
			if(doc){
				item.title = doc.title;
				item.author = doc.author;
				item.date = doc.date;
				item.link = doc.link;
				item.summery = doc.summery
				item.freq = index.freq;
				searchResults.push(item);	
				taskCallback();
			}else{
				taskCallback();
			}
		});
	}, 30);
	//end of queue


    //push tasks to queue: find all documents 
	for( var i = 0; i < array.length; i++ ) {
		q.push(array[i], function (err) { });
		
	}
	
	//all index have been added to DB
	q.drain = function() {	
		callback(searchResults);
	}
}

function checkStopList(keyword){
	keyword = stem(keyword).toLowerCase();
	return stoplist.indexOf(keyword);
}


function getIntersectionOfArray(array1,array2,callback){
    var res = []
    var len1 = array1.length; 
    var len2 = array2.length; 
    var proccesed = 0;
    if(len1 == 0 || len2 == 0){
    	//no results
    	callback();
    }
    for (var i = 0; i < len1; i++) {
	  	for (var j = 0; j < len2; j++) {
		  	if(array1[i].id.toString() === array2[j].id.toString()){
	            res.push(array1[i]);
	        }
	    	proccesed++;
		    if(proccesed == len1*len2){
		    	console.log("intersection finished");
	    		callback(res);
	    	}
	  	}
	}

}


function arr_diff(array1, array2,callback) {
    var res = [];
    for(var i = 0; i<array1.length; i++){
    	res.push(array1[i]);
    }
    var len1 = array1.length; 
    var len2 = array2.length; 
    var proccesed = 0;
    if(len2 == 0){
    	callback(array1);
    }
    for (var i = 0; i < len1; i++) {
	  	for (var j = 0; j < len2; j++) {
		  	if(array1[i]._id.toString() === array2[j].id.toString()){
		  		console.log("match" + array1[i]._id.toString());
	            	for(var k = 0; k < res.length; k++) {
					    if(res[k]._id.toString() === array1[i]._id.toString()) {
					        res.splice(k, 1);
					        break;
					    }
					}
	        }
	    	proccesed++;
		    if(proccesed == len1*len2){
		    	console.log("diff finished");
	    		callback(res);
	    	}
	  	}
	}
};

