var spinner = require('./spinner');
const csv = require("fast-csv");
const fs = require("fs");
/**
 * add chunk function in array
 */
Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
      var R = [];
      for (var i = 0; i < this.length; i += chunkSize)
        R.push(this.slice(i, i + chunkSize));
      return R;
    }
  });

  /**
 * Parsing csv file
 * @param {string} filePath
 * @param {Number} index
 * @param {String} filename
 * @returns {[object]}
 */
function parseCSV(filePath, index, filename) {
    return new Promise(function (resolve, reject) {
      let i = [];
      fs.createReadStream(filePath)
        .pipe(csv.parse({ ignoreEmpty: true }))
        .on("data", function (data) {
          i.push(data);
          spinner.setSpinnerTitle(
            `file index: ${index} ,parsing ${filename} file, row-parsed:${i.length}`
          );
        })
        .on("end", () => {
          spinner.setSpinnerTitle(
            `file index: ${index} ,parsing ${filename} file, loading...`
          );
          let globalData = [];
          i.forEach((e, index) => {
            if (index > 0) {
              let a = {};
              for (var l = 0; l < e.length; l++) {
                if (!e[l]) {
                  e[l] = "";
                }
              }
              e.forEach((item, index) => {
                if (i[0][index] !== "") {
                  a[i[0][index]] = item;
                }
              });
              globalData.push(a);
            }
          });
          spinner.setSpinnerTitle(
            `file index: ${index} ,parsing ${filename} file, done!`
          );
  
          resolve(globalData);
        });
    });
  }


function exportCSV(path, data) {
    return new Promise(function (resolve, reject) {
      csv
        .writeToStream(fs.createWriteStream(path), data, { headers: true })
        .on("finish", function () {
          resolve();
        });
    });
  }
  
  /**
   * find pin code columns and format it
   * @param {Object[]} data 
   */
  function findPincode (data) {
    let d = data.map((item,index) => {
       let r = ""
       let e = 17;
        for(var i = 1; i<= 17 ; i++){
          r = r +` ${data[index]["Address"+i]}`
          delete data[index]["Address"+i]
        }
   
       item["PINCODE"] = r.match(/(4[0-9]{5})/g) ? r.match(/(4[0-9]{5})/g)[0] : ""
       r = r.split(' ').filter(function(currentItem,l,allItems){
           return (l == allItems.indexOf(currentItem));
       });
       r = r.join(" ")
       r = r.replace('NULL', '').trim()
       r = r.replace('#VALUE!', '').trim()
       if(r.match(/(4[0-9]{5})/g)){
          r = r.replace(new RegExp(r.match(/(4[0-9]{5})/g)[0], "ig"),"").trim()
        }
       item["Address"] = r;
        return item;
      })
      d.sort(function(a, b) {
        return parseInt(a["PINCODE"],10) - parseInt(b["PINCODE"],10);
      });
    return d
   }
   

   module.exports = {
       findPincode,
       parseCSV,
       exportCSV
   }