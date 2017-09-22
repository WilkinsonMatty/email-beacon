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


let hexRegEx=/^[a-fA-F0-9]*$/
suite('Testing',()=>{
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
            
            test('first-time hit -- stores data and sends email',()=>{
                let storageProvider = new MockRedisStorageProvider()
                let token='someRandomToken'
                let emailNotifier = new EmailNotifier();
                sinon.spy(emailNotifier,"notify")

                let obj = {
                    emailAddress:"someone@example.com"
                }

                storageProvider.store(token,obj)
                Tracking.trackerHit(token,storageProvider,emailNotifier,{})
                
                return storageProvider.retrieve(token).then((v)=>{
                    assert.equal(v.emailAddress,obj.emailAddress)
                    assert(emailNotifier.notify.calledWithMatch(sinon.match((v)=>{return v==obj.emailAddress}),sinon.match.string))
                    
                    
                })
                
            })
        })
    })
})