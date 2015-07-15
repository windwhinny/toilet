var path = require('path'),
    fs = require('fs'),
    stream = require('stream'),
    Q = require('q'),
    PathFinder = require('./pathFinder'),
    async = require('async');

var defaultEngines = require('./engines')

/**
 * Toilet 的构造函数
 *
 * @param {Obejct} config 配置
 */
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

/**
 * Toilet 的主要入口
 * 通过 path ，来寻找需要处理的文件
 * 返回的 promise resolved 时，将会携带处理后的结果
 * 
 * @param {String} path
 * @return {Promise}
 */
Toilet.prototype.handler = function(req, path) {
    if (typeof req == 'string') {
        path = req;
        req = null;
    };

    var self = this,
        file;

    return self.pathFinder
        .find(path)
        .then(function(filepath){
            return self.parseFile(req, filepath);
        })
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
    if (!engine) return callback(new Error('cannot parse this file'));

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

/**
 * express 的中间件
 * 将会把 req.path 当做请求文件路径来处理
 * 然后将文件处理后的结果返回给 res, 并设置正确的 mimetype
 * 
 * @param {Object} config
 * @param {Function}
 */
Toilet.middleware = function(config) {
    var self = this;
    var toilet = new Toilet(config);

    return function(req, res, next) {

        toilet.handler(req.path) 
            .then(function(content){
                return toilet.render(req, res, content);
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

module.exports = Toilet;
