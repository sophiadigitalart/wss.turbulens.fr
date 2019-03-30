'use strict';

let Promise = global.Promise || require('promise');
// let nodemon = require('nodemon');
let winston = require('winston');
//let http = require('http');
// let server = http.createServer();
let wss = require('./src/ws.js');

/* wss */
let https = require('https');
let fs = require('fs');

let pcert = fs.readFileSync('/home/sophiadi/ssl/certs/wss_sophiadigitalart_com_bb5ae_a666d_1559381409_1dea7cd477fb7e6006debe91e9900f01.crt');
let pkey = fs.readFileSync('/home/sophiadi/ssl/keys/bb5ae_a666d_6063c3e34dc285b8ef2b0a4d2e7de851.key');
let options = {key: pkey, cert: pcert};
let server = null;

function setUpLogger() {
  winston.configure({
    transports: [
      new (winston.transports.Console)({ colorize: true })/*,
            new (winston.transports.File)({ filename: 'netdromm.log' })*/
    ]
  });
  return Promise.resolve();
}

function initHttpServer() {
  return new Promise(function( resolve, reject ){
    
    if (!pcert || !pkey) reject('Check certs');
    server = https.createServer({cert: pcert , key: pkey });
       
    server.listen( function(err) {
      if (err) return reject(err);
      winston.info('Application server running!' + process.env.port);
      return resolve( server );
    });
  });
}

function initWsServer( httpListener ) {
  winston.info('initWsServer, node version ' + process.versions.node);
  return wss(httpListener, winston);
}

function listenProcessSignals(httpListener) {
  return Promise
    .resolve()
    .then(function(){
      process.on('SIGTERM', function () {
        process.exit(0);
      });
      process.on('uncaughtexception', function (err) {
        console.log(err);
        process.exit(0);
      });
      process.on('SIGINT', function () {
        process.exit(0);
      });
    });
}

function handleError( err ){
  winston.error(err);
  process.exit(1);
}

setUpLogger()
  .then(initHttpServer)
  .then(initWsServer)
  .then(listenProcessSignals)
  .catch(handleError);

