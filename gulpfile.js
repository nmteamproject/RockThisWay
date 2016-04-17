// Plugins
var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var cordova = require('cordova-lib').cordova;

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
gulp.task('watch', function() {
   return gulp
        .watch(input, ['sass'])
        .on('change', function(e) {
            console.log('File ' + e.path + ' was ' + e.type + ', running tasks...');
        });
});

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