var should = require('should'),
    async = require('async'),
    fs = require('fs'),
    Toilet = require('../lib/toilet').Toilet;

describe('Toilet', function() {
    var toilet;

    beforeEach(function(){
        toilet = new Toilet({
            baseDir:'/a'
        });
    });

    describe('isFile', function() {
        var path = '/a/b/c';

        beforeEach(function(){
            toilet.fs = {
                exists: function(cb) {cb(null,true)},
                stat: function(cb) {
                    cb({
                        isFile:function(){return true}
                    });
                }
            }
        });

        it('should return error when file not exists', function(cb) {
            toilet.fs.exists = function(file, cb){cb(null, false)};
            
            toilet.isFile(path, function(e){
                should.exists(e);
                e.message.should.equal('file does not exists');
                cb()
            });
        });

        it('should return error when file is dir', function(){
            toilet.fs.isFile = function(){return false};

            toilet.isFile(path, function(e){
                should.exists(e);
                e.message.should.equal('file does not exists');
                cb()
            });
        });
    });

    describe('parseFile', function() {

        beforeEach(function() {
            toilet.replacement = {
                css: 'scss'
            };
        });

        it('should follow the replacement rules', function(done) {
            var engine = function(req, file, callback) {
                file.should.match(/\.scss$/);
                callback(null, {});
            };

            toilet.engines.scss = engine;
            toilet.parseFile({}, '/a.css', function(err, result){
                should.not.exists(err);
                result.should.not.equal(false);
                done();
            });
        });
    });

    describe('render', function() {
        var contentType = 'application/javascript';
        var req, res;
        beforeEach(function(){
            req = {};
            res = {
                set: function() {},
                end: function() {}
            };
        })

        it('should send contentType', function(cb) {
            toilet.render({}, {
                set: function(key, value) {
                    key.should.equal('Content-Type');
                    value.should.equal(contentType)
                },
                end: cb
            },{
                contentType: contentType
            });
        });

        it('should handle string data', function(cb) {
            var str = "abcd";
            res = {
                set: function() {},
                send: function(value) {
                    value.should.equal(str);
                },
                end: cb
            };

            toilet.render(req ,res ,{
                contentType: contentType,
                data: str
            });
        });

        it('should handle stream data', function(cb) {
            toilet.render.call({
                isReadableStream: function(){return true}
            }, req, res, {
                contentType: contentType,
                data: {
                    pipe: function(writeable) {
                        res.should.equal(writeable);
                        cb();
                    }
                }
            });
        });
    });
});