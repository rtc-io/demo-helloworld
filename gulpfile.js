var gulp = require('gulp-help')(require('gulp'));
var zip = require('gulp-zip');
var gutil = require('gulp-util');
var st = require('st');
var http = require('http');
var port = process.env.PORT || 3000;

gulp.task('serve', 'Serve the local files using a development server', function(cb) {
  var mount = st({
    path: process.cwd(),
    index: 'index.html',
    cache: false
  });

  http.createServer(mount).listen(port, function(err) {
    if (! err) {
      gutil.log('server running @ http://localhost:' + port + '/');
    }

    cb(err);
  });
});

gulp.task('package', 'Package for upload to build.rtc.io', function() {
  return gulp.src([
    './*',
    '!*.zip',
    '!*.ipa',
    'vendor/*',
    '!vendor/*.zip',
    'css/*',
    '!css/*.zip',
    'icons/*',
    '!icons/*.zip',
    '!gulpfile.js',
    '!package.json'
  ], { base: '.' })
  .pipe(zip('archive.zip'))
  .pipe(gulp.dest('.//'));
});

gulp.task('vendor', 'Rebuild vendor scripts from node package dependencies', [
  'vendor-rtc',
  'plugin-ios',
  'plugin-temasys'
]);

gulp.task('vendor-rtc', function() {
  return gulp
    .src('node_modules/rtc/dist/*')
    .pipe(gulp.dest('vendor/'));
});

gulp.task('plugin-ios', function() {
  return gulp
    .src('node_modules/rtc-plugin-nicta-ios/dist/*')
    .pipe(gulp.dest('vendor/'));
});

gulp.task('plugin-temasys', function() {
  return gulp
    .src('node_modules/rtc-plugin-temasys/dist/*')
    .pipe(gulp.dest('vendor/'));
});
