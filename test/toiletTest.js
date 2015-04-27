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

    describe('baseDir', function() {
        it('should support multi pathes', function(done) {
            var baseDir = ['/dirA','/dirB','/dirC'];

            toilet.getPath.call({
                baseDir: baseDir,
                _getPath: Toilet.prototype._getPath,
                isFile: function(file, cb) {
                    if (file == '/dirC/testfile.js') {
                        cb(null, true);
                    } else {
                        cb(new Error('test failed'));
                    }
                },
                replaceFileExt: function(file){ return file}
            },
            '/testfile.js', 
            done);
        });
    });

    describe('isFile', function() {
        var path = '/a/b/c';

        beforeEach(function(){
            toilet.fs = {
                exists: function(file, cb) {cb(null,true)},
                stat: function(file, cb) {
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

        it('should return error when file is dir', function(done){
            toilet.fs.isFile = function(){return false};

            toilet.isFile(path, function(e){
                should.exists(e);
                e.message.should.equal('file does not exists');
                done()
            });
        });
    });

    describe('parseFile', function() {

        beforeEach(function() {
            toilet.replacement = {
                css: 'scss'
            };
        });

        it('should follow the replacement rules', function() {
            toilet.engines.scss = function() {};
            file = toilet.replaceFileExt('./a.css');

            file.should.match(/\.scss$/);
        });

        it('should select the right engine', function(done){
            var file = '/a.scss';

            toilet.engines = {
                scss: function(req, f) {
                    f.should.equal(file);
                    done()
                }
            };

            toilet.parseFile({}, file);
        })
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
