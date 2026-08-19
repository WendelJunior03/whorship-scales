/**
 * Extrai o ID do vídeo de um link do YouTube (spec 08) — usado no preview antes de salvar.
 * O backend valida/extrai de novo (fonte da verdade); aqui é só pra UX.
 */
const PADROES = [
  /[?&]v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
];

export function extrairVideoIdYoutube(url: string): string | null {
  if (!url) {
    return null;
  }
  const texto = url.trim();
  for (const padrao of PADROES) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      return match[1];
    }
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) {
    return texto;
  }
  return null;
}
