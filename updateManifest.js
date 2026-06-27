const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'memories');
const output = path.join(dir, 'manifest.json');

fs.readdir(dir, (err, files) => {
  if (err) {
    console.error('Failed to read directory:', err);
    process.exit(1);
  }
  const images = files
    .filter(f => f.toLowerCase().match(/\.(jpe?g|png|gif|webp|svg)$/))
    .map(f => `memories/${f}`)
    .sort();

  fs.writeFile(output, JSON.stringify(images, null, 2), err => {
    if (err) {
      console.error('Unable to write manifest:', err);
      process.exit(1);
    }
    console.log(`Manifest updated with ${images.length} entries.`);
  });
});
