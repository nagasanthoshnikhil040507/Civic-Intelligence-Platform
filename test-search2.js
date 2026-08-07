const fs = require('fs');
const lines = fs.readFileSync('C:/Users/chinn/Downloads/Civic Intelligence Platform/server/node_modules/mongodb/lib/utils.js', 'utf8').split('\n');
lines.forEach((l, i) => { if (l.match(/Resolver/)) console.log(i + ': ' + l.trim()); });
