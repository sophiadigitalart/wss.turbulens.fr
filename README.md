[![Build Status](https://travis-ci.org/videodromm/netdromm.svg?branch=master)](https://travis-ci.org/videodromm/netdromm)

# netdromm
Multi-channel websocket server.
Websockets server for OSC, MIDI, chat, video channels, shaders, webp streaming etc. made with nodejs

######Setup nodejs 7

Generate key / cert

```
openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem 
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt
```

On Linux

``` sh
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
```

If needed, compile from the source:

``` sh
wget http://nodejs.org/dist/node-latest.tar.gz
tar -xzf node-latest.tar.gz
cd node-7xx
./configure
make
sudo make install
```

On Raspberry Pi, it takes 4 hours :notes:

######Git workflow:
Fork and clone this your repo and copy it to /opt/

``` sh
git clone https://github.com/videodromm/netdromm (replace videodromm by your name)
(no) cp -a netdromm/ /opt/
(no) cd /opt/netdromm/
npm install -g mocha nodemon
npm install
npm start
```

Optional
(no) copy netdromm to /etc/init.d/ to launch at startup

``` sh
(no) cp /opt/netdromm/netdromm /etc/init.d/
(no) update-rc.d netdromm defaults
```

######Run tests
`npm test`

######Docker
See https://github.com/videodromm/docker-videodromm

######Contribute
Code, than commit and push to your fork then do a pull request.

######Roadmap
- [x] Basic websocket broadcast
- [ ] Authentication
- [ ] Maintain a list of clients (ip whitelist after auth)
- [ ] Webp streaming
