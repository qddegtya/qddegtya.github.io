#!/usr/bin/env node

const pangu = require("pangu");
const vfs = require("vinyl-fs");
const map = require("map-stream");
const path = require("path");
const CWD = process.cwd();

const __markdown_root = path.resolve(path.join(CWD, "_posts"));

vfs
  .src([`${__markdown_root}/**/*.*`])
  .pipe(
    map((file, cb) => {
      const formatted = pangu.spacingFileSync(file.path);

      // log
      console.log(formatted);

      // format
      file.contents = Buffer.from(pangu.spacingFileSync(file.path), "utf8");

      // callback
      cb(null, file);
    })
  )
  .pipe(vfs.dest(path.join(__markdown_root)));
