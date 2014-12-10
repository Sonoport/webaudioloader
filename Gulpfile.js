"use strict";

var pkg = require('./package.json');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var webserver = require('gulp-webserver');
var browserify = require('browserify');
var transform = require('vinyl-transform');

var paths = {
	jssrc : './src/*.js',
  test : './test/',
  dist : './dist',
  testspecs : './test/spec/*.js'
}

var banner= '/*<%= pkg.name %> - v<%= pkg.version %> - ' +
'<%= new Date() %> */ \n';

gulp.task('jshint', function(){

    return gulp.src([paths.jssrc])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('browserify', ['jshint'], function () {
  var browserified = transform(function(filename) {
    var b = browserify(filename, {standalone: pkg.name});
    return b.bundle();
  });

  return gulp.src([paths.jssrc])
    .pipe(browserified)
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('standalone', ['browserify'], function () {

  return gulp.src(['dist/webaudioloader.js'])
    .pipe(uglify({mangle: false, preserveComments: 'all'}))
    .pipe(rename('webaudioloader.min.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('jshint:test', function(){

    return gulp.src([paths.testspecs])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('browserify:test',['jshint:test'], function () {

  var browserified = transform(function(filename) {
    var b = browserify(filename);
    return b.bundle();
  });

  return gulp.src(['./test/spec/*.js'])
    .pipe(browserified)
    .pipe(rename('test.js'))
    .pipe(gulp.dest('./test'));
});

gulp.task('watch:test', function(){
    gulp.watch(paths.testspecs, ['browserify:test']);
});

gulp.task('test', ['jshint', 'browserify:test', 'watch:test'], function(){
    return gulp.src([paths.test, paths.dist])
    .pipe(webserver({
        port: 8080,
        host : "localhost"
    }));
});
