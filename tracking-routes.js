var router = require('express').Router()
var config = require('./config');
var Tracking = require('./tracking')
var cookieParser = require('cookie-parser')
var Fingerprint = require('express-fingerprint');
var blankgif = require('blankgif');

var MockRedisStorageProvider = require('./mockRedisStorageProvider')
var storageProvider = new MockRedisStorageProvider();

var EmailNotifier = require('./emailNotifier');
var notifier = new EmailNotifier();

router.use(cookieParser())
router.use(Fingerprint({
    parameters:[
		// Defaults
		Fingerprint.useragent,
		Fingerprint.acceptHeaders,
        Fingerprint.geoip,
        function(next){
            next(null,{
                ip: this.req.ip
            })
        }
    ] 
}))
router.use(blankgif.middleware())
router.route(config.requestTrackerURL)
    .get((request,response)=>{
        console.log(`tracker requested `)
        console.log('query:',request.query)
        Tracking.getNewTracker(request.query['emailAddress'].toString(),storageProvider,config.randomBytesCount).then((v)=>{
            response.send(v);
        })
        
    })

router.route(`${config.trackerHitURL}/:trackerId`)
    .get((request,response)=>{
        console.log(`tracking at ${request.url}`);
        //response.send("some tracker here")
        Tracking.trackerHit(request.params['trackerId'],storageProvider,notifier,request.fingerprint,request,response)
        .then((t)=>{
            response.set('Cache-Control','private, no-cache, no-cache=Set-Cookie, proxy-revalidate')
            response.status(200).sendBlankGif();
        })
        
    })


module.exports = router;