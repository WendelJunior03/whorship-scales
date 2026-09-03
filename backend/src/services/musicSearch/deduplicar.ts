import { FonteMusica, MusicSearchResult } from './types';
import { chaveDedup } from './normalizar';

/**
 * Remove duplicatas (mesma música achada em fontes diferentes) usando título +
 * artista normalizados como chave. Quando a mesma música aparece em mais de uma
 * fonte, mantém a de maior prioridade (menor índice em `prioridade`); fontes fora
 * dessa lista vão pro final.
 */
export function deduplicar(
  resultados: MusicSearchResult[],
  prioridade: FonteMusica[],
): MusicSearchResult[] {
  const posicaoPrioridade = (fonte: FonteMusica) => {
    const i = prioridade.indexOf(fonte);
    return i === -1 ? Number.POSITIVE_INFINITY : i;
  };

  const porChave = new Map<string, MusicSearchResult>();
  for (const resultado of resultados) {
    const chave = chaveDedup(resultado.title, resultado.artist);
    const existente = porChave.get(chave);
    if (!existente || posicaoPrioridade(resultado.source) < posicaoPrioridade(existente.source)) {
      porChave.set(chave, resultado);
    }
  }
  return [...porChave.values()];
}
