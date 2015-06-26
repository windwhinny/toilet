var browserify = require('browserify');

module.exports = function(req, file, callback) {
    var toilet = this;

    callback(null, {
        contentType: 'application/javascript',
        data: browserify({
            entries: file,
            paths: toilet.baseDir
        }).bundle().on('error', function(err) {
            console.error(err);
            callback(err);
        })
    });
}
