crypto = require('crypto');
config = require('./config');


module.exports = class Tracking{
    
    static getNewTracker (emailAddress,storageProvider,randomBytesCount){
        
        let t= Tracking.getRandomCryptoHexString(randomBytesCount)
        
        return t
        .then((value)=>{
            
            return storageProvider.store(value,
                {
                    emailAddress
                }
            )
            .catch((err)=>{
                console.log("error:",err)
            })
            .then(()=>{
                return value
            })            
        });
        
    }

    static trackerHit(trackerId, storageProvider,notifier,fingerprint,request,response){
        return storageProvider.retrieve(trackerId).then((v)=>{
            if(!v){
                console.log(`trackerHit with nonexistent trackerId ${trackerId}`)
                return null
            }
            if(!v.fingerprint){
                console.log(`storing fingerprint data for trackerId ~{trackerId}`,fingerprint)
                v.fingerprint=fingerprint;
                notifier.notify(v.emailAddress,`first time hit for tracker id ${trackerId}`)
                response.cookie(trackerId,1);
                return storageProvider.store(trackerId,v);

            }
            else{
                let comparisonResult = Tracking.compareFingerprints(v.fingerprint,fingerprint)
                console.log("comparisonResult: ${comparisonResult}")
                return;
            }
        })
    }

    static getRandomCryptoHexString(byteCount){
        
        return new Promise((resolve,reject)=>{
            crypto.randomBytes(byteCount,(err,buf)=>{
                if(err){
                    reject(err)
                }
                else{
                    resolve(buf.toString('hex'))
                }
            })
        })

        
    }

    static compareFingerprints(fingerprint1,fingerprint2){
        console.log(`comparing fingerprints`,fingerprint1,fingerprint2)

        return 'unknown'
    }
}

