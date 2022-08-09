import gulp from 'gulp';
import gulpif from 'gulp-if';

// for css
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer'; // add vendor prefix
import sourcemaps from 'gulp-sourcemaps'; 
import tailwindcss from 'tailwindcss';
import purgecss from 'gulp-purgecss'; // remove unused css
import cleanCSS from 'gulp-clean-css';

// for image
import imagemin from "gulp-imagemin";

// for js
import babel from 'gulp-babel'; // es5 to es6        
import uglify from "gulp-uglify";

// for live sever
import browserSync from 'browser-sync';
const server = browserSync.create();

// for zip
import project from "./package.json" assert { type: 'json'};
import zip from 'gulp-zip';

// for yargs ( for argument values from npm script )
import yargs from 'yargs';
const PRODUCTION = yargs(process.argv.slice(2)).env().argv.prod;

// src & destination paths
const paths = {
    // for stylesheet
    styles: {
      src: 'src/assets/css/style.css',
      dest: 'dist/assets/css'
    },
    // for images
    images: {
      src: ['src/assets/images/*.{jpg,jpeg,png,gif,svg}', 'src/assets/images/**/*.{jpg,jpeg,png,gif,svg}'],
      dest: 'dist/assets/images'
    },
    // path for js
    js: {
      src: ['src/assets/js/**/*.js'],
      dest: 'dist/assets/js'
    },
    // for copying file from src to dest
    copyAssets: {
      // src: 'src/**/*',
      src: ['src/**/*.html'],
      dest: 'dist/'
    },
    copyCss: {
      src: ['src/assets/css/*.css', '!src/assets/css/tailwind.css'],
      dest: 'dist/assets/css/'
    },
    package: {
      // src: ['**/*', '!node_modules{,/**}', '!src{,/**}', '!gitignore', '!.babelrc', '!gulpfile.babel.js', '!package-lock.json', '!package.json', '!tailwind.config.cjs'], // customise it
      src: ['dist/**/*'], // customise it
      dest: 'finalproject' // customise it
    }
  }

// styles task
export const styles = () => {
  return gulp.src(paths.styles.src)
  .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(postcss([
      tailwindcss(),
      autoprefixer({
          'browsers': ['last 2 versions'],
          'cascade': false
        })
      ]
    ))
    .pipe(purgecss({
        content: ['src/**/*.html']
    })) // remove unused css
    .pipe(gulpif(PRODUCTION, cleanCSS({compatibility: 'ie8'})))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(server.stream())
}

// image task
export const images = () => {
  return gulp.src(paths.images.src)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.images.dest))
}

// js task
export const js = () => {
  return gulp.src(paths.js.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulpif(PRODUCTION, uglify()))
    .pipe(gulp.dest(paths.js.dest))
}

// copy assets 
export const copyAssets = () => {
  return gulp.src(paths.copyAssets.src)
    .pipe(gulp.dest(paths.copyAssets.dest))
}

// copy css
export const copyCss = () => {
  return gulp.src(paths.copyCss.src)
    .pipe(gulp.dest(paths.copyCss.dest))
}

// static server
export const staticServer = (done) => {
  server.init({
    server: {
        baseDir: "./src"
    }
  });
  done();
}

// browser reload
export const reload = (done) => {
  server.reload();
  done();
}

// compress task
export const compress = () => {
  return gulp.src(paths.package.src)
    .pipe(zip(`${project.name}.zip`)) 
    .pipe(gulp.dest(paths.package.dest))
}

// monitor task
export const monitor = () => {
  gulp.watch(paths.copyAssets.src, gulp.series(copyAssets, reload));
  gulp.watch(paths.styles.src, gulp.series(styles, reload));
  gulp.watch(paths.js.src, gulp.series(js, reload));
  gulp.watch(paths.images.src, gulp.series(images, reload));
}

// task serialize
export const dev = gulp.series(gulp.parallel(styles, js, images, copyAssets, copyCss), staticServer, monitor); // for development
export const build = gulp.series(gulp.parallel(styles, js, images, copyAssets, copyCss)); // for production
export const bundle = gulp.series(build, compress); // for final zipped 

// default task
export default dev;


