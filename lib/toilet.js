var path = require('path'),
    fs = require('fs'),
    stream = require('stream'),
    Q = require('q'),
    pathFinder = require('./pathFinder'),
    async = require('async');

var defaultEngines = require('./engines')

function Toilet(config) {
    this.baseDir = config.baseDir || '.';
    this.engines = config.engines || {};
    this.replacement = config.replacement || {};
    this.fs = fs;

    this.pathFinder = new PathFinder(this.baseDir, this.replacement);

    for (var i in defaultEngines) {
        this.engines[i] = this.engines[i] || defaultEngines[i];
    };
};

Toilet.prototype.handler = function(req, res, next) {
    var self = this,
        file;

    return self.pathFinder
        .find(req.path)
        .then(function(filepath){
            return self.parseFile(req, filepath);
        })
};

Toilet.prototype.middleware = function() {
    var self = this;

    return function(req, res, next) {
        self.handler(req.path) 
            .then(function(content){
                return self.render(req, res, content);
            })
            .catch(function(err){
                if (err.message == "cannot parse this file") {
                    return next();
                };

                next(err); 
            })
            .done();
    }
};

Toilet.prototype.replaceFileExt = function(file) {
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
        throw new Error('cannot parse this file');
    };

    return file;
};

// select engine to parse file
Toilet.prototype.parseFile = function(req, file) {
    var ext = path.extname(file).replace(/^\./, '');
    var engine = this.engines[ext];

    // no engine found
    if (!engine) return callback(new Error('cannot parse this file');

    try{
        return engine.call(this, req, file)
            .catch(function(err){
                console.error(err);
                return err;
            });
    }catch(e) {
        return Q.reject(e);
    }
};

// render result to response
Toilet.prototype.render = function(req, res, content) {
    if (content === false) {
        return Q.reject();
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
    };

    return Q.resolve();
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
