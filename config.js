module.exports = {
    "database": {
        "host": "localhost",
        "name": "mumbai",
         "user": "root",
         "password": "",
         "table": "data",
         "columns": ["name","mobile","address","altno","pincode"]
    },
    "count": {
        "files": [".csv",".xlx",".xlsx"]
    },
    "format":{
        output: "formated"
    },
    "rowToColumn": (item) => {
        let address = item["Add1"] || item["Add2"] || item["Address"]
        if(!address){
          address = ""
        }
        let d = {
          name: item["Name"],
          mobile: item["Mobile"],
          address: address,
          altno: item["Alt"],
          pincode: address.match(/(4[0-9]{5})/g) ? address.match(/(4[0-9]{5})/g)[0] : item["Pincode"],
        }
        return Object.values(d)
      }
}