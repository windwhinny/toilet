var sass = require('node-sass'),
    path = require('path');
var cwd = process.cwd();

module.exports = function(req, file, callback) {
    sass.render({
        file: file,
        includePaths: this.baseDir.map(function(dir){
            return path.normalize(cwd+'/'+dir);
        }),
        success: function(stat){
            callback(null, {
                contentType: 'text/css',
                data: stat.css
            })
        },
        error: function(err){
            console.error(err)
            callback(err);
        }
    });
}