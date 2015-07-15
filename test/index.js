var should = require('should'),
    Toilet = require('../index');

describe('Toilet', function(){
    var toilet = new Toilet({
        baseDir: ['js', 'css'].map(function(dir){
            return __dirname+'/'+dir 
        }),
        replacement: {
            'css': ['less', 'scss'],
            'js': 'jsx'
        }
    });

    var promise;

    describe('PathFinder', function() {
        var file = {
            name:  '/components/list.jsx',
            otherName:  '/components/list.js',
            path:__dirname + '/js/components/list.jsx'   
        };


        it ('should find file', function(cb) {
            toilet.pathFinder.find(file.name)
                .then(function(path) {
                    path.should.equal(file.path);
                    cb();
                }, cb).done();
        });


        it('should follow the replacement rules', function(cb){
            toilet.pathFinder.find(file.otherName)
                .then(function(path) {
                    path.should.equal(file.path);
                    cb();
                },cb).done() ;
        });

        it('should return error when file not exitst', function(cb) {
            toilet.pathFinder.find('/somefile')
                .then(function() {
                    cb(new Error('not found error should exists'));
                }, function(err) {
                    should.exists(err);
                    cb(); 
                }).done();
        });

        it('should return index.js when reqPath is a directory', function(cb) {
            toilet.pathFinder.find('/components')
                .then(function(path){
                    path.should.equal(__dirname+'/js/components/index.jsx')
                    cb();
                }, function(err) {
                    cb(err); 
                }).done();
        });
    });

    describe('Engines', function() {
        this.timeout(3000);

        it('should handle js file', function(cb) {
            toilet.handler('/index.js') 
                .then(function(content) {
                    content.contentType.should.equal('application/javascript');
                    try{
                        eval(content.data);
                    }catch(e){
                        return cb(e); 
                    }

                    cb();
                },  cb).done(); 
        }); 

        it('should handle jsx file', function(cb) {
            toilet.handler('/components/index.jsx') 
                .then(function(content) {
                    content.contentType.should.equal('application/javascript');
                    try{
                        eval(content.data);
                    }catch(e){
                        return cb(e); 
                    }

                    cb();
                },  cb).done(); 
        }); 
        
        function verifiedCSSCode(code, cb) {
            if (!code) cb(new Error('code should not be empty'));
            code = code.toString();

            if (code.indexOf('body nav') < 0) {
                return cb(new Error('code not valid'));             
            }
            
            cb();
        };

        it('should handle scss file', function(cb) {
            toilet.handler('/sass/index.css')
                .then(function(content) {
                    content.contentType.should.equal('text/css');
                    verifiedCSSCode(content.data, cb);
                },  cb).done(); 
        }); 

        it('should handle less file', function(cb) {
            toilet.handler('/less/index.css')
                .then(function(content) {
                    content.contentType.should.equal('text/css');
                    verifiedCSSCode(content.data, cb);
                },  cb).done(); 
        }); 

    })
});
