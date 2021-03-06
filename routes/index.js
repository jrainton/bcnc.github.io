var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');
var mime = require('mime');

// import query file(s)
var queries = require('./queries');
var eventqueries = require('./eventqueries');

/* GET home page. */
router.get('/', function(req, res, next) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    }

    if(mm<10) {
        mm = '0'+mm
    }

    today = yyyy + '/' + mm + '/' + dd;
    console.log("TODAY IS: " + today);

    // only display the upcoming events
    var condition = {date: { $gte: today }};

    eventqueries.filter(condition, function(results){
        res.render('index', {
            title: 'Home',
            events: results
        });
    });

});

/* Render thank you page */
router.get('/thankyou', function(req, res, next) {
  res.render('thankyou', { title: 'Thank you!' })
});

/* GET BCNC about page */
router.get('/about', function(req, res, next) {
    res.render('about', { title: 'About' });
});

/* GET BCNC contact page */
router.get('/contact', function(req, res, next) {
    res.render('contact', { title: 'Contact' });
});

/* GET BCNC 404 error page */
router.get('/404', function(req, res, next) {
   res.render('404', {title: '404 Error'});
});

/* GET BCNC eventsuccess page */
router.get('/eventsuccess', function(req, res, next) {
    res.render('eventsuccess', {title: 'Event Success'});
});


/* GET BCNC FAQ page */
router.get('/faq', function(req, res, next) {
    res.render('faq', { title: 'FAQ' });
});

/* GET BCNC our-team page */
router.get('/our-team', function(req, res, next) {
    res.render('our-team', { title: 'Our Team' });
});

/* GET BCNC partners page */
router.get('/partners', function(req, res, next) {
    res.render('partners', { title: 'Partners' });
});

router.get('/resume', function(req, res, next) {
    queries.sendFile(req['query']['filename'], function(pdfData) {
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
        });
        res.end(pdfData, 'binary');

    });
    //res.writeHead(200, {
    //      'Content-Type': 'application/pdf',
    //        'Content-Disposition': 'attachment; filename=some_file.pdf',
    //          'Content-Length': data.length

    //});
    //res.end(pdfData);
});

router.post('/findOfficer', function(req, res, next) {

    console.log("Checking to see if " + req.body['email'] + " is an officer");
    var condition = {email: req.body['email']};

    // finds a specific officer
    queries.filterOfficer(condition, req.body['email'], function(callback) {
        if(callback.length > 0) {
            console.log("Officer " + req.body['email'] + " is an officer logged in")
            res.end(req.body['email'])
        } else {
            console.log("Current logged in user " + req.body['email'] + " is not an officer!")
            res.end("no")
        }
    })
});

router.post('/removeEvent', function(req, res, next) {

    console.log("Removing event...");

    // delete a specific event
    eventqueries.removeOneEvent(req.body['id'], function(callback) {
        res.end(callback)
    });

});

router.post('/deliberate', function(req, res, next) {

    console.log("Deliberating...");
    var condition = {_id: req.body['id']};
    var applicant_id = req.body['id'];
    var email = req.body['userEmail'];

    //
    queries.filterVoter(applicant_id, email, function(callback) {

        console.log("Found " + callback.length + " documents with condition: " + JSON.stringify(condition));

        // if the current officer did not vote already
        if(!(callback.length > 0)) {
            console.log("Adding voter's decision...");

            // if the user voted "Accept"
            if (req.body['accept'] == 1) {

                queries.filter(condition, function (results) {
                    var currentAccept = results[0]['accept'];

                    var info = {
                        'accept': currentAccept + 1,
                        'status': 1
                    };

                    // voter information
                    var vote = {
                        'voter': email,
                        'decision': 1
                    };

                    queries.update(info, vote, req.body['id']);
                    var net = parseInt(results[0]['accept']) - parseInt(results[0]['reject']) + 1;
                    res.end(net.toString());
                });
            }

            // if the user voeted "Reject"
            else if (req.body['accept'] == 2) {
                queries.filter(condition, function (results) {
                    var currentReject = results[0]['reject'];

                    var info = {
                        'reject': currentReject + 1,
                        'status': 1
                    };

                    var vote = {
                        'voter': email,
                        'decision': 2
                    };

                    queries.update(info, vote, req.body['id']);
                    var net = parseInt(results[0]['accept']) - parseInt(results[0]['reject']) - 1;
                    res.end(net.toString());
                });
            }
            else {
                var info = {
                    'status': 0
                };
                queries.update(info, "", req.body['id']);
                res.end('Reset');
            }
        }

        // else the current officer already voted, so update their vote
        else {
            console.log("Looks like you voted for this person already...");
            var currentVotes = callback[0]['votes'];

            // find the index for the voter we need to update
            var i = 0;
            for(; i < currentVotes.length; i++) {
                if(currentVotes[i] && currentVotes[i]['voter'] == email) {
                    break;
                }
            }

            console.log("Current state: " + email + " voted " + currentVotes[i]['decision']);
            console.log("New state " + email + " votes " + req.body['accept']);

            // if we are going from deny to accept
            if(currentVotes[i]['decision'] == 2 && req.body['accept'] == 1) {

                console.log("Switching vote from reject to approve");
                var currentReject = callback[0]['reject'];
                var currentAccept = callback[0]['accept'];
                currentVotes[i]['decision'] = 1;
                var info = {
                    'reject': currentReject - 1,
                    'accept': currentAccept + 1,
                    'votes': currentVotes
                };

                queries.update(info, "", req.body['id']);

                var net = parseInt(callback[0]['accept']) - parseInt(callback[0]['reject']) + 2;
                res.end(net.toString());

                // if we are going from accept to deny
            } else if (currentVotes[i]['decision'] == 1 && req.body['accept'] == 2) {

                console.log("Switching vote from accept to reject");
                var currentReject = callback[0]['reject'];
                var currentAccept = callback[0]['accept'];
                currentVotes[i]['decision'] = 2;
                var info = {
                    'reject': currentReject + 1,
                    'accept': currentAccept - 1,
                    'votes': currentVotes
                };
                queries.update(info, "", req.body['id']);
                var net = parseInt(callback[0]['accept']) - parseInt(callback[0]['reject']) - 2;
                res.end(net.toString());

            } else { // officer has voted for the same thing, do nothing!
                console.log("Looks like you're voting for the same thing!");
                var net = parseInt(callback[0]['accept']) - parseInt(callback[0]['reject']) - 1;
                res.end(net.toString());

            }
        }
    });

    // status: 0 = haven't looked
    // status: 1 = accept
    // status: 2 = reject
    
    //res.end('Updated status');
});

/* Render form */
router.get('/form', function(req, res, next) {
  res.render('form', { title: 'Form' });
});

/* Render login button */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Testing out button' });
});

/* Render form */
router.get('/nottypeform', function(req, res, next) {
  res.render('nottypeform', { title: 'Not Type Form' });
});

/* Render event form */
router.get('/event', function(req, res, next){
    res.render('event', { title: 'Events' });
});

/* Render table; pass mongodb results */
router.get('/table', function(req, res, next) {

    var condition = {first: { $exists: true }};
    queries.filter(condition, function(results){
	    res.render('table', {
            title: 'Applicants',
            people: results
        });
    });

});

// use multer for multipart uploads - save to file
/*var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './uploads');
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname + '_db_' + Date.now() + '.' + mime.extension(file.mimetype));
    }
});*/

router.get('/eventmanager', function(req, res, next) {

    eventqueries.allEvents(function(results){

        // render the page with the events database
        res.render('eventmanager', {
            title: 'Event Manager',
            events: results
        });
    });
});

router.get('/jayofficers', function(req, res, next) {

    queries.allOfficers(function(results){

        // render the page with the events database
        res.render('jayofficers', {
            title: 'Officer List',
            officers: results
        });
    });
});

var storage = multer.memoryStorage();
var upload = multer({storage: storage}).single('file');

/* For uploading files */
router.post('/upload', function(req, res) {
    upload(req, res, function(err) {
        if (err){
            console.log(err);
            return res.end("Error uploading file");
        }
        // file has been uploaded to memory; 
        // generate filename
        var filename = req.file.originalname + '_db_' + Date.now() + '.' + mime.extension(req.file.mimetype);
        // save to mongodb
        queries.insertBinary(req.file.buffer, filename, function(result) {
            console.log('sending back result: ' + result);
            // send back the filename
            res.end(filename);
        });
    });
});

/* For removing uploaded files */
router.post('/remove', function(req, res) {
   // console.log("Server has received remove file data");
    queries.removeOne(req.body['filename'], function(result) {
        res.end(result);
    });
});

/* For saving form data */
router.post('/submit', function(req, res) {
    //console.log("Server has received submit data");

    var position = JSON.parse(req.body.position);
    var applicant = req.body.email;
    var condition = {email: applicant};

    //console.log("Referred by: " + req.body.refer);

    var info = {
        'first': req.body.firstname,
        'last': req.body.lastname,
        'phone': req.body.telephone,
        'email': req.body.email,
        'year': req.body.year,
        'major': req.body.major,
        'position': position,
        'q1': req.body.q1,
        'q2': req.body.q2,
        'refer': req.body.refer,
        'school': req.body.school,
        'status': 0,
        'accept': 0,
        'reject': 0,
        'votes': []
    };

   // console.log("Here!");
    queries.filter(condition, function(callback) {

        // if the applicant applied already, update their application
        if ((callback.length > 0)) {
            console.log("Updating applicant information..");
            queries.removeOne(callback[0]['_id']);
            queries.update(info, "", req.body.filename);

        // else, we have never seen this applicant before
        } else {
            console.log("Adding new applicant..");
            queries.update(info, "", req.body.filename);
        }
    });

   // console.log('Insert file with filename: ' + req.body.filename + ' into mongodb from /uploads');
    queries.all();
    res.end("Submit data has been entered in database");
});

/* For saving form data */
router.post('/eventsubmit', function(req, res) {

    console.log("Server has received event data");

    console.log("Event time format: " + req.body.date);

    var info = {
        'eventname': req.body.eventname,
        'link': req.body.link,
        'date': req.body.date,
        'time': req.body.time,
        'org': req.body.org,
        'eventdescription': req.body.eventdescription
    };

    eventqueries.insertEvent(info);
    eventqueries.allEvents();
    res.end("Submit data has been entered in database");
});

// Export to make this externally visible
module.exports = router;
