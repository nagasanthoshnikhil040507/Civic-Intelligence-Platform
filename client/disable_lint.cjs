const fs = require('fs');
const tsconfig = JSON.parse(fs.readFileSync('tsconfig.app.json', 'utf8'));
tsconfig.compilerOptions.noUnusedLocals = false;
tsconfig.compilerOptions.noUnusedParameters = false;
fs.writeFileSync('tsconfig.app.json', JSON.stringify(tsconfig, null, 2));
