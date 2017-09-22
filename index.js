var app = require('express')()
var cluster = require('cluster');

var https = require('https');
var http = require('http');
var fs = require('fs');
var config = require('./config');
var trackingRoutes = require('./tracking-routes')


app.get('/',(request,response)=>{
    response.send(`
        OK!
    `)
})

app.use('/',trackingRoutes)

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

https.createServer(options,app).listen(config.listenPort,()=>{
    console.log(`listening on port ${config.listenPort}`)
})


