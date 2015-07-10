var engines = {
    js: './js',
    scss: './sass',
    jsx: './jsx',
    less: './less'
};

Object.keys(engines).forEach(function(key) {
    var enginePath = engines[key];

    var engine = require(enginePath);

    if (engine) {
        engines[key] = engine; 
    } else {
        delete engines[key];
    }
})

module.exports = engines;
