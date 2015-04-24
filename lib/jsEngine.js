var browserify = require('browserify');

module.exports = function(req, file, callback) {
    callback(null, {
        contentType: 'application/javascript',
        data: browserify(file).bundle()
    });
}