'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const es = require('event-stream');

const _babel = (moduleType) => babel({
  presets: ["es2015"],
  plugins: [`transform-es2015-modules-${moduleType}`],
});

const _build = (dir) => gulp.src(`${dir}/**`)
    .pipe(gulpif(/\.js$/, _babel('commonjs')))
    .pipe(gulp.dest(`build/${dir}`));

const dist = (moduleType) =>
    () => es.merge(jsDist(moduleType), minDist(moduleType))
        .pipe(gulp.dest('.'));

const jsDist = (moduleType) => compileJs(moduleType)
    .pipe(concat('polymer-expressions.js'));

const minDist = (moduleType) => compileJs(moduleType)
    .pipe(concat('polymer-expressions.min.js'))
    .pipe(uglify({
      compress: true,
      minify: {
        sort: true,
      },
    }));

const compileJs = (moduleType) => gulp.src(['src/parser.js', 'src/eval.js'])
    .pipe(_babel(moduleType));

gulp.task('default', ['bower']);

gulp.task('build', () => es.merge(_build('src'), _build('test')));

gulp.task('bower', dist('amd'));

gulp.task('npm', dist('commonjs'));
