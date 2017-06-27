var fs = require('fs');
var util = require('util');
var mongodb = require('mongodb');

var MongoClient = require('mongodb').MongoClient;
assert = require('assert');

// Connection url
var url = 'mongodb://localhost:27017/BlackHawk';

// Inserts many documents
var insertDocuments = function(info, db, callback) {
    // Get documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insertMany([
            //{a: 1}, {a: 2}, {a: 3}
            info
    ], function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        assert.equal(1, result.ops.length);
        console.log("Inserted 1 documents into the collection");
        callback(result);
    });
}

/* Select all rows */
var findDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs);
        callback(docs);
    });
}

/* Select specific rows */
var filterDocuments = function(condition, db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Find some documents
    collection.find(condition).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log(docs);
        callback(docs);
    });
}

/* Update a row with some new data */
var updateDocument = function(info, key, db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Update document where id is filename
    collection.updateOne( { _id : key},
            { $set: info }, function(err, result) {
                assert.equal(err, null);
                assert.equal(1, result.result.n);
                callback(result)
            });
};

/* Delete one thing */
var removeDocument = function(item, db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Delete some documents
    collection.deleteOne({ _id : item  }, function(err, result) {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        console.log("Removed the document with the field _id equal to " + item);
        callback(result);
    });
};

/* Delete everything */
var clearDocument = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Delete some documents
    collection.remove({}, function(err, result) {
        assert.equal(err, null);
        callback(result);
    });
};

/* Indexing - currently unused; implement when scaling is needed */
var indexCollection = function(db, callback) {
    db.collection('documents').createIndex(
            { "a": 1 },
            null,
            function(err, results) {
                console.log(results);
                callback();
            });
};

/* Wrapper function to insert data externally */
var insert = function(first, last, phone, email) {
    console.log(first);
    var info = { 'first': first,
                'last': last,
                'phone': phone,
                'email': email};
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        insertDocuments(info, db, function() {
            db.close();
        });
    });
};

/* Wrapper function to update data externally */
var update = function(info, key) {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        updateDocument(info, key, db, function() {
            db.close();
        });
    });
} 


var removeOne = function(filename, callback) {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        removeDocument(filename, db, function(result) {
            if(callback) {
                callback('The document has been removed.');
            }
            db.close();
        });
    });
};

/* Wrapper function to get all data externally */
var all = function(callback) {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        findDocuments(db, function(result) {
            db.close();
            if (callback){
                callback(result);
            }
        });
    });
};

var filter = function(condition, callback) {
    MongoClient.connect(url, function(err, db) {
        assert.equal(null, err);
        filterDocuments(condition, db, function(result) {
            db.close();
            if (callback){
                callback(result);
            }
        });
    });
};

var insertBinary = function(buffer, filename, callback) {
    var invoice = {};

    invoice.pdf = new mongodb.Binary(buffer);

    // set an ID for the document for linking and retrieval
    invoice._id = filename;
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log(err);
        }
        db.collection('documents').insert(invoice, function(err, doc) {
            console.log("Inserting image/pdf file to mongodb");

            db.collection('documents').findOne({_id : filename}, function(err, doc) {
                if (err) {
                    console.error(err);
                }

                if (callback) {
                    callback('Successfully inserted image/pdf to mongodb');
                }
                // write out file retrieved to check for successful retrieval
                /*fs.writeFile('testout.pdf', doc.pdf.buffer, function(err) {
                    if (err) {
                        throw err;
                    }
                    console.log('Successfully saved');
                });*/
                db.close();
            });
        });
    });
};

var sendFile = function(filename, callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log(err);
        }
        db.collection('documents').findOne({_id : filename}, function(err, doc) {
            if (err) {
                console.log(err);
            }
            if (callback) {
                callback(doc.pdf.buffer);
            }
            db.close();
        })
    })
};


exports.insert = insert;
exports.all = all;
exports.insertBinary = insertBinary;
exports.filter = filter;
exports.update = update;
exports.removeOne = removeOne;
exports.sendFile = sendFile;