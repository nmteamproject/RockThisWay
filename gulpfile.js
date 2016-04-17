// Plugins
var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var cordova = require('cordova-lib').cordova;
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var assign = require('lodash.assign');
var watchify = require('watchify');

// Settings
var input = './www/ui/scss/*.scss';
var output = './www/ui/css';
var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'compressed'
};

/**
 * Compile our sass
 */
gulp.task('sass', function() {
   return gulp
        .src(input)
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer())
        .pipe(gulp.dest(output)); 
});

/**
 * Watch our sass
 */
gulp.task('watch', ['javascript'], function() {
   return gulp
        .watch(input, ['sass'])
        .on('change', function(e) {
            console.log('File ' + e.path + ' was ' + e.type + ', running tasks...');
        });
});

/**
 * Bundle our browserify modules
 * and uglify the result
 */
gulp.task('javascript', bundle);
var customOpts = {
    entries: ['./www/js/main.js'],
    debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

b.on('update', bundle);

function bundle() {
    return b.bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./www/js/'));
}

/**
 * Build cordova for iOS
 */
gulp.task('cordova-build', function(callback) {
    cordova.build({
        'platforms': ['ios'],
        'options': {
            argv: ['--release','--gradleArg=--no-daemon']
        }
    }, callback);
});

/**
 * Run cordova for iOS
 * Compiles sass first
 */
gulp.task('cordova', ['sass'], function(callback) {
    cordova.run({
        'platforms': ['ios'],
        'options': {
            argv: ['--release','--gradleArg=--no-daemon']
        }
    }, callback);
});

gulp.task('default', ['sass', 'watch']);