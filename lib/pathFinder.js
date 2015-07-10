var Q = require('q'),
    fs = require('fs'),
    path = require('path');

/**
 * PathFinder 将会在 baseDir 指定的目录下逐个搜索 reqPath 对应的文件，
 * 如果找到了对应的文件，会返回文件的绝对路径。
 * 如果没有找到文件，则会返回错误。
 *  
 * 搜索的规则参见 PathFinder.find
 *       
 * example:
 *  ```javascript
 *  var finder = new PathFinder(['/opt/www']);
 *
 *  finder.find('/index.js')
 *      .then(function(file){
 *          console.log('file path is:', file);
 *          // /opt/www/inidex.js
 *      })
 *      .catch(function(err){
 *          // file not found
 *          console.error(err);
 *      });
 *  ```
 *
 * @class
 * @param {Array<string> | string} baseDir 需要搜索的目录
 * @param {object} extReplacement 后缀名替换规则, 
 *                 键值分别对应需要替换的后缀和替换后的后缀
 *                 如：{css:'scss'} 表示将 css 后缀替换为 scss
 */
function PathFinder (baseDir, extReplacement) {
    this.base = baseDir || [];
    this.replacement = extReplacement || {};
}

/**
 * 根据指定的文件名，找到对应的文件地址。
 * 
 * 1. 如果 baseDir 是个字符串，则将 baseDir 与 reqPath 合并
 * 2. 如果 baseDir 是数组，则将数组内的字符串依次与 reqPath 合并,并执行第三步
 * 3. 并判断合并后的路径是否合法,判断文件是否合法的规则参见 PathFinder.testPath。
 *
 * @params {string} reqPath 需要查找的文件名
 * @return {Promise<string, Error>} 返回一个 Promise 对象
 *                                  resolve 返回找到的文件地址
 *                                  如果没有找到文件将会触发 reject，并返回 error
 */
PathFinder.prototype.find = function(reqPath) {
    var baseDir = this.baseDir,
        self = this,
        deferred = Q.defer();
        file;

    function concatPathString(dir, path) {
        if(path&&path.indexOf('/' == 0)){
            return dir+path;
        }else{
            return dir+'/'+path;
        }
    };

    if (Array.isArray(baseDir)) {
        var index = 0;

        
        function testPathWithBaseDir(index) {
            if (index == baseDir.length) {
                return Q.reject();
            };

            var file = concatPathString(baseDir[index], reqPath);

            index++;

            return self.testPath(file)
                .then(function(file) {
                    return deferred.resolve(file);
                })
                .catch(function(){
                    return testPathForBaseDir(index);
                });
            });
        };
        
        // 遍历所有 baseDir 找出文件
        return testPathWithBaseDir(0);
    } else {
        file = concatPathString(baseDir, reqPath);
        return self._getPath(file));
    }
}

/**
 * 测试文件地址是否合法，
 * 首先会按照 finder.replacement 指定的规则来替换文件路径。
 * 如果替换后的路径不是文件的话，则会尝试判断原路径是否为文件。
 * 其中有一条路径为文件，则会返回那条路径。
 * 如果两条路径都不为文件，则返回错误。
 *
 * @param {string} file 传入的文件地址，需为绝对路径。
 * @return {Promise<string, Error>} 找到文件后触发 resolve 并返回地址，没有找到则触发 reject
 */
PathFinder.prototype.testPath = function(file) {
    var originFilename = file;
    var self = this;

    try{
        file = self.replaceFileExt(file);
    }catch(e){
        return Q.reject(e);
    }

    return self.isFile(file)
        .catch(function(err) {
            return self.isFile(originFilename);
        });
};

/**
 * 测试文件地址是否为文件，
 * 地址为目录则会返回错误。
 *
 * @param {string} file 传入的文件地址，需为绝对路径。
 * @return {Promise<string, Error>} 地址为文件，则触发 resolve，并放入地址，否则触发 reject。
 */
PathFinder.prototype.isFile = function(file) {
    var self = this;
    var deferred = Q.defer();

    self.fs.exists(file, function(exists){
        if(!exists) return deferred.reject(new Error('file does not exists'));

        self.fs.stat(file, function(err, stat) {
            if(err) return deferred.reject(err);

            if(!stat.isFile()){
                deferred.reject(new Error('file does not exists'));
            }else{
                deferred.resolve(file);
            };
        });
    });

    return deferred;
};

module.exports = PathFinder;
