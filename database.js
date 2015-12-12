var mysql = require('mysql');
var pool = mysql.createPool({
      connectionLimit : 100, //important
      host     : 'localhost',
      user     : 'root',
      password : 'root',
      database : 'test',
      debug    :  false
  });
module.exports = {

  executeQuery : function(query, params, fn) {
    pool.getConnection(function(err, connection) {
          if (err) {
            console.log(err);
            if (!connection) {
              fn(err);
              return;
            } 
            connection.release();
            fn(err);
            return;
          }
          connection.query(query, params, function(err, results) {
              connection.release();
              if(err) {
                  fn(err);
                  return;
              } else {
                fn(null, results);
              }            
          });

          connection.on('error', function(err) {      
                fn(err);
                return;     
          });
    });
  },

  getUser : function(email, fn) {
    var query = 'SELECT * from users where email = ?';
    module.exports.executeQuery(query, [email], function(err, result) {
      if (err){
        fn(err);
      } else if (result == []) {
        var error = new Error('User not found');
        fn(error);
      } else {
        fn(null, result);
      }
    });
  },

  insertUser : function(id, fn) {
    var query = 'INSERT into users(id) values(?)';
    module.exports.executeQuery(query, [id], function(err, result) {
      if (err){
        fn(err);
      } else {
        fn(null, result);
      }
    });
  },

  updateUser : function(id, deltalevel, deltahint, deltalives, timestamp, fn) {
    if (deltalevel == 1) {
      var query = 'UPDATE users set level=level+' + deltalevel + ',time=' + timestamp + ',hint=0 where id=?';
      module.exports.executeQuery(query, [id], function(err, result) {
        if (err){
          fn(err);
        } else {
          fn(null, result);
        }
      });
    } else if (deltahint == 1) {
      var query = 'UPDATE users set hint=1 where id=?';
      module.exports.executeQuery(query, [id], function(err, result) {
        if (err){
          fn(err);
        } else {
          fn(null, result);
        }
      });
    } else {
      var query = 'UPDATE users set lives=lives+' + deltalives + ' where id=?';
      module.exports.executeQuery(query, [id], function(err, result) {
        if (err){
          fn(err);
        } else {
          fn(null, result);
        }
      });
    }
  }
}