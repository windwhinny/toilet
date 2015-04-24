var path = require('path'),
    fs = require('fs'),
    stream = require('stream'),
    async = require('async');

var defaultEngines = {
    js: require('./jsEngine'),
    scss: require('./sassEngine')
};

function Toilet(config) {
    this.baseDir = config.baseDir || '.';
    this.engines = config.engines || {};
    this.replacement = config.replacement || {};
    this.fs = fs;

    for (var i in defaultEngines) {
        this.engines[i] = this.engines[i] || defaultEngines[i];
    }
};

Toilet.prototype.handler = function(req, res, next) {
    var file = path.normalize(this.baseDir+req.path);
    var self = this;

    async.waterfall([
        function (cb) {
            self.getPath(file, cb);
        },
        function (filepath, cb) {
            file = filepath;
            self.isFile(filepath, cb);
        },
        function(ok, cb){
            if (ok) {
                self.parseFile(req, file, cb);
            }else{
                cb(new Error('cannot parse this file"'));
            }
        },
        function(content, cb){
            self.render(req, res, content, cb);
        }], function (err) {
            if (err) {
                if (err.message == "cannot parse this file") {
                    return next();
                }
                return next(err);
            }
            next();
        });
};

Toilet.prototype.middleware = function() {
    return this.handler.bind(this);
};

Toilet.prototype.getPath = function(file, callback) {
    var originExt = path.extname(file).replace(/^\./, '');
    var ext = originExt;

    for(var i in this.replacement){
        if (i == ext) {
            ext = this.replacement[i];
            file = file.replace(new RegExp('\\.'+originExt+'$'), '.'+ext);
            break;
        }
    };

    if (!ext) {
        // unrecognize file type
        return callback(new Error('cannot parse this file'));
    };

    callback(null, file);
};

// select engine to parse file
Toilet.prototype.parseFile = function(req, file, callback) {
    var ext = path.extname(file).replace(/^\./, '');
    var engine = this.engines[ext];

    // no engine found
    if (!engine) return callback(new Error('cannot parse this file'));

    engine.call(this, req, file, callback);
};

// render result to response
Toilet.prototype.render = function(req, res, content, callback) {
    if (content === false) {
        callback();
    };

    var type = content.contentType;
    if (type) {
        res.set('Content-Type', type);
    };

    if (content.data){
        if (this.isReadableStream(content.data)) {

            content.data.pipe(res);
        }else{

            res.send(content.data);
            res.end();
        }
    }else{
        res.end();
    }
};

Toilet.prototype.isFile = function(file, callback) {
    var self = this;
    async.waterfall([
        function(cb) {
            self.fs.exists(file, function(exists){
                cb(null, exists);
            });
        },
        function(exists, cb){
            if (typeof cb != 'function') {
                cb = exists;
                exists = false;
            };

            if(!exists) return cb(new Error('file does not exists'));

            self.fs.stat(file, cb);
        },
        function(stat, cb){
            if(!stat.isFile()){
                cb(new Error('file does not exists'));
            }else if(stat.size == 0){
                cb(new Error('empty file'));
            }else{
                cb(null, true);
            };

        }], callback);
};

Toilet.prototype.isReadableStream = function(obj) {
    return obj instanceof stream.Stream &&
        typeof (obj._read === 'function') &&
        typeof (obj._readableState === 'object');
};

module.exports = function(config) {
    var toilet = new Toilet(config);
    return toilet.middleware();
};

module.exports.Toilet = Toilet;