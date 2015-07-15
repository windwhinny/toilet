var browserify, react;
var Q = require('q');
var through = require('through');

try{
    browserify = require('browserify');
    react = require('react-tools');
}catch(e) {};

if (browserify && react) {
    module.exports = function(req, file, callback) {
        var toilet = this;
        var deferred = Q.defer();
        var data = '';

        browserify({
            entries: file,
            paths: toilet.baseDir,
            extensions: ['.js', '.jsx', '.json']
        }).transform(function (file) {
            var data = '';
            return through(write, end);

            function write (buf) { data += buf }
            function end () {
                try{
                    var pipe = react.transform(data);
                }catch(e){
                    console.error(e);
                    return this.queue(null);
                }
                
                this.queue(pipe);
                this.queue(null);
            };

        })
        .bundle()
        .on('error', function(err){
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
        })

        return deferred.promise;
    };
} else {
    module.exports = null;
}
