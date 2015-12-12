var querystring = require('querystring');
var request = require('request');

request({
    headers: {
      'Content-Length': contentLength,
      'Content-Type': 'application/json',
      'X-APP-TOKEN': '56d83f946ab44160a0ce8f52147221ca'
    },
    uri: 'http://sandbox-­t.olacabs.com/v1/products?pickup_lat=12.9491416&pickup_lng=77.64298',
    method: 'GET'
  }, function (err, res, body) {
    //it works!
    console.log(res);
    console.log(err);
  });