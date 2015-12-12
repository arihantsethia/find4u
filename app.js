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
  ;

var query1 = 'DROP TABLE users';
database.executeQuery(query1, [], function(err, result) {
    if (err) {
      console.log(err);
    }
});

var query = 'CREATE TABLE users (id VARCHAR(20) PRIMARY KEY, level INT(6) DEFAULT 0, lives INT(6) DEFAULT 0, hint INT(6) DEFAULT 0, blocked INT(6) DEFAULT 0, time INT(20) DEFAULT 0)'
database.executeQuery(query, [], function(err, result) {
    if (err) {
      console.log(err);
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