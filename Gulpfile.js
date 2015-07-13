"use strict";

var pkg = require('./package.json');

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var webserver = require('gulp-webserver');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var paths = {
	jssrc : './lib/*.js',
  jsentry: './lib/webaudioloader.js',
  test : './test/',
  dist : './dist',
  testspecs : './test/spec/webaudioloader.spec.js'
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
  var b = browserify({
    entries: paths.jsentry,
    standalone: pkg.name
  });

  return b.bundle()
    .pipe(source(paths.jssrc))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(rename('webaudioloader.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('standalone', ['browserify'], function () {

  return gulp.src(['dist/webaudioloader.js'])
    .pipe(uglify({mangle: false, preserveComments: 'all'}))
    .pipe(rename('webaudioloader.min.js'))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('jshint:test', function(){

    return gulp.src([paths.testspecs])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('browserify:test',['jshint:test'], function () {

  var b = browserify({
    entries: paths.testspecs,
    debug: true
  });

  return b.bundle()
    .pipe(source(paths.testspecs))
    .pipe(rename('test.js'))
    .pipe(gulp.dest(paths.test));
});

gulp.task('watch:src', function(){
    gulp.watch(paths.jssrc, ['browserify']);
});

gulp.task('watch:test', function(){
    gulp.watch(paths.testspecs, ['browserify:test']);
});

gulp.task('test', ['jshint', 'browserify:test', 'watch:test', 'watch:src'], function(){
    return gulp.src([paths.test, paths.dist])
    .pipe(webserver({
        port: 8080,
        host : "localhost"
    }));
});
