#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
const path = require('path')
const csv = require('fast-csv')
const fs = require('fs');
var Spinner = require('cli-spinner').Spinner;

const fsExtra = require('fs-extra')
let currentPath = process.cwd();
let outputDirname = "formated"
let resolvePath = path.resolve(process.cwd());
var spinner = new Spinner();

program
  .version('0.1.0')
  .description('formating the CSV files data')

 program
  .command('format')
  .alias('f')
  .description('formating the csv files')
  .option('-o, --outputDirname [type]', 'Add the specified outputDiractory name like [resolve]', outputDirname)
  .action(async (options) => {
    spinner.setSpinnerString(3)
    spinner.setSpinnerDelay(200)
    spinner.start()
    let allFiles = []
    fs.readdirSync(currentPath).forEach(file => {
      if(path.extname(file) === ".csv")
      allFiles.push(currentPath+path.sep+file);
    });
    try {
        let p = path.resolve(resolvePath,options.outputDirname)
        console.log("reolved output directory :- ",p);
        console.log("Toatal Files :- ", allFiles.length);
        await fsExtra.emptyDir(p)
        for (var i = 0; i < allFiles.length; i++) {
          if(path.extname(allFiles[i]) === ".csv") {
            spinner.setSpinnerTitle(`file index: ${i+1} ,parsing ${path.basename(allFiles[i])} file`);
            let d = await parseCSV(allFiles[i],(i+1),path.basename(allFiles[i]))
            spinner.setSpinnerTitle(`file index: ${i+1} ,formating ${path.basename(allFiles[i])} file`);
            d = findPincode(d);
            let r = p+path.sep+path.basename(allFiles[i]);
            spinner.setSpinnerTitle(`file index: ${i+1} ,saving formated ${path.basename(allFiles[i])} file`);
            await exportCSV(r,d)
          }
        }
        spinner.stop()
        console.log("all Files Done");
        process.exit(-1)
    } catch (e) {
        console.log(e);
    }
  })

    program
     .command('count')
     .alias('c')
     .description('count the CSV files')
     .action(function(options){
       let allFiles = []
       fs.readdirSync(currentPath).forEach(file => {
         if(path.extname(file) === ".csv")
         allFiles.push(currentPath+path.sep+file);
       });

       console.log('Total CSV Files ',allFiles.length);
  })
 program.on('command:*', function () {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);
 if (!process.argv.slice(2).length) {
  program.outputHelp();
}

function findPincode (data) {
 let d = data.map((item,index) => {
    let r = ""
    let e = 17;
     for(var i = 1; i<= 17 ; i++){
       r = r +` ${data[index]["Address"+i]}`
       delete data[index]["Address"+i]
     }

    item["PINCODE"] = r.match(/([0-9]{6})/g) ? r.match(/([0-9]{6})/g)[0] : ""
    r = r.split(' ').filter(function(currentItem,l,allItems){
        return (l == allItems.indexOf(currentItem));
    });
    r = r.join(" ")
    r = r.replace('NULL', '').trim()
    r = r.replace('#VALUE!', '').trim()
    if(r.match(/([0-9]{6})/g)){
       r = r.replace(new RegExp(r.match(/([0-9]{6})/g)[0], "ig"),"").trim()
     }
    item["Address"] = r;
     return item;
   })
   d.sort(function(a, b) {
     return parseInt(a["PINCODE"],10) - parseInt(b["PINCODE"],10);
   });
 return d
}

function exportCSV(path,data) {
  return new Promise(function(resolve, reject) {
    csv
    .writeToStream(fs.createWriteStream(path), data, {headers: true})
    .on("finish", function(){
      resolve()
    });
  });
}

function parseCSV(filePath,index,filename) {
  return new Promise(function(resolve, reject) {
    let i = []
    fs.createReadStream(filePath)
    .pipe(csv.parse({ignoreEmpty: true }))
    .on("data", function(data){
       i.push(data)
       spinner.setSpinnerTitle(`file index: ${index} ,parsing ${filename} file, row-parsed:${i.length}`);
     })
     .on("end", ()=>{
       spinner.setSpinnerTitle(`file index: ${index} ,parsing ${filename} file, loading...`);
        i = i.map((e,index)=>{
          if(index > 0){
            let a = {}
            for(var l=0;l<e.length;l++){
                if(!e[l]){
                  e[l] = ""
                }
            }
            e.forEach((item,index)=>{
              a[(i[0][index])] = item
            })
            return a;
          }
       })
       spinner.setSpinnerTitle(`file index: ${index} ,parsing ${filename} file, done!`);
       resolve(i)
     });
  });
}
