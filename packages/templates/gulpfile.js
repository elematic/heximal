'use strict';

let gulp = require('gulp');
let babel = require('gulp-babel');
let es = require('event-stream');
let watch = require('gulp-watch');
let glob = require('glob');

gulp.task('default', ['vendor', 'lib', 'demo']);

gulp.task('demo', function() {
  return es.merge(
    gulp.src('demo/*.js')
        .pipe(babel())
        .pipe(gulp.dest('build/demo')),
    gulp.src('demo/*.html')
        .pipe(gulp.dest('build/demo'))
  );
});

gulp.task('lib', function() {
  return gulp.src('lib/*.js')
      .pipe(babel())
      .pipe(gulp.dest('build/lib'));
});

gulp.task('vendor', ['incremental-dom', 'polymer-expressions', 'requirejs',
    'system.js']);

gulp.task('system.js', function() {
  return gulp.src('node_modules/systemjs/dist/system.js')
    .pipe(gulp.dest('build/vendor/systemjs/'));
});

gulp.task('requirejs', function() {
  return gulp.src('node_modules/requirejs/require.js')
    .pipe(gulp.dest('build/vendor/requirejs/'));
});

gulp.task('incremental-dom', function() {
  return gulp.src('node_modules/incremental-dom/dist/incremental-dom.js')
    .pipe(gulp.dest('build/vendor/incremental-dom/'));
});

gulp.task('polymer-expressions', function() {
  gulp.src('node_modules/polymer-expressions/polymer-expressions.js')
    // .pipe(babel())
    .pipe(gulp.dest('build/vendor/polymer-expressions/'))
});
