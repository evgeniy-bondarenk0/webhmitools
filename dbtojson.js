const fs = require ('fs');
const path = require('path');
const dbfolder = './dbdir/';
const jsonfolder = './jsondir/';

// const dbAddr = typeof process.argv[2] === "undefined" || process.argv[2] === null ? 1 : process.argv[2];

// console.log(dbAddr);


var objects = {}; // Об'єкт з усіма знайденими DB

const directoryPath = path.join(__dirname, dbfolder);
//console.log (directoryPath);
fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        if (path.extname(file)==='.db') { 
          let fileContent = fs.readFileSync(path.join(directoryPath, file), "utf8");
          let filename =  path.basename (file, '.db');
          let ar =  fileContent.split('\n');
          let i=0, adr=0;
          let jsonfile = {};
          do {
            row = ar[i];
            i++;
          } while (row.trim()!=='STRUCT' && i< ar.length);
          while (ar[i].trim()!=='END_STRUCT;' && i< ar.length) {
            row = ar[i].trim();
            let spl1 = row.split(':');
            let spl2 = spl1[1].split(';');
            let spl3 = spl2[1].split('//');
            let type = spl2[0].trim().replace(/"/g,'');
            jsonfile[spl1[0].trim()] = {"type": type, "descr": spl3[1].trim(), "adr": adr}; 
            i++;
            switch (type) {
              case 'DOVAR_HMI':
              case 'DIVAR_HMI':   
                adr += 1; //in words
                break;
              case 'AOVAR_HMI':
              case 'AIVAR_HMI':
                adr += 4;              
              default:
                break;
            }
          }
          
          objects[filename] = jsonfile;

          const jsonFilePath = jsonfolder + filename + '.json';
          fs.writeFileSync (jsonFilePath, JSON.stringify(jsonfile));
          //console.log (JSON.stringify(jsonfile)); 

      }
      //console.log(objects)
      // const objectsFile = jsonfolder + 'bigjson.json';
      // fs.writeFileSync (objectsFile, JSON.stringify(objects));
    });
});

