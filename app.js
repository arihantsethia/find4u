var express = require('express')
  , fs = require('fs')
  , passport = require('passport')
  , util = require('util')
  , session = require('express-session')
  , bodyParser = require("body-parser")
  , cookieParser = require("cookie-parser")
  , methodOverride = require('method-override')
  , fb = require('fbgraph')
  , cron = require('cron')
  , async =require('async')
  , fs = require('fs')
  , mysql = require('mysql')
  , database = require('./database')
  , exotel = require('exotel-client')
  ;

var drop_unique_code = 'DROP TABLE IF EXISTS unique_codes';
database.executeQuery(drop_unique_code, [], function(err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
});

var drop_users = 'DROP TABLE IF EXISTS users';
database.executeQuery(drop_users, [], function(err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
});

var create_users = 'CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, contact_number INT(10) NOT NULL, email VARCHAR(100) NOT NULL, password VARCHAR(100) NOT NULL)';
var create_unique_code = 'CREATE TABLE unique_codes (u_id INT(8) PRIMARY KEY, user_id INT NOT NULL)';
database.executeQuery(create_users, [], function(err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
});

database.executeQuery(create_unique_code, [], function(err, result) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
});

var app = express();
// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.use(logger());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(session({ secret: 'anything' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

exotel.init("amazon8", "81525dceb2457dee2d5e4a778f29fa45d8f19811");


app.use(function(req, res, next){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
  var err = req.session.error                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
    , msg = req.session.success;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
  delete req.session.error;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  delete req.session.success;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
  res.locals.message = '';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
  next();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
});     

app.get('/', function(req, res){
  console.log(req.session.user);
  if (req.session.user) {
    database.getUser(req.session.user.id, function(err, result1) {
      if (err) {
        console.log(err);
        res.render('error');
      } else if (result1.length == 0) {
        database.insertUser(req.session.user.id, function(err, result2) {
          if (err) {
            res.render('error');
          } else {
            console.log('Result 2');
            console.log(result2);
            res.render('index2', { user: req.session.user, lives: 0});
          }
        });
      } else {
        console.log('Result 1');
        console.log(result1);
        res.render('index2', { user: req.session.user, lives: result1.lives});
      }
    });
  } else {
    res.render('index2', { user: req.user, lives: req.lives});
  }
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  if (auth_dict[req.body.user] == req.body.pass) {
    req.session.regenerate(function(){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
      // Store the user's primary key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
      // in the session store to be retrieved,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
      // or in this case the entire user object                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
      req.session.user = {};
      req.session.user.id = req.body.user;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
      res.redirect('/');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
    });   
  } else {
    req.session.error = 'Authentication failed, please check your '                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
      + ' username and password.'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
      + ' (use "tj" and "foobar")';                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
    res.redirect('/login');  
  }
});

app.get('/found', function(req, res){
    unique_id = req.query["digits"];
    contact_number_from = req.query["From"];
    var query = 'Select * from unique_codes where u_id = ' + unique_id; 
    database.executeQuery(query, [], function(err, result) {
        if (err) {
            res.status(302);
        }else {
            console.log(result);
            sendMessageToUser(contact_number_to, getItemFoundMessage(unique_id, contact_number_from));
            res.status(200);
        }
        res.send();
    });
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    res.redirect('/');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  });
});


app.listen(3000);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

function getNewUniqueId(cb){
        var unique_id = Math.floor(Math.random() * 900000000) + 100000000;
        var query = 'Select count(*) from unique_codes where u_id = ' + unique_id; 
        database.executeQuery(query, [], function(err, result) {
            if (err) {
                cb(err);
            }else {
                if(result[0]['count(*)'] == 0){
                    cb(null, unique_id);
                    return;
                } else {
                    getNewUniqueId(cb);
                }
            }
        });
}

function getItemFoundMessage(tag, finder) {
    var body = "An item has been reported found for Tag : " + tag + ". Please contact : " + finder + " to get more information about the lost item.";
    return body;
}

function sendMessageToUser(to, body){
    exotel.send_sms("08039511720", to, body);
}

function sendMailToUser(to, body){
   // var body = "An item has been reported found for Tag : " + tag + ". Please contact : " + from + " to get more information about the lost item.";
//    exotel.send_sms("08039511720", to, body);
}