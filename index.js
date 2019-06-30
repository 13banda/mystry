#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('commander');
const path = require('path')
const csv = require('fast-csv')
const fs = require('fs');
const fsExtra = require('fs-extra')
let currentPath = process.cwd();
let outputDirname = "mystry-resolve"
let resolvePath = path.resolve(process.cwd(),"..");
program
  .version('0.1.0')
  .description('mystry to resolve the pincode from files')

 program
  .command('resolve')
  .alias('s')
  .description('solve the the pincode mystry')
  .option('-o, --outputDirname [type]', 'Add the specified outputDiractory name like [mystry-resolve]', outputDirname)
  .action(function(options){
  console.log('your mystry resolved :');
    let allFiles = []
    fs.readdirSync(currentPath).forEach(file => {
      allFiles.push(currentPath+path.sep+file);
    });
    try {
      (async ()=> {
        let p = path.resolve(resolvePath,options.outputDirname)
        console.log("reolved output directory :- ",p);

        await fsExtra.emptyDir(p)
        for (var i = 0; i < allFiles.length; i++) {
          if(path.extname(allFiles[i]) === ".csv") {
            let d = await parseCSV(allFiles[i])
            d = findPincode(d);
            let r = p+path.sep+path.basename(allFiles[i]);
            console.log(path.basename(allFiles[i]));
            await exportCSV(r,d)
          }
        }
        console.log("all Files Done");
      })()

    } catch (e) {

    } finally {

    }
  })

    program
     .command('count')
     .alias('c')
     .description('count the mystry files')
     .action(function(options){
       let allFiles = []
       fs.readdirSync(currentPath).forEach(file => {
         if(path.extname(file) === ".csv")
         allFiles.push(currentPath+path.sep+file);
       });

       console.log('Total mystry Files ',allFiles.length);
  })
program.parse(process.argv);


function findPincode (data) {
 let d = data.map((item,index) => {
   let r = ""
   let e = 17;
   for(var i = 1; i<= 17 ; i++){
     r = r +` ${data[index]["Address"+i]}`
   }
   item["PINCODE"] = r.match(/([0-9]{6})/g) ? r.match(/([0-9]{6})/g)[0] : ""
   return item;
 })
 return d
}

function exportCSV(path,data) {
  return new Promise(function(resolve, reject) {
    csv
    .writeToPath(path, data, {headers: true})
    .on("finish", function(){
      resolve()
    });
  });
}

function parseCSV(filePath) {
  return new Promise(function(resolve, reject) {
    let i = []
    csv
     .fromPath(filePath,{ignoreEmpty: true})
     .on("data", function(data){
       i.push(data)
     })
     .on("end", ()=>{
       let globalData = []
        i.forEach((e,index)=>{
          if(index > 0){
            let a = {key:globalData.length+index+1}
            a.sent = 'false'
            for(var l=0;l<e.length;l++){
                if(!e[l]){
                  e[l] = ""
                }
            }
            e.forEach((item,index)=>{
              a[(i[0][index])] = item
            })
            a.key = globalData.length+1;
              globalData.push(a)
          }
       })
       i = []
       resolve(globalData)
     });
  });
}
