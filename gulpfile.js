// General Variables
const {src, dest, series} = require('gulp');
const gulp = require('gulp');
const plumber = require('gulp-plumber');
const del = require('del');
const cache = require('gulp-cache');
const rename = require('gulp-rename');
const server = require('browser-sync').create();

// Fonts Variables
const woff2 = require('gulp-ttftowoff2');

// HTML Variables
const pug = require('gulp-pug');
const pugLint = require('gulp-pug-linter');
const format = require('gulp-format-html');
const bemLint = require('gulp-html-bem-validator');
const w3cHTML = require('gulp-w3cjs');

// CSS Variables
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cssComb = require('gulp-csscomb');
const cssClean = require('gulp-clean-css');
const cssMediaGroup = require('gulp-group-css-media-queries');

// JS Variables
const jsLint = require('gulp-eslint');
const uglify = require('gulp-uglify');

// Image Variables
const imageMin = require('gulp-imagemin');
const imageJPG = require('imagemin-mozjpeg');
const imagePNG = require('imagemin-optipng');

// SVG Variables
const svgSprite = require('gulp-svg-sprite');

// General Functions
function cleaning(done) {
  return del('build').then(() => {
    done();
  });
}

function copyFiles(done) {
  src('src/css/lib/*.css')
      .pipe(dest('build/css/lib'));
  src('src/js/lib/*.js')
      .pipe(dest('build/js/lib'));
  src('src/files/**/*')
      .pipe(dest('build/files'));
  done();
}

// Fonts Functions
function fonts(done) {
  src('src/fonts/*.ttf')
      .pipe(woff2())
      .pipe(dest('build/fonts'));
  done();
}

// HTML Functions
function pugLinter() {
  return src('src/html/**/*.pug')
      .pipe(plumber())
      .pipe(pugLint({reporter: 'default'}));
}

function html() {
  global.watch = true;
  return src('src/html/pages/*.pug')
      .pipe(plumber())
      .pipe(pug())
      .pipe(format(undefined))
      .pipe(bemLint())
      .pipe(w3cHTML())
      .pipe(dest('build'));
}

// CSS Functions
function css() {
  return src('src/css/*.scss')
      .pipe(plumber())
      .pipe(sass.sync().on('error', sass.logError))
      .pipe(autoprefixer({cascade: false}))
      .pipe(cssClean({level: 2}))
      .pipe(cssMediaGroup())
      .pipe(cssComb())
      .pipe(dest('build/css'))
      .pipe(rename({suffix: '.min'}))
      .pipe(cssClean({level: 2}))
      .pipe(dest('build/css'));
}

// JS Functions
function js() {
  return src('src/js/*.js')
      .pipe(plumber())
      .pipe(jsLint())
      .pipe(jsLint.format())
      .pipe(jsLint.failAfterError())
      .pipe(dest('build/js'))
      .pipe(rename({suffix: '.min'}))
      .pipe(uglify())
      .pipe(dest('build/js'));
}

// Image Functions
function img() {
  return src('src/img/**/*.{gif,png,jpg,jpeg,ico,svg}')
      .pipe(cache(imageMin([
        imageJPG({quality: 80, progressive: true}),
        imagePNG({optimizationLevel: 2})])))
      .pipe(dest('build/img'));
}

// SVG Functions
function svg() {
  return src('src/img/svg/*.svg')
      .pipe(svgSprite({
        shape: {
          transform: [{
            'svgo': {
              'plugins': [
                {removeAttrs: {attrs: '(fill|style)'}},
              ],
            },
          }],
        },
        mode: {
          stack: {
            sprite: '../svg/sprite.svg',
          },
        },
      }))
      .pipe(dest('build/img'));
}

// Server Functions
function reload(cb) {
  server.reload(undefined);
  cb();
}

function host(cb) {
  global.watch = true;
  server.init({
    server: 'build',
    notify: false,
    open: true,
    ui: false,
    cors: true,
  });
  gulp.watch('src/fonts', gulp.series(fonts, reload));
  gulp.watch('src/html/**/*.pug', gulp.series(pugLinter, html, reload));
  gulp.watch('src/css/**/*.scss', gulp.series(css, copyFiles));
  gulp.watch('src/files/**/*', gulp.series(copyFiles, reload));
  gulp.watch('src/js/*.js', gulp.series(js, copyFiles, reload));
  gulp.watch('src/img/**/*.{gif,png,jpg,jpeg,ico,svg}', gulp.series(img, reload));
  return cb();
}

exports.build = series(cleaning, copyFiles, fonts, pugLinter, html, css, js, img, svg);
exports.start = series(cleaning, copyFiles, fonts, pugLinter, html, css, js, img, svg, host);
