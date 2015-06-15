var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

gulp.task('default', function () {
  return gulp.src(['src/parser.js', 'src/eval.js'])
      .pipe(babel({
        modules: 'amd',
        moduleRoot: 'polymer-expressions',
        sourceRoot: 'src',
        moduleIds: true,
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
          'minification.deadCodeElimination',
          'minification.memberExpressionLiterals',
          'minification.propertyLiterals',
        ],
      }))
      .pipe(concat('polymer-expressions.min.js'))
      .pipe(uglify({
        compress: true,
        minify: {
          sort: true,
        },
      }))
      .pipe(gulp.dest('.'));
});
