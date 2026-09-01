import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

// Cifra simétrica (AES-256-GCM) pra segredos guardados em repouso — ex.: o
// refresh token do Google em `contas_vinculadas.dados`. A chave vem de
// APP_ENC_KEY (qualquer string; derivamos 32 bytes via SHA-256). NUNCA logar
// segredos nem guardar em claro (ver CLAUDE.md · Segurança).

// Tamanho fixo do auth tag do GCM (16 bytes = 128 bits, o padrão e o máximo).
const TAG_BYTES = 16;

function chave(): Buffer {
  const segredo = process.env.APP_ENC_KEY;
  if (!segredo) {
    throw new Error('APP_ENC_KEY não configurada (necessária para cifrar tokens).');
  }
  return createHash('sha256').update(segredo).digest();
}

/** Texto → 'iv.tag.dados' (tudo base64). */
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chave(), iv, { authTagLength: TAG_BYTES });
  const dados = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${dados.toString('base64')}`;
}

/** 'iv.tag.dados' → texto. Lança se a chave/dados não baterem. */
export function decifrar(pacote: string): string {
  const [ivB64, tagB64, dadosB64] = pacote.split('.');
  if (!ivB64 || !tagB64 || !dadosB64) throw new Error('Pacote cifrado inválido.');
  const tag = Buffer.from(tagB64, 'base64');
  // Rejeita tag truncado: sem fixar o tamanho, um atacante poderia enviar um auth
  // tag menor e enfraquecer a garantia de integridade do GCM (Semgrep gcm-no-tag-length).
  if (tag.length !== TAG_BYTES) throw new Error('Auth tag inválido.');
  const decipher = createDecipheriv('aes-256-gcm', chave(), Buffer.from(ivB64, 'base64'), {
    authTagLength: TAG_BYTES,
  });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(Buffer.from(dadosB64, 'base64')), decipher.final()]).toString('utf8');
}

/** Há chave de cifra configurada? (pra habilitar/ocultar features de integração) */
export function temChaveCripto(): boolean {
  return !!process.env.APP_ENC_KEY;
}
