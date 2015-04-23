var browserify = require('browserify');

module.exports = function(req, file, callback) {
    callback(err, {
        type: 'application/javascript',
        data: browserify(file).bundle();
    });
}