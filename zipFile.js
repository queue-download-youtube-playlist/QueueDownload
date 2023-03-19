//Step 1 - require modules
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

//Step 2 - create a file to stream archive data to
let dirRootName = path.basename(__dirname);
const output = fs.createWriteStream(__dirname + `/${dirRootName}.zip`);
const archive = archiver('zip', {
  zlib: {level: 9},
});

//Step 3 - callbacks
output.on('close', () => {
  console.log('Archive finished.');
});

archive.on('error', (err) => {
  throw err;
});

//Step 4 - pipe and append files
archive.pipe(output);
// const text1 = path.join(__dirname, 'file1.txt');
// const text2 = path.join(__dirname, 'file2.txt');
// archive.append(fs.createReadStream(text1), { name: 'newfile1.txt' });
// archive.append(fs.createReadStream(text2), { name: 'newfile2.txt' });

const arrFolder = ['icons', 'js', 'option'];
// const arrFolder = ['icons', 'js'];

arrFolder.forEach(folderName => {
  fs.readdirSync(path.join(__dirname, folderName)).forEach(value => {
    console.log(`${folderName}/${value}`);
    archive.append(fs.createReadStream(
        path.join(__dirname, folderName, value),
    ), {name: value, prefix: folderName});
  });
});
// const arrFile = ['manifest.json', 'options.html','options.css','options.js']
const arrFile = ['manifest.json'];
arrFile.forEach(item => {
  console.log(`${item}`);
  archive.append(fs.createReadStream(
      path.join(__dirname, item),
  ), {name: item});
});

//Step 5 - finalize
archive.finalize();

