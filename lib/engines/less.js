var less ,
    path = require('path'),
    fs = require('fs'),
    Q = require('q');

try{
    less = require('less');
}catch(e){
    console.info('toilet: no less engine')
};

var cwd = process.cwd();

if (less) {
    module.exports = function(req, file, callback) {
        var deferred = Q.defer();
        var toilet = this;
        
        fs.readFile(file, function(err, input) {
            if (err) return deferred.reject(err);

            var promise = less.render(input.toString(), {
                filename: file,
                paths: toilet.baseDir.map(function(dir){
                    return path.normalize(cwd+'/'+dir);
                }),
            })
            .then(function(result) {
                return {
                    contentType: 'text/css',
                    data: result.css
                };
            });

            deferred.resolve(promise);
        })

        return deferred.promise;
    };
} else {
    module.exports = null;
}
