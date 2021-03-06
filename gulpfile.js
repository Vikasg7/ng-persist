var concat        = require('gulp-concat');
var gulp          = require('gulp');
var ngAnnotate    = require('gulp-ng-annotate');
var plumber       = require('gulp-plumber');
var babel         = require('gulp-babel');

(function(){

    'use strict';

    var paths = {
        src : './src/ng-persist.js',
        dist : './dist/',
    };

    var build = function () {
        gulp
            .src(paths.src)
            .pipe(plumber())
            .pipe(ngAnnotate())
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(concat('ng-persist.js'))
            .pipe(gulp.dest(paths.dist));
    };

    gulp.task('build', build);
    gulp.task('default', ['build']);

    gulp.task('watch', function() {
        build();
        gulp.watch(paths.src, ['build']);
    });

})();
