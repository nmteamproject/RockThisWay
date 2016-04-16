var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');

var input = './www/ui/scss/*.scss';
var output = './www/ui/css';
var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'compressed'
};

/*
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

gulp.task('watch', function() {
   return gulp
        .watch(input, ['sass'])
        .on('change', function(e) {
            console.log('File ' + e.path + ' was ' + e.type + ', running tasks...');
        });
});

gulp.task('default', ['sass', 'watch']);