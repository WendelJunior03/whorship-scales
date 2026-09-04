/**
 * Normaliza texto pra comparação tolerante — usado tanto na chave de cache quanto
 * na deduplicação. Remove acentos, baixa pra minúsculo, tira caracteres especiais
 * e colapsa espaços extras.
 *
 * "Todavia Me Alegrarei!!" e "todavia   me alegrarei" → "todavia me alegrarei"
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    // ̀-ͯ = faixa Unicode dos acentos combinantes que o NFD separa da
    // letra base (é vira "e" + acento) — removendo essa faixa fica só a letra.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // tira pontuação/caracteres especiais
    .replace(/\s+/g, ' ')
    .trim();
}

/** Chave de deduplicação: título + artista normalizados. */
export function chaveDedup(titulo: string, artista: string): string {
  return `${normalizarTexto(titulo)}|${normalizarTexto(artista)}`;
}
