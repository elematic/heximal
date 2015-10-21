'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

gulp.task('default', ['minify']);

gulp.task('js', () => js()
    .pipe(concat('polymer-expressions.js'))
    .pipe(gulp.dest('.')));

gulp.task('minify', () => js()
    .pipe(concat('polymer-expressions.min.js'))
    .pipe(uglify({
      compress: true,
      minify: {
        sort: true,
      },
    }))
    .pipe(gulp.dest('.')));

let js = () => gulp.src(['src/parser.js', 'src/eval.js'])
    .pipe(babel({
      modules: 'amd',
      moduleRoot: 'polymer-expressions',
      sourceRoot: 'src',
      moduleIds: true,
      experimental: true,
      loose: [
        'es6.classes',
        'es6.destructuring',
        'es6.forOf',
        'es6.modules',
        'es6.properties.computed',
        'es6.spread',
        'es6.templateLiterals',
      ],
      optional: [
        'minification.constantFolding',
        // this is causing an error in babel :(
        // 'minification.deadCodeElimination',
        'minification.memberExpressionLiterals',
        'minification.propertyLiterals',
      ],
    }));
