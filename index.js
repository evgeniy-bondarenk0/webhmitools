const fs = require ('fs');
const readline = require('readline');
const path = require('path');
const dbfolder = './dbdir/';
const jsonfolder = './jsondir/';

var data = require("./data.json")
var tags = {}; // об'єкт для тегів FUXA

var prefix = 0; // номер девайсу (формування префіксу)
var dbAdress = {}; // об'єкт для адрес DB

// Створюємо інтерфейс для вводу з консолі
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Функція для запиту адреси DB у користувача
const askForDbAddress = async (dbTypes) => {
  const dbAdress = {};
  for (const dbType of dbTypes) {
    await new Promise((resolve) => {
      rl.question(`Введіть адресу для DB типу ${dbType}: `, (input) => {
        dbAdress[dbType] = parseInt(input, 10); // Зберігаємо адресу як число
        resolve();
      });
    });
  }
  return dbAdress;
};

// Функція для запиту prefix у користувача
const askForPrefix = async () => {
  return new Promise((resolve) => {
    rl.question('Введіть номер установки (prefix): ', (input) => {
      resolve(parseInt(input, 10)); // Зберігаємо prefix як число
    });
  });
};

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

const CreateFuxaTags = function(object){
    

  for (let index = 0; index < Object.keys(object).length; index++) {
    var fuxaTag = {}
    const dbName = Object.keys(object)[index]; //Ім'я DB (для прикладу: ACTH, DIH...)
    
    switch (dbName) { // Обираємо яку DB зараз оброблюємо
      case "ACTH": 
        for (let i = 0; i < Object.keys(object[dbName]).length; i++) {
          var elements = Object.keys(object[dbName]);
            
          fuxaTag[`${prefix}${dbName}_${elements[i]}_STA`] = {} // Формуємо назву тега для FUXA
          

        }
        break;
      case "AIH":
        var y = -6; // Зміщення для STA
        var u = 0; // Зміщення для VAL

        for (let i = 0; i < Object.keys(object[dbName]).length; i++) {
          
          var elements = Object.keys(object[dbName]);
          
          fuxaTag[`${prefix}${dbName}_${elements[i]}_STA`] = { // Формуємо тег AIH_STA
            "id": `${prefix}${elements[i]}_STA`,
            "daq": {
              "restored": false,
              "enabled": false,
              "changed": false,
              "interval": 60
            },
            "name": `${prefix}${dbName}_${elements[i]}_STA`,
            "type": "DWord",
            "address": adress = `db${dbAdress.AIH}.dbw${y + 8}`,
            "description": object[dbName][elements[i]].descr
          }
          y=y + 8;
          
          fuxaTag[`${prefix}${dbName}_${elements[i]}_VAL`] = { // Формуємо тег AIH_VAL
            "id": `${prefix}${elements[i]}_VAL`,
            "daq": {
              "restored": false,
              "enabled": false,
              "changed": false,
              "interval": 60
            },
            "name": `${prefix}${dbName}_${elements[i]}_VAL`,
            "type": "Real",
            "address": adress = `db${dbAdress.AIH}.dbd${u + 8}`,
            "description": object[dbName][elements[i]].descr
          }
          u=u + 8;
        
          tags = {...tags, ...fuxaTag}; // Додаємо теги в загальний об'єкт tags
                 
        };
        break;
        
      default:
        break;
        
    }
    
  };

};


// ParseDBtoJson(dbfolder, jsonfolder, function (objects) {
//   // Викликаємо CreateFuxaTags і передаємо об'єкт
//   CreateFuxaTags(objects);

//   data[1].tags = tags; // Додаємо теги в загальний об'єкт data

//   fs.writeFileSync('./new.json', JSON.stringify(data, null, 2), 'utf8');
//   console.log("Оновлений data збережено у файл.");
// });


fs.readdir(path.join(__dirname, dbfolder), async function (err, files) {

  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  // Визначаємо типи DB за назвами файлів
  const dbTypes = files
    .filter((file) => path.extname(file) === '.db') // Фільтруємо тільки файли з розширенням .db
    .map((file) => path.basename(file, '.db')); // Отримуємо назви файлів без розширення

  console.log('Знайдені типи DB:', dbTypes);

  // Запитуємо адреси для кожного типу DB
  dbAdress = await askForDbAddress(dbTypes);

  // Запитуємо prefix
  prefix = await askForPrefix();
  console.log('Введений prefix:', prefix);

 // Після отримання адрес виконуємо основну логіку
 ParseDBtoJson(dbfolder, jsonfolder, function (objects) {
  // Викликаємо CreateFuxaTags і передаємо об'єкт
  CreateFuxaTags(objects);

  data[1].tags = tags; // Додаємо теги в загальний об'єкт data

  fs.writeFileSync('./new.json', JSON.stringify(data, null, 2), 'utf8');
  console.log("Оновлений data збережено у файл.");
  
});

  rl.close(); // Закриваємо інтерфейс readline
});

