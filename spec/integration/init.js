let mocha = require('mocha');
let chai = require('chai');
let chaiPromised = require('chai-as-promised');
let wss = require('../../src/ws.js');
let WebSocket = require('ws');
let Promise = global.Promise || require('promise');

chai.use(chaiPromised);
let expect = chai.expect;

describe('Websocket initialization', function(){
  this.timeout(10 * 1000);
  let testMsg = 'A test message';
  before(function(done) {
    let http = require('http').Server();
    let winston = require('winston');
    http.listen(8088, function() {
      console.log('HTTP server initialized!');
    });
    // let logger = {info:function(){}};
    new wss(http, winston)
      .then(function(){
        winston.info('Server initialized');
        done();
      });
  });

  it('Accept incoming connections', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.close();
      done();
    });
  });

  it('Send messages', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send(testMsg);
      ws.close();
      done();
    });
  });

  it('Broadcast messages', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('message', function(msg){
      expect(msg).to.be.equal(testMsg);
      ws.close();
      ws2.close();
      done();
    });

    let ws2 = new WebSocket('ws://localhost:8088');
    ws2.on('open', function(){
      ws2.send(testMsg);
    });
  });

  it('Return error if client send invalid command', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send(JSON.stringify({chn: 'invalid_command'}));
    });
    ws.on('message', function(msg){
      let unwrappedMsg = JSON.parse(msg);
      expect(unwrappedMsg).to.include.keys('error');
      expect(unwrappedMsg['error']).to.equals('invalid command');
      ws.close();
      done();
    });
  });

  it('Connect to default channel', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send(JSON.stringify({chn: 'getChannel'}));
    });
    ws.on('message', function(msg){
      let unwrappedMsg = JSON.parse(msg);
      expect(unwrappedMsg).to.include.keys('joinedChannels');
      expect(unwrappedMsg['joinedChannels']).to.be.an('array');
      expect(unwrappedMsg['joinedChannels'][0]).to.equals('default');
      ws.close();
      done();
    });
  });

  it('Broadcast to default channel', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    let ws2 = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send('Hello users!');
    });
    ws2.on('message', function(msg){
      expect(msg).to.equals('Hello users!');
      ws.close();
      ws2.close();
      done();
    });
  });

  it('Connect to custom channel', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send(JSON.stringify({chn: 'joinChannel', channel: 'customChannel'}));
    });
    ws.on('message', function(msg){
      let unwrappedMsg = JSON.parse(msg);
      expect(unwrappedMsg).to.include.keys('joinedChannels');
      expect(unwrappedMsg['joinedChannels']).to.be.an('array');
      expect(unwrappedMsg['joinedChannels'][0]).to.equals('default');
      expect(unwrappedMsg['joinedChannels'][1]).to.equals('customChannel');
      ws.close();
      done();
    });
  });

  it('Returns error if custom channel already joined', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send(JSON.stringify({chn: 'joinChannel', channel: 'customChannel'}));
    });
    ws.on('message', function(msg){
      if (msg.indexOf('error') === -1) return ws.send(JSON.stringify({chn: 'joinChannel', channel: 'customChannel'}));
      let unwrappedMsg = JSON.parse(msg);
      expect(unwrappedMsg).to.include.keys('error');
      expect(unwrappedMsg['error']).to.equals('Channel already joined');
      ws.close();
      done();
    });
  });

  it('Broadcast to custom channel', function(done){
    let ws = new WebSocket('ws://localhost:8088');
    let ws2 = new WebSocket('ws://localhost:8088');
    ws.on('open', function(){
      ws.send(JSON.stringify({chn: 'joinChannel', channel: 'customChannel'}));
    });

    ws2.on('open', function(){
      ws2.send(JSON.stringify({chn: 'joinChannel', channel: 'customChannel'}));
    });

    ws.on('message', function(msg){
      ws.send(JSON.stringify({channel:'customChannel', msg: 'Hello users!'}));
    });

    ws2.on('message', function(msg){
      if (msg.indexOf('Hello') != -1) {
        ws.close();
        ws2.close();
        done();
      }
    });
  });
});
