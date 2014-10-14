var gulp = require('gulp');
var zip = require('gulp-zip');

gulp.task('default', ['package'], function() {
  // place code for your default task here
});

gulp.task('package', function() {
  return gulp.src(['./*', 'vendor/*', '!archive.zip', '!gulpfile.js', '!package.json'], { base: '.' })
    .pipe(zip('archive.zip'))
    .pipe(gulp.dest('.//'));
});

gulp.task('vendor', ['vendor-rtc', 'vendor-rtc-ios']);

gulp.task('vendor-rtc', function() {
  return gulp
    .src('node_modules/rtc/dist/*')
    .pipe(gulp.dest('vendor/'));
});

gulp.task('vendor-rtc-ios', function() {
  return gulp
    .src('node_modules/rtc-plugin-nicta-ios/dist/*')
    .pipe(gulp.dest('vendor/'));
});
