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
var babelify = require('babelify');
var gutil = require('gulp-util');
var gulpIgnore = require('gulp-ignore');

// Settings
var sassInput = './www/ui/scss/*.scss';
var sassOutput = './www/ui/css';
var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'compressed'
};
var jsEntry = './www/js/main.js';
var jsOutput = './www/';
var jsOutputFile = 'bundle.js';
var rootFiles = ['./www/**/*', '!./www/*.js'];

/**
 * Compile our sass
 * Run autoprefixer on the result (adds vendor prefixes)
 */
gulp.task('sass', function() {
   return gulp
        .src(sassInput)
        .pipe(sourcemaps.init())
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(autoprefixer())
        .pipe(gulp.dest(sassOutput)); 
});


/**
 * Watch our browserify modules
 * before we bundle, transform es6 modules to es5
 * bundle and output to bundle.js
 * and uglify the result
 */
var customOpts = {
    entries: [jsEntry],
    debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

gulp.task('javascript-watch', bundle);
b.on('update', bundle);
b.on('log', gutil.log);

function bundle() {
    return b.transform(babelify, {presets: ['es2015']})
        .bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(jsOutputFile))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            //.pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(jsOutput));
}

/**
 * Bundle our js without watching
 */
gulp.task('javascript', bundleNormal);
var b2 = browserify(customOpts);

function bundleNormal() {
    return b2.transform(babelify, {presets: ['es2015']})
        .bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(jsOutputFile))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
            //.pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(jsOutput));
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
gulp.task('build', ['sass', 'javascript'], function(callback) {
    cordova.run({
        'platforms': ['ios'],
        'options': {
            argv: ['--release','--gradleArg=--no-daemon']
        }
    }, callback);
});

/**
 * Build for browser
 */
gulp.task('cordova-browser', function(callback) {
    cordova.build({
        'platforms': ['browser'],
        'options': {
            argv: ['--release','--gradleArg=--no-daemon']
        }
    }, callback);
});


/**
 * watch for browser changes
 * CURRENTLY NOT WORKING (Infinitely loops..)
 */
gulp.task('cordova-watch', function() {
   gulp.watch('./www/bundle.js', ['cordova-browser'])
});

/**
 * Watch our sass and javascript
 */
gulp.task('watch', ['javascript-watch', 'cordova-watch'], function() {
   return gulp
        .watch(sassInput, ['sass'])
        .on('change', function(e) {
            console.log('File ' + e.path + ' was ' + e.type + ', running tasks...');
        })
});

gulp.task('default', ['sass', 'javascript', 'watch']);