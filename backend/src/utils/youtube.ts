/**
 * Valida um link do YouTube e extrai só o ID do vídeo (spec 08, D-08.2 — guardar o ID,
 * não a URL). Aceita os formatos comuns; retorna null se não for um link válido.
 */
const PADROES = [
  /[?&]v=([A-Za-z0-9_-]{11})/, // youtube.com/watch?v=ID
  /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/, // shorts/ID
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/, // embed/ID
  /youtube\.com\/live\/([A-Za-z0-9_-]{11})/, // live/ID
];

export function extrairVideoIdYoutube(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  const texto = url.trim();
  for (const padrao of PADROES) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      return match[1];
    }
  }
  // Já é só o ID.
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) {
    return texto;
  }
  return null;
}
