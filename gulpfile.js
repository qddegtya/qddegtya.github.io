"use strict";

var gulp = require("gulp");
var uglifycss = require("gulp-uglifycss");

function build(cb) {
  gulp
    .src("./assets/css/*.css")
    .pipe(uglifycss())
    .pipe(gulp.dest("./assets/dist/"));

  cb();
}

function debug(cb) {
  gulp.src("./assets/css/*.css").pipe(gulp.dest("./assets/dist/"));

  cb();
}

exports.build = gulp.task(build);
exports.debug = gulp.task(debug);
