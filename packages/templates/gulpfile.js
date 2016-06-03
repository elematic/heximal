'use strict';

const depcheck = require('depcheck');
const mergeStream = require('merge-stream');
const fs = require('fs-extra');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const path = require('path');
const rename = require('gulp-rename');
const runSeq = require('run-sequence');
const stream = require('stream');
const tslint = require('gulp-tslint');
const typescript = require('gulp-typescript');
const typings = require('gulp-typings');
const uglify = require('gulp-uglify');

const npmProject = typescript.createProject('tsconfig.json');
const bowerProject = typescript.createProject('tsconfig.json', {
  target: 'es5',
  module: 'amd',
  outFile: './stampino.js',
  outDir: '',
  rootDir: './src',
});

gulp.task('init', () => gulp.src("./typings.json").pipe(typings()));

gulp.task('lint', ['tslint', 'eslint', 'depcheck']);

gulp.task('build-npm', () => {
  let tsResult = npmProject.src().pipe(typescript(npmProject));
  return mergeStream(tsResult.js, tsResult.dts).pipe(gulp.dest('lib/'));
});

gulp.task('build-bower', () => {
  let compileResult = bowerProject.src().pipe(typescript(bowerProject));
  let unminifiedResult = new ForkedVinylStream(compileResult);
  let minifiedResult = new ForkedVinylStream(compileResult);

  return mergeStream(
  	unminifiedResult,
    compileResult.dts,
    minifiedResult
      .pipe(uglify({
          compress: true,
          minify: {
            sort: true,
          },
        }))
      .pipe(rename('stampino.min.js')))
    .pipe(gulp.dest('.'));
});

gulp.task('build', ['build-npm', 'build-bower']);

gulp.task('clean', () => {
  fs.removeSync(path.join(__dirname, 'lib'));
  fs.removeSync(path.join(__dirname, 'stampino.js'));
  fs.removeSync(path.join(__dirname, 'stampino.min.js'));
});

gulp.task('build-all', (done) => {
  runSeq('clean', 'init', 'lint', 'build', done);
});

gulp.task('test', ['build-npm'], () =>
  gulp.src('test/**/*_test.js', {read: false})
      .pipe(mocha({
        ui: 'tdd',
        reporter: 'spec',
      }))
);

gulp.task('tslint', () =>
  gulp.src('src/**/*.ts')
    .pipe(tslint({
      configuration: 'tslint.json',
    }))
    .pipe(tslint.report('verbose')));

gulp.task('eslint', () =>
  gulp.src('test/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('depcheck', () => new Promise((resolve, reject) => {
  depcheck(__dirname, {ignoreDirs: []}, (result) => {
    let invalidFiles = Object.keys(result.invalidFiles) || [];
    let invalidJsFiles = invalidFiles.filter((f) => f.endsWith('.js'));
    if (invalidJsFiles.length > 0) {
      console.log('Invalid files:', result.invalidFiles);
      reject(new Error('Invalid files'));
      return;
    }

    if (result.dependencies.length) {
      console.log('Unused dependencies:', unused.dependencies);
      reject(new Error('Unused dependencies'));
      return;
    }

    resolve();
  });
}));

/**
 * Forks a stream of Vinyl files, cloning each file before emitting on the fork.
 */
class ForkedVinylStream extends stream.Readable {

  constructor(input) {
    super({objectMode: true});
    this.input = input;
    input.on('data', (file) => {
      this.push(file.clone({deep: true, contents: true}));
    });
    input.on('end', () => {
      this.push(null);
    });
    input.on('error', (e) => {
      this.emit('error', e);
    });
  }

  _read(size) {
    // apparently no-op is fine, but this method is required,
    // see: https://nodejs.org/api/stream.html#stream_readable_read_size_1
  }
}


// let gulp = require('gulp');
// let babel = require('gulp-babel');
// let es = require('event-stream');
// let watch = require('gulp-watch');
// let glob = require('glob');

// gulp.task('default', ['vendor', 'lib', 'demo']);
//
// gulp.task('demo', function() {
//   return es.merge(
//     gulp.src('demo/*.js')
//         .pipe(babel())
//         .pipe(gulp.dest('build/demo')),
//     gulp.src('demo/*.html')
//         .pipe(gulp.dest('build/demo'))
//   );
// });
//
// gulp.task('dist', ['lib'], function() {
//   return gulp.src('lib/stampino.js')
//       .pipe(babel())
//       .pipe(gulp.dest(''));
// });
//
// gulp.task('lib', function() {
//   return gulp.src('lib/*.js')
//       .pipe(babel())
//       .pipe(gulp.dest('build/lib'));
// });

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
    .pipe(gulp.dest('build/vendor/polymer-expressions/'))
});
