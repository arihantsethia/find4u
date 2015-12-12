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

var create_users = 'CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, contact_number INT(10) NOT NULL, email VARCHAR(100) NOT NULL UNIQUE, password VARCHAR(100) NOT NULL)';
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
    database.getUser(req.session.user.email, function(err, result1) {
      if (err) {
        console.log(err);
        res.render('error');
      } else if (result1.length == 0) {
        
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

app.get('/register', function(req, res){
  res.render('register');
});

app.get('/found', function(req, res){
    getNewUniqueId();
    unique_id = req.query["digits"];
    contact_number = req.query["From"];
    var query = 'Select * from unique_codes where u_id = ' + unique_id; 
    database.executeQuery(query, [], function(err, result) {
        if (err) {
            res.status(302);
        }else {
            console.log(result);
        }
        res.send();
    });
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
    res.redirect('/');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
  });
});

app.post('/submit', function(req, res){
  var email = req.body.email;
  var password = req.body.pass;
  database.getUser(email, function(err, result) {
    if (err) {
      console.log('error');
      console.log(err);
    } else {
      console.log('dsadsa');
      var user = result[0];
      console.log(result);
      req.session.user = [];
      req.session.user.email = email;
      res.redirect('/');
    }
  });
});

app.post('/register', function(req, res){
  var user = req.body.user;
  var email = req.body.email;
  var password = req.body.pass;
  var number = parseInt(req.body.number);
  console.log(user);
  console.log(email);
  console.log(password);
  console.log(number);
  console.log(typeof(number));
  database.insertUser(user, email, number, password, function(err, result) {
    if (err) {
      console.log('error');
      console.log(err);
    } else {
      console.log('dsadsa');
      console.log(result);
      req.session.user = {};
      req.session.user.email = email;
      res.redirect('/');
    }
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

function getNewUniqueId(){
    //while(1){
        console.log("Trying to get new id");
        var unique_id = Math.floor(Math.random() * 900000000) + 100000000;
        var query = 'Select count(*) from unique_codes where u_id = ' + unique_id; 
        database.executeQuery(query, [], function(err, result) {
            if (err) {
                console.log(err);
            }else {
                console.log(result);
            }
        });
    //}
}