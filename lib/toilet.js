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
    var self = this,
        file;

    async.waterfall([
        function (cb) {
            self.getPath(req.path, cb);
        },
        function (filepath, cb) {
            file = filepath;
            self.parseFile(req, file, cb);
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

Toilet.prototype._getPath = function(file, done) {
    
    try{
        file = this.replaceFileExt(file);
    }catch(e){
        return done(e);
    }

    this.isFile(file, function(err){
        done(err, file);
    });
};

Toilet.prototype.getPath = function(reqPath, done) {
    var baseDir = this.baseDir,
        self = this,
        file;

    if (Array.isArray(baseDir)) {
        var index = 0;

        function testPathForBaseDir(index) {
            var file = baseDir[index] + reqPath;
            index++;
            self._getPath(file, function(err, file) {
                // 所有 baseDir 下都搜索过，仍未找到文件
                if (index == baseDir.length) {
                    done(err, file);
                // 搜索下一个目录
                } else if(err) {
                    testPathForBaseDir(index);
                // 没有错误，返回结果
                } else {
                    done(null ,file);
                }
            });
        };
        
        // 遍历所有 baseDir 找出文件
        testPathForBaseDir(0);
    } else {
        file = baseDir + reqPath;
        self._getPath(file, done);
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

Toilet.prototype.isFile = function(file, done) {
    var self = this;
    self.fs.exists(file, function(exists){
        if(!exists) return done(new Error('file does not exists'));
        self.fs.stat(file, function(err, stat) {
            if(err) return done(err);

            if(!stat.isFile()){
                done(new Error('file does not exists'));
            }else if(stat.size == 0){
                done(new Error('empty file'));
            }else{
                done(null, true);
            };
        });
    });
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
