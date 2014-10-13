var gulp = require('gulp');

gulp.task('default', function() {
  // place code for your default task here
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
