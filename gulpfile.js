var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var traceur = require('gulp-traceur');
var uglify = require('gulp-uglify');

gulp.task('compile', function(){
  return gulp.src('src/**/*.js')
    .pipe(traceur({experimental: true, blockBinding: true, arrayComprehension: true}))
    .pipe(gulp.dest('build'));
});

gulp.task('build', function() {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(traceur({experimental: true, blockBinding: true, arrayComprehension: true}))
    .pipe(concat('angular-cesium.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
});

gulp.task('dist', function () {
  return gulp.src('src/**/*.js')
    .pipe(traceur({experimental: true, blockBinding: true, arrayComprehension: true}))
    .pipe(concat('angular-cesium.min.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['compile', 'build', 'dist']);

gulp.watch('src/**/*.js', ['default']);
