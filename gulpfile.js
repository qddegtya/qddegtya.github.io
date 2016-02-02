'use strict';

var gulp = require('gulp');
var uglifycss = require('gulp-uglifycss');

gulp.task('css', function () {
  gulp.src('./assets/css/*.css')
    .pipe(uglifycss())
    .pipe(gulp.dest('./assets/dist/'));
});

gulp.task('default', ['css']);
