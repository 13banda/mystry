#!/usr/bin/env   node
/**
 * Module dependencies.
 */

var program = require("commander");
const path = require("path");
const csv = require("fast-csv");
const fs = require("fs");
const mysql = require("mysql");
const async = require("async");
const fsExtra = require("fs-extra");
let currentPath = process.cwd();

let resolvePath = path.resolve(process.cwd());
var spinner = require('./spinner');
const config = require("./config");
const { findPincode, exportCSV, parseCSV } = require("./utils");
const CHUNK_LIMIT = 50000;
let outputDirname = config.format.output;
program.version("0.1.0").description("formating the CSV files data");

program
  .command("format")
  .alias("f")
  .description("formating the csv files")
  .option(
    "-o, --outputDirname [type]",
    "Add the specified outputDiractory name like [resolve]",
    outputDirname
  )
  .action(async (options) => {
    spinner.setSpinnerString(3);
    spinner.setSpinnerDelay(200);
    spinner.start();
    let allFiles = [];
    fs.readdirSync(currentPath).forEach((file) => {
      if (config.count.files.includes(path.extname(file)))
        allFiles.push(currentPath + path.sep + file);
    });
    try {
      let p = path.resolve(resolvePath, options.outputDirname);
      console.log("reolved output directory :- ", p);
      console.log("Total Files :- ", allFiles.length);
      await fsExtra.emptyDir(p);
      for (var i = 0; i < allFiles.length; i++) {
          spinner.setSpinnerTitle(
            `file index: ${i + 1} ,parsing ${path.basename(allFiles[i])} file`
          );
          let d = await parseCSV(
            allFiles[i],
            i + 1,
            path.basename(allFiles[i])
          );
          spinner.setSpinnerTitle(
            `file index: ${i + 1} ,formating ${path.basename(allFiles[i])} file`
          );
          d = findPincode(d);
          let r = p + path.sep + path.basename(allFiles[i]);
          spinner.setSpinnerTitle(
            `file index: ${i + 1} ,saving formated ${path.basename(
              allFiles[i]
            )} file`
          );
          await exportCSV(r, d);
      }
      spinner.stop();
      console.log("all Files Done");
      process.exit(-1);
    } catch (e) {
      console.log(e);
    }
  });

program
  .command("upload")
  .alias("u")
  .description("import csv files into mysql")
  .option(
    "-h, --host [type]",
    "MYSQL database host address [default]",
    config.database.host
  )
  .option(
    "-d, --database [type]",
    "database name [default]",
    config.database.name
  )
  .option(
    "-u, --user [type]",
    "datbase user name [default]",
    config.database.user
  )
  .option(
    "-p, --password [type]",
    "database password [default]",
    config.database.password
  )
  .option("-t, --table [type]", "table name [default]", config.database.table)
  .action(async (options) => {
    spinner.setSpinnerString(3);
    spinner.setSpinnerDelay(200);
    spinner.start();
    const pool = mysql.createPool({
      connectionLimit: 10,
      host: options.host,
      user: options.user,
      password: options.password,
      database: options.database,
    });

    let allFiles = [];
    fs.readdirSync(currentPath).forEach((file) => {
      if (config.count.files.includes(path.extname(file)))
        allFiles.push(currentPath + path.sep + file);
    });

    try {
      console.log("Toatal Files :- ", allFiles.length);
      for (var i = 0; i < allFiles.length; i++) {
        if (config.count.files.includes(path.extname(allFiles[i]))) {
          spinner.setSpinnerTitle(
            `file index: ${i + 1} ,parsing & uploading${path.basename(
              allFiles[i]
            )} file`
          );
          await uploadCSV(
            pool,
            allFiles[i],
            i + 1,
            path.basename(allFiles[i]),
            options
          );
          spinner.setSpinnerTitle(
            `file index: ${i + 1} ,uploaded ${path.basename(allFiles[i])} file`
          );
        }
      }
      spinner.stop();
      console.log("all Files uploaded");
      process.exit(-1);
    } catch (e) {
      console.log(e);
    }
  });

program
  .command("count")
  .alias("c")
  .description("count the CSV files")
  .action(function (options) {
    let allFiles = [];
    fs.readdirSync(currentPath).forEach((file) => {
      if (config.count.files.includes(path.extname(file)))
        allFiles.push(currentPath + path.sep + file);
    });

    console.log("Total CSV Files ", allFiles.length);
  });
program.on("command:*", function () {
  console.error(
    "Invalid command: %s\nSee --help for a list of available commands.",
    program.args.join(" ")
  );
  process.exit(1);
});

program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}


async function uploadCSV(pool, filePath, index, filename, options) {
  let globalData = await parseCSV(filePath, index, filename);
  // create a new connection to the database
  pool.getConnection(function (err, connection) {
    if (err) throw err; // not connected!
    let r = 0;
    async.eachSeries(
      globalData.chunk(CHUNK_LIMIT),
      async (data) => {
        // Use the connection
        return new Promise((done) => {
          data = data.map(config["rowToColumn"]);
          spinner.setSpinnerTitle(
            `file index: ${index} ,parsing ${filename} file, total: ${r} current: ${data.length} uploading...`
          );
          r = r + data.length;
          let query =
            "INSERT INTO " +
            options.table +
            " (" +
            config.database.columns.join(",") +
            ") VALUES ?";
          connection.query(query, [data], (error, response) => {
            done();
            if (error) throw error;
            spinner.setSpinnerTitle(
              `file index: ${index} ,parsing ${filename} file, total: ${r} uploaded , uploading...`
            );
          });
        });
      },
      function (err) {
        connection.release();
        resolve();
        if (err) {
          console.log(err);
          console.log("error is occur pls stop uploading...");
        }
      }
    );
  });
}
