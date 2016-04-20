var gulp = require('gulp');
var shell = require('gulp-shell');


gulp.task('default', shell.task([
        './r.js -o ./javascripts/build.js optimize=none generateSourceMaps=true'
    ])
);

gulp.task('webserver', function() {
    var webserver = require('gulp-webserver');
    var server    = {
        host: 'localhost',
        port: '8001'
    };

    gulp.src( './' )
        .pipe(webserver({
            host            : server.host,
            port            : server.port,
            livereload      : true,
            directoryListing: false
        }));
});