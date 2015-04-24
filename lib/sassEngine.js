var sass = require('node-sass');

module.exports = function(req, file, callback) {
    sass.render({
        file: file,
        success: function(stat){
            callback(null, {
                contentType: 'text/css',
                data: stat.css
            })
        },
        error: function(err){
            callback(err);
        }
    });
}