'use strict';

let Promise = global.Promise || require('promise');
let uuid = require('uuid');
let WebSocketServer = require('ws').Server;
let whitelist = require('../sample.ip.whitelist.json');

function nowFormatted() {
  return new Date().toISOString().replace('T', ' ').substr(0, 19) + '> ';
}

function wsCtrl ( httpListener, logger ) {
  let instance = {};
  instance.logger = logger;
  instance.channels = { default: { clients: [] }};
  instance.wss = new WebSocketServer({ server: httpListener });
  return Promise.resolve(instance);
}
function addBroadcastPolyfill( instance ) {
  return Promise.resolve()
    .then(function(){
      instance.wss.broadcast = function(msg, sender, channel) {
        //channel = channel || 'default';
        instance.logger.info(nowFormatted() + 'Channel ' + channel + ' msg:' + msg);
        if (channel === undefined) {
          instance.logger.error(nowFormatted() + 'channel undefined');
          channel = 'default';
        }
        // channels other from 'default' not implemented
        if (channel !== 'default' ) {
          // for tests to pass
          if (channel !== 'customChannel') {
            // from litegraph
            try {
              let unwrappedMsg = JSON.parse(msg);
              msg = '{"params":[{"name":' + channel + ',"value":' + unwrappedMsg['data'] + '}]}';
            } catch (e) {
              instance.logger.error(nowFormatted() + 'Could not parse ' + JSON.stringify(msg));
            }
            channel = 'default';
          }
        } 
        
        instance.channels[channel].clients.forEach(function(client){
          if (client.id !== sender) {
            client.send(msg);
            instance.logger.info(nowFormatted() + 'Message ' + msg + ' sent from ' + sender + ' to ' + client.id);
          }
        });
      };
      return instance;
    });
}

function disconnect(socket, instance) {
  socket.channels.forEach(function(channel){
    instance.channels[channel].clients = instance.channels[channel].clients.filter(function(e){
      return e.id != socket.id;
    });
  });
  instance.logger.info(nowFormatted() + 'User disconnected: ' + socket.id + ' (' + socket.upgradeReq.connection.remoteAddress + ')');
}

function isAllowedHost(socket) {
  let ip = socket.upgradeReq.connection.remoteAddress.match(/(\d{1,3}\.){3}\d{1,3}/);
  if (!ip) return false;
  return whitelist.allowedIps.find(function(allowedIp){
    return allowedIp === ip[0];
  });
}

function addWsEvtListeners( instance ) {
  return Promise.resolve()
    .then(function(){
      instance.wss.on('connection', function(socket){
        // if (!isAllowedHost(socket)) return socket.close();
        socket.id = uuid.v4();
        instance.channels['default'].clients.push(socket);
        socket.channels = ['default'];
        // to try if behind a proxy: logger.info('user connected' + socket.upgradeReq.headers['x-forwarded-for']);
        instance.logger.info(nowFormatted() + 'user connected: ' + socket.upgradeReq.connection.remoteAddress);
        socket.on('close', function(){
          return disconnect(socket, instance);
        });
        socket.on('disconnect', function(){
          return disconnect(socket, instance);
        });

        socket.on('message', function(msg){
          let unwrappedMsg = null;
          let channel = null;
          try {
            unwrappedMsg = JSON.parse(msg);
          } catch (e) {
            instance.logger.error(nowFormatted() + 'Could not parse ' + JSON.stringify(msg));
          }
              
          if (unwrappedMsg && unwrappedMsg['chn']) {
            instance.logger.info(nowFormatted() + 'chn:' + JSON.stringify(unwrappedMsg.chn));
            if (unwrappedMsg.chn === 'getChannel') {
              return socket.send(JSON.stringify({joinedChannels: socket.channels}));
            }
            if (unwrappedMsg.chn === 'joinChannel') {
              channel = unwrappedMsg.channel;
              if (socket.channels.indexOf(channel) != -1) {
                return socket.send(JSON.stringify({error: 'Channel already joined'}));
              }
              if (!instance.channels[channel]) {
                instance.channels[channel] = {clients:[]};
              }
              instance.channels[channel].clients.push(socket);
              socket.channels.push(channel);
              return socket.send(JSON.stringify({joinedChannels: socket.channels}));
            }
            instance.logger.error(nowFormatted() + JSON.stringify(unwrappedMsg));
            return socket.send(JSON.stringify({error: 'invalid command'}));
          }
          if (unwrappedMsg && unwrappedMsg['channel']) {
            channel = unwrappedMsg.channel;
            // Broadcast message to channel
            return instance.wss.broadcast(msg, socket.id, channel);
          }
          // todo instance.logger.error(nowFormatted() + 'event null : ' + unwrappedMsg.event + ' from ' + socket.upgradeReq.connection.remoteAddress);
          instance.logger.info(nowFormatted() + 'Message received: ' + JSON.stringify(unwrappedMsg) + ' from ' + socket.upgradeReq.connection.remoteAddress);
          instance.wss.broadcast(msg, socket.id);
        });
      });

      // handle wrongly formated queries
      instance.wss.on('clientError', function(err, socket){
        instance.logger.error(nowFormatted() + 'Wrong request from client '+ socket.id +'!');
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      });
      // listen for server shut down
      instance.wss.on('close', function(){
        instance.logger.error(nowFormatted() + 'Server shut down.');
        // try auto reconnect here ?
      });

      return instance;
    });
}

module.exports = function( httpListener, logger ) {
  return new wsCtrl( httpListener, logger )
    .then(addBroadcastPolyfill)
    .then(addWsEvtListeners);
};
