var expect  = require('chai').expect;
var assert = require('assert');
var config = require('../config');
var chai = require('chai');
chai.use(require('chai-string'));
var assert = require('chai').assert
var sinon = require('sinon');
var fingerprint = require('fingerprintjs2')
var EmailNotifier = require('../emailNotifier')
var Tracking = require('../tracking')
var MockRedisStorageProvider = require('../mockRedisStorageProvider')
var winston = require('winston')

let hexRegEx=/^[a-fA-F0-9]*$/
suite('Tracking',()=>{
    suite('Unit Tests',()=>{
        suite('getRandomCryptoString',()=>{
            test('returns appropriate length hex string for byteCount=3',()=>{

                return Tracking.getRandomCryptoHexString(3).then((value)=>{
                    assert.equal(value.length,6)
                    assert.equal(hexRegEx.test(value),true)
                })
                
            })

            test('returns appropriate length hex string for byteCount=48',()=>{
                return Tracking.getRandomCryptoHexString(48).then((value)=>{
                    assert.equal(value.length,96)
                    assert.equal(hexRegEx.test(value),true)
                });

            })


            test('returns different string each time',()=>{

                return Tracking.getRandomCryptoHexString(48)
                .then((trackingString1)=>{
                    Tracking.getRandomCryptoHexString(48)
                    .then((trackingString2)=>{
                        assert.equal(trackingString1.length,96);
                        assert.equal(trackingString2.length,96);
                        assert.equal(hexRegEx.test(trackingString1),true)
                        assert.equal(hexRegEx.test(trackingString2),true)
                        assert.notEqual(trackingString1,trackingString2);
                    })
                })
            })


        })

        suite('getNewTracker',()=>{
            
            
            let mockStorageProvider = new MockRedisStorageProvider()
            
            test('returns a random hex string token of appropriate length',()=>{
                //mockStorageProvider.expects('storeHash').once().withArgs(sinon.match.string,sinon.match((v)=>{return v.emailAddress=="somebody@example.com"}))

                return Tracking.getNewTracker('somebody@example.com',mockStorageProvider,48).then((tracker)=>{
                    assert.equal(tracker.length,96);
                    assert.equal(hexRegEx.test(tracker),true)                
                    //mockStorageProvider.storeHash.verify()
                })
            })
        })


    })

    suite('Integration Tests',()=>{

        suite('getNewTracker',()=>{
            let storageProvider = new MockRedisStorageProvider();
            
            let emailAddress="somebody@example.com"
            test('stores email in database using correct hash',()=>{
                //mockStorageProvider.expects('storeHash').once().withArgs(sinon.match.string,sinon.match((v)=>{return v.emailAddress==emailAddress}))

                return Tracking.getNewTracker(emailAddress,storageProvider,48).then((tracker)=>{
                    assert.equal(tracker.length,96);
                    assert.equal(hexRegEx.test(tracker),true)                
                    return storageProvider.retrieve(tracker).then((obj)=>{
                        assert.equal(obj.emailAddress,emailAddress)
                        
                    })
                })
            })
        })
        suite('trackerHit',()=>{    
            winston.level='error'
            let clock = sinon.useFakeTimers(new Date());
            after(()=>{
                clock.restore();
            })
            test('first-time hit -- stores data and sends email',()=>{
                let storageProvider = new MockRedisStorageProvider()
                let token='someRandomToken'
                let emailNotifier = new EmailNotifier();
                sinon.spy(emailNotifier,"notify")

                let obj = {
                    emailAddress:"someone@example.com"
                }
                let mockRequest = {
                    ip: '12.34.56.78'
                }

                storageProvider.store(token,obj)
                
                Tracking.trackerHit(token,storageProvider,emailNotifier,{hash:'zzzyyywwwxxx4321'},mockRequest)
                
                return storageProvider.retrieve(token).then((v)=>{
                    assert.equal(v.emailAddress,obj.emailAddress)
                    
                    assert(emailNotifier.notify.calledWithMatch(sinon.match((v)=>{return v==obj.emailAddress}),sinon.match.string))

                    //check message contents

                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,`first time hit for tracker id ${token}`))                
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original IP address    : 12.34.56.78'))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original recipient     : someone@example.com'))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original open timestamp: '+(new Date()).toUTCString() ))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'current open timestamp : '+(new Date()).toUTCString() ))

                    // first time hit for tracker id someRandomToken
                    // original IP address    : 12.34.56.78
                    // original recipient     : someone@example.com
                    // original open timestamp: Fri, 22 Sep 2017 06:42:30 GMT
                    // current open timestamp : Fri, 22 Sep 2017 06:42:30 GMT
                    
                    
                })
                
            })

            test('subsequent hit with same hash sends email appropriately',()=>{
                let storageProvider = new MockRedisStorageProvider()
                let token='someRandomToken'
                let emailNotifier = new EmailNotifier();
                sinon.spy(emailNotifier,"notify")

                let originalTime = new Date()
                let obj = {
                    emailAddress:"someone@example.com",
                    ip: '12.34.56.78',
                    originalTimestamp: (originalTime).toUTCString(),
                    fingerprint:{
                        hash: "someRandomHash"
                    }
                }
                let mockRequest = {
                    ip: '12.34.56.78'
                }
                

                storageProvider.store(token,obj)
                clock.tick(60*60*1000)
                let newTime = new Date() 
                Tracking.trackerHit(token,storageProvider,emailNotifier,{hash:obj.fingerprint.hash},mockRequest)
                

                return storageProvider.retrieve(token).then((v)=>{
                    assert.equal(v.emailAddress,obj.emailAddress)
                    
                    assert(emailNotifier.notify.calledWithMatch(sinon.match((v)=>{return v==obj.emailAddress}),sinon.match.string))

                    //check message contents
                    
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,`Message opened on same device as original opening for tracker id ${token}`))                
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original IP address    : 12.34.56.78'))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original recipient     : someone@example.com'))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original open timestamp: '+(originalTime).toUTCString() ))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'current open timestamp : '+(newTime).toUTCString() ))

                    // first time hit for tracker id someRandomToken
                    // original IP address    : 12.34.56.78
                    // original recipient     : someone@example.com
                    // original open timestamp: Fri, 22 Sep 2017 06:42:30 GMT
                    // current open timestamp : Fri, 22 Sep 2017 06:42:30 GMT
                    
                    
                })
                
            })

            test('subsequent hit with same hash sends email appropriately',()=>{
                let storageProvider = new MockRedisStorageProvider()
                let token='someRandomToken'
                let emailNotifier = new EmailNotifier();
                sinon.spy(emailNotifier,"notify")

                let originalTime = new Date()
                let obj = {
                    emailAddress:"someone@example.com",
                    ip: '12.34.56.78',
                    originalTimestamp: (originalTime).toUTCString(),
                    fingerprint:{
                        hash: "someRandomHash"
                    }
                }
                let mockRequest = {
                    ip: '12.34.56.78'
                }
                

                storageProvider.store(token,obj)
                clock.tick(60*60*1000)
                let newTime = new Date() 
                Tracking.trackerHit(token,storageProvider,emailNotifier,{hash:"someOtherRandomHash"},mockRequest)
                

                return storageProvider.retrieve(token).then((v)=>{
                    assert.equal(v.emailAddress,obj.emailAddress)
                    
                    assert(emailNotifier.notify.calledWithMatch(sinon.match((v)=>{return v==obj.emailAddress}),sinon.match.string))

                    //check message contents
                    
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,`Message opened on different device than original opening for tracker id ${token}`))                
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original IP address    : 12.34.56.78'))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original recipient     : someone@example.com'))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'original open timestamp: '+(originalTime).toUTCString() ))
                    assert(emailNotifier.notify.calledWithMatch(sinon.match.any,'current open timestamp : '+(newTime).toUTCString() ))

                    // first time hit for tracker id someRandomToken
                    // original IP address    : 12.34.56.78
                    // original recipient     : someone@example.com
                    // original open timestamp: Fri, 22 Sep 2017 06:42:30 GMT
                    // current open timestamp : Fri, 22 Sep 2017 06:42:30 GMT
                    
                    
                })
                
            })

        })
    })
})