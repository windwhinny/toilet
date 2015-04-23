var sass = require('node-sass');

module.exports = function(req, file, callback) {
    sass.render({
        file: file,
    }, function(err, result) { 
        callback(err, {
            contentType: 'text/css'
            data: result
        })
    });
}