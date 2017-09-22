const mockRedis = require('redis-mock')

module.exports = class MockRedisStorageProvider{

    constructor(){
        this.redis = mockRedis.createClient()
    }

    store(key,value){
        
        return new Promise((resolve,reject)=>{
            this.redis.set(key,JSON.stringify(value),(err,obj)=>{
                if(err){
                    reject(err)
                }
                else{
                    resolve(obj)
                }
            })
        })
        
        
        
    }

    retrieve(key){
        return new Promise((resolve,reject)=>{
            this.redis.get(key,(err,obj)=>{
                if(err){
                    reject(err)
                }
                else{
                    resolve(JSON.parse(obj))
                }
            })
        })
    }
}

