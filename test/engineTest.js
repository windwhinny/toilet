var should = require('should'),
    jsEngine = require('../lib/jsEngine'),
    fs = require('fs'),
    async = require('async'),
    sassEngine = require('../lib/sassEngine');

describe('Engines', function() {

    function getFileContent(file, callback) {
        fs.readFile(file, callback);
    };

    function getContentByEngine(engine, file, callback) {
        engine({}, file, function(err, content){
            should.not.exists(err);
            should.exists(content);
            callback(err, content);
        });
    };

    describe('jsEngine', function() {
        var content,
            resources = [
                '/resource/moduleA.js',
                '/resource/moduleB.js',
                '/resource/moduleC.js']
                .map(function(file) {
                    return __dirname + file
                });

        beforeEach(function(cb) {
            getContentByEngine(jsEngine, resources[0], function(err, _content) {
                content = _content;
                cb(err);
            });
        });

        it('should return stream', function() {
            should.exists(content.data.pipe);
            (typeof content.data).should.equal('object');
        });

        it('should return correct contentType', function() {
            content.contentType.should.equal('application/javascript');
        });

        it('should track the dependencies module and return the concated content', function(cb) {
            var fileContent = "";
            content.data.on('data', function(data) {
                fileContent += data.toString();
            });

            content.data.on('error', function(err) {
                cb(err)
            });

            content.data.on('end', function() {
                async.each(resources, function(file, cb) {
                    getFileContent(file, function(err, data) {
                        if(err) return cb(err);
                        fileContent.indexOf(data).should.above(-1);
                        cb();
                    });
                },cb);
            });
        });
    });

    describe('sassEngine', function() {
        var content,
            resources = [
                '/resource/moduleA.scss',
                '/resource/moduleB.scss',
                '/resource/moduleC.scss']
                .map(function(file) {
                    return __dirname + file
                });

        beforeEach(function(cb) {
            getContentByEngine(sassEngine, resources[0], function(err, _content) {
                content = _content;
                cb(err);
            });
        });

        it('should return string', function() {
            (typeof content.data).should.equal('string');
        });

        it('should return correct contentType', function() {
            content.contentType.should.equal('text/css');
        });

        it('should track the dependencies module and return the concated content', function() {
            content.data.should.match(/body\s*{\s*height:\s*1px;\s*}/);
        });
    });
});