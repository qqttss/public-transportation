var gulp = require('gulp');

var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssnano');
var browserSync = require('browser-sync');

var babelify = require('babelify');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

gulp.task('js-babel', function () {
    var bundler = browserify('./app/js/main.js');
    bundler.transform(babelify, {presets: ["es2015"]});

    bundler.bundle()
        .on('error', function (err) { console.error(err); })
        .pipe(source('./app/js/main.js'))
        .pipe(buffer())
        .pipe(rename('main-babel.js'))
        .pipe(gulp.dest('./app/js'));
});

// lint task
gulp.task('lint', function() {
    return gulp.src('./app/js/main-babel.js')
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('scripts-dist', function() {
    gulp.src('./app/js/main-babel.js')
        .pipe(uglify())
        .pipe(rename('main.min.js'))
        .pipe(gulp.dest('./dist/js'));
});

gulp.task('css-min', function () {
    gulp.src('./app/css/*.css')
        .pipe(cssmin())
        .pipe(rename('styles.min.css'))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('copy-html', function() {
    gulp.src('./index.html')
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-jsFiles', function() {
    gulp.src('./app/js/lib/handlebars.min.js')
        .pipe(gulp.dest('./dist/js/lib'));
});

gulp.task('copy-images', function() {
    gulp.src('./app/images/**')
        .pipe(gulp.dest('./dist/images'));
});

//default task
gulp.task('default', ['js-babel', 'lint', 'scripts-dist', 'css-min', 'copy-html', 'copy-jsFiles', 'copy-images']);
