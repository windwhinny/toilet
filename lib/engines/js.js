var browserify,
    Q = require('q');

try{
    browserify = require('browserify');
} catch(e) {};

if (browserify) {
    module.exports = function(req, file, callback) {
        var toilet = this;
        var data = ''; 
        var deferred = Q.defer();

        browserify({
            entries: file,
            paths: toilet.baseDir
        })
        .bundle()
        .on('error', function(err) {
            console.error(err);
            deferred.reject(err);
        })
        .on('data', function(chunk){
            data += chunk.toString();
        })
        .on('end', function(){
            deferred.resolve({
                contentType: 'application/javascript',
                data: data, 
            }) 
        });

        return deferred.promise;
    }
} else {
    module.exports = null;
}
