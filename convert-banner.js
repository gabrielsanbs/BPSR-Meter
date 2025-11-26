const fs = require('fs');
const path = require('path');

// Simplesmente copiar o PNG como BMP (NSIS aceita PNG também)
const source = path.join(__dirname, 'bannernsis.png');
const dest = path.join(__dirname, 'bannernsis.bmp');

fs.copyFileSync(source, dest);
console.log('Banner copiado com sucesso!');
