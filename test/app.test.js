var expect  = require('chai').expect;
var assert = require('assert');
var config = require('../config');
var chai = require('chai');
chai.use(require('chai-string'));
var assert = require('chai').assert


var request = require('request');


var baseURL = `https://localhost:${config.listenPort}`



describe('Getting a trackable URL',()=>{

    it('returns status 200',()=>{
        request(baseURL,(error,response,body)=>{
            assert.equal(response.statusCode,200)
        })        
    });

    it('Gives a trackable URL',()=>{
        request(baseURL,(error,response,body)=>{
            assert.startsWith(body,`${baseURL}${config.trackerHitURL}/`)
        })
    });

    

})