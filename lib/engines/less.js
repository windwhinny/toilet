var less 
    path = require('path'),
    fs = require('fs'),
    Q = require('q');

try{
    less = require('less');
}catch(e){};

var cwd = process.cwd();

if (less) {
    module.exports = function(req, file, callback) {
        var deferred = Q.defer();
        var toilet = this;
        
        fs.readFile(file, function(err, input) {
            if (err) return deferred.reject(err);

            less.render(input, {
                filename: file,
                paths: toilet.baseDir.map(function(dir){
                    return path.normalize(cwd+'/'+dir);
                }),
            }, function(err, out) {
                if (err) return deferred.reject(err);

                deferred.resolve({
                    contentType: 'text/css',
                    data: out
                });
            })
        })

        return deferred;
    };
} else {
    module.exports = null;
}
