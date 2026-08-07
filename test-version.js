const fs = require('fs');
const path = require('path');
function search(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) search(full);
    else if (full.endsWith('.js')) {
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((l, i) => { if (l.includes('process.version')) console.log(full + ':' + i + ' ' + l.trim()); });
    }
  }
}
search('C:\\Users\\chinn\\Downloads\\Civic Intelligence Platform\\server\\node_modules\\mongodb');
