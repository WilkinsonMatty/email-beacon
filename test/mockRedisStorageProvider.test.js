var expect  = require('chai').expect;
var assert = require('assert');
var config = require('../config');
var chai = require('chai');
chai.use(require('chai-string'));
var assert = require('chai').assert
var MockRedisStorageProvider = require('../mockRedisStorageProvider.js')


suite('Storing and retrieving a hash',()=>{
    
    test('it stores and retrieves an object sucessfully',()=>{
        let redis = new MockRedisStorageProvider()
        let key = "testKey"
        let hash = {
            "someKey1":"one",
            "someKey2":"two",
            "someKey3":"three",
            "nested":{
                "someKey4":'4',
                "someKey5":'5',
                "someKey6":'6'
            }
        }
        
        return redis.store(key,hash)
        .then(()=>{
            redis.retrieve(key)
            .then((retrievedValue)=>{

                assert.deepStrictEqual(hash,retrievedValue);
                
            })

        })


    })

    test('a non existent key returns nothing',()=>{
        let redis = new MockRedisStorageProvider()
        let key="thisKeyDoesn'tExist"
        return redis.retrieve(key)
        .then((retrievedValue)=>{
            assert.strictEqual(retrievedValue,null)
            
        })
    })


})