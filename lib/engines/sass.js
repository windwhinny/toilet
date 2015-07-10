var sass ,
    Q = require('q'),
    path = require('path');

var cwd = process.cwd();

try{
    sass = require('node-sass');
}catch(e) {};

if (sass){
    module.exports = function(req, file, callback) {
        var deferred = Q.defer();

        sass.render({
            file: file,
            includePaths: this.baseDir.map(function(dir){
                return path.normalize(cwd+'/'+dir);
            }),
            success: function(stat){
                deferred.resolve({
                    contentType: 'text/css',
                    data: stat.css
                })
            },
            error: function(err){
                deferred.reject(err);
            }
        });
        return deferred;
    }
} else {
    module.exports = null;
}
