var sass ,
    Q = require('q'),
    path = require('path');

var cwd = process.cwd();

try{
    sass = require('node-sass');
}catch(e) {
    console.info('toilet: no sass engine');
};

if (sass){
    module.exports = function(req, file, callback) {
        var deferred = Q.defer();

        sass.render({
            file: file,
            includePaths: this.baseDir.map(function(dir){
                return path.normalize(cwd+'/'+dir);
            })}, function(err, result) {
                if (err) return deferred.reject(err); 
                deferred.resolve({
                    contentType: 'text/css',
                    data: result.css
                })
            });

        return deferred.promise;
    }
} else {
    module.exports = null;
}
