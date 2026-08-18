/**
 * Converte a saída JSON do Semgrep em um comentário de PR (markdown, em português).
 * Sem dependências — Node puro. Escreve `revisao.md` e expõe `erros` no GITHUB_OUTPUT.
 */
const fs = require('fs');

let data = { results: [], errors: [] };
try {
  data = JSON.parse(fs.readFileSync('semgrep.json', 'utf8'));
} catch {
  // sem arquivo/JSON inválido → trata como zero achados
}

const buckets = { ERROR: [], WARNING: [], INFO: [] };
for (const r of data.results || []) {
  const sev = String(r.extra?.severity || 'INFO').toUpperCase();
  (buckets[sev] || buckets.INFO).push(r);
}

const nErr = buckets.ERROR.length;
const nWarn = buckets.WARNING.length;
const nInfo = buckets.INFO.length;

function linha(r) {
  const msg = String(r.extra?.message || '').trim().replace(/\s+/g, ' ');
  const regra = String(r.check_id || '').split('.').pop();
  return `- \`${r.path}:${r.start?.line}\` — ${msg} _(${regra})_`;
}

let veredito;
if (nErr > 0) {
  veredito = `## ❌ Problemas graves encontrados (${nErr})`;
} else if (nWarn > 0) {
  veredito = `## ⚠️ Ajustes recomendados (${nWarn})`;
} else {
  veredito = '## ✅ Nada crítico encontrado';
}

let md = `${veredito}\n\n`;
if (nErr > 0) {
  md += `### ❌ Graves (segurança/bug) — ${nErr}\n${buckets.ERROR.map(linha).join('\n')}\n\n`;
}
if (nWarn > 0) {
  md += `### ⚠️ Avisos — ${nWarn}\n${buckets.WARNING.map(linha).join('\n')}\n\n`;
}
if (nInfo > 0) {
  md += `<details><summary>ℹ️ ${nInfo} observações informativas</summary>\n\n${buckets.INFO.map(linha).join('\n')}\n</details>\n\n`;
}
if (nErr === 0 && nWarn === 0) {
  md += 'O Semgrep não apontou problemas de segurança/qualidade neste diff. ✅\n\n';
}
md += '---\n_Revisão automática · Semgrep (regras OSS: segurança, TS, React, Node). Gratuito, sem API._';

fs.writeFileSync('revisao.md', md);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `erros=${nErr}\n`);
}
console.log(`Semgrep: ${nErr} graves, ${nWarn} avisos, ${nInfo} infos.`);
