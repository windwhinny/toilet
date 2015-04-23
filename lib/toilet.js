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

    for (var i in defaultEngines) {
        this.engines[i] = this.engines[i] || defaultEngines[i];
    }
};

Tiolet.prototype.handler = function(req, res, next) {
    var file = path.normalize(this.baseDir+req.path);
    var self = this;

    async.waterfall([
        function (cb) {
            isFile(file, cb);
        },
        function(ok, cb){
            if(!ok) return next();
            cb();
        },
        function(cb){
            self.parseFile(req, file, cb);
        },
        function(cb, content){
            self.render(req, res, content, cb);
        }], function (err) {
            if(err) return next(err);
            next();
        });
};

Toilet.prototype.middleware = function() {
    return this.handler.bind(this);
};

// select engine to parse file
Toilet.prototype.parseFile = function(req, file, callback) {
    var ext = path.extname(file).replace(/^\./, '');

    for(var i in this.replacement){
        if (i == ext) {
            exit = this.replacement[i];
            break;
        }
    };

    if (!ext) {
        // unrecognize file type
        return callback(null, false);
    };

    var engine = this.engines[ext];

    // no engine found
    if (!engine) return callback(null, false));

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
        if (isReadableStream(content.data)) {

            content.data.pipe(res);
        }else{

            res.send(content.data);
            res.end();
        }
    }else{
        res.end();
    }
};

function isFile(file, callback) {
    async.waterfall([
        function(cb) {
            fs.exists(file, cb);
        },
        function(exists, cb){
            if(!exists) return cb(new Error('file does not exists'));

            fs.stat(file, cb);
        },
        function(stat, cb){
            if(!stat.isFile()){
                cb(new Error('file does not exists'));
            }else if(stat.size == 0){
                cb(new Error('empty file'));
            }
        }], callback);
};

function isReadableStream(obj) {
    return obj instanceof stream.Stream &&
        typeof (obj._read === 'function') &&
        typeof (obj._readableState === 'object');
}

module.export = function(config) {
    var tiolet = new Tiolet(config);
    return tiolet.middleware();
};