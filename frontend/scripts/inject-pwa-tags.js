

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const tags = `
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#6C3CE0" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <meta name="google" content="notranslate" />
`;

html = html.replace('</head>', `${tags}</head>`);
html = html.replace('<html lang="en">', '<html lang="pt-BR" translate="no">');

fs.writeFileSync(indexPath, html);
console.log('Tags do PWA injetadas e idioma corrigido em dist/index.html');