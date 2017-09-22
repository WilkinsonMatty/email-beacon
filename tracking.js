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

    static trackerHit(trackerId, storageProvider,notifier,fingerprint,request){
        return storageProvider.retrieve(trackerId).then((v)=>{
            if(!v){
                console.log(`trackerHit with nonexistent trackerId ${trackerId}`)
                return null
            }
            if(!v.fingerprint){ //tracker hasn't been hit yet -- this is the first time
                
                v.fingerprint=fingerprint;
                v.ip = request.ip;
                v.originalTimestamp = (new Date()).toUTCString();

                let message     =   `first time hit for tracker id ${trackerId}\r\n`
                message         +=  Tracking.fingerPrintToMessageString(v)

                notifier.notify(v.emailAddress,message)
                //response.cookie(trackerId,1);
                return storageProvider.store(trackerId,v);

            }
            else{ //tracker has already been hit
                let comparisonResult = Tracking.compareFingerprints(v.fingerprint,fingerprint)
                
                if(comparisonResult){ //tracker is being hit by the same device as the original
                    let message     =   `Message opened on same device as original opening for tracker id ${trackerId}\r\n`
                    message         +=  Tracking.fingerPrintToMessageString(v)
                    
                    notifier.notify(v.emailAddress,message)
                                            
                }
                else{ //tracker is being hit by a different device than the original
                    let message     =   `Message opened on different device than original opening for tracker id ${trackerId}\r\n`
                    message         +=  Tracking.fingerPrintToMessageString(v)
                    notifier.notify(v.emailAddress,message)
                    
                }
                return v
            }
        })
    }
    static fingerPrintToMessageString(v){
        return      `original IP address    : ${v.ip}\r\n`
                +   `original recipient     : ${v.emailAddress}\r\n`
                +   `original open timestamp: ${v.originalTimestamp}\r\n`
                +   `current open timestamp : ${(new Date()).toUTCString()}\r\n`
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
        //console.log(`comparing fingerprints\r\n`,fingerprint1,'\r\n',fingerprint2)

        return fingerprint1.hash == fingerprint2.hash
    }
}

