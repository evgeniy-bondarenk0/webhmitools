const fs = require ('fs');
const path = require('path');
const dbfolder = './dbdir/';
const jsonfolder = './jsondir/';

// Code in function ParseDBtoJson get from pacframework-tools
// Source: https://github.com/pupenasan/pacframework-tools
// Author: pupenasan
// Date: 25.03.2024
const ParseDBtoJson = function (dbfolder,jsonfolder, callback) {
  const directoryPath = path.join(__dirname, dbfolder);
  //console.log (directoryPath);
  fs.readdir(directoryPath, function (err, files) {
    var objects = {}; // Об'єкт з усіма знайденими DB
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
            let i=0;
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
              jsonfile[spl1[0].trim()] = {"type": type, "descr": spl3[1].trim()}; 
              i++;
            }
            
            objects[filename] = jsonfile; //Наповнення великого об'єкту
  
            const jsonFilePath = jsonfolder + filename + '.json';
            fs.writeFileSync (jsonFilePath, JSON.stringify(jsonfile));
            //console.log (JSON.stringify(jsonfile)); 
        }
        
      });
      
      callback(objects);
    });
}

const data = require("./data.json")

const devId = 0; // номер девайсу (формування префіксу)
const dbAdress = { // адреса DB в ПЛК
  ACTH:3,
  AIH:4,
  AOH:5,
  DIH:6,
  DOH:7};

const CreateFuxaTags = function(object){
    

  for (let index = 0; index < Object.keys(object).length; index++) {
    var fuxaTag = {}
    const dbName = Object.keys(object)[index]; //Ім'я DB (для прикладу: ACTH, DIH...)
    
    switch (dbName) { // Обираємо яку DB зараз оброблюємо
      case "ACTH": 
        for (let i = 0; i < Object.keys(object[dbName]).length; i++) {
          var elements = Object.keys(object[dbName]);
            
          fuxaTag[`1${dbName}_${elements[i]}_STA`] = {} // Формуємо назву тега для FUXA
          
          // Створити вибір та наповнення в залежності від типу тега, для того щоб правильно порахувати адресу та зміщення байт
          // Порахувати адресу

          console.log(fuxaTag);
        }
        break;
      case "AIH":
        for (let i = 0; i < Object.keys(object[dbName]).length; i++) {
          var elements = Object.keys(object[dbName]);
          console.log(`1${dbName}_${elements[i]}`);
        }
        break;
    
      default:
        break;
    }
    
    


    //data[1].tags[`1${dbName}`] = object[dbName];
    //console.log(data);
  };
  //console.log(data[1].tags.ACT)
}

;

ParseDBtoJson(dbfolder,jsonfolder,CreateFuxaTags);

