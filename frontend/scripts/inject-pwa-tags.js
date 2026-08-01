

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const tags = `
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#6C3CE0" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <meta name="google" content="notranslate" />
  <style>
    /* O Chrome força um fundo claro em campos com autofill/valor reconhecido,
       ignorando nosso tema escuro. Esse truque do box-shadow "pinta por cima"
       porque o navegador não deixa sobrescrever background-color direto. */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px #1B1729 inset !important;
      box-shadow: 0 0 0 1000px #1B1729 inset !important;
      -webkit-text-fill-color: #FFFFFF !important;
      caret-color: #FFFFFF !important;
      transition: background-color 9999s ease-in-out 0s;
    }
  </style>
`;

html = html.replace('</head>', `${tags}</head>`);
html = html.replace('<html lang="en">', '<html lang="pt-BR" translate="no">');

fs.writeFileSync(indexPath, html);
console.log('Tags do PWA injetadas e idioma corrigido em dist/index.html');