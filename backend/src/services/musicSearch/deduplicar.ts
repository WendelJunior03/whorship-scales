import { FonteMusica, MusicSearchResult } from './types';
import { chaveDedup } from './normalizar';

/**
 * Junta dois resultados da MESMA música (fontes diferentes) num só — a de maior
 * prioridade dá o título/artista/id "oficiais", mas nada se perde: capa e links
 * (spotify, cifraClub) de ambos os lados sobrevivem (em caso de conflito no
 * mesmo campo de `links`, o valor da fonte de maior prioridade vence).
 */
function mesclar(prioritario: MusicSearchResult, outro: MusicSearchResult): MusicSearchResult {
  const mesclado: MusicSearchResult = { ...prioritario };
  if (!mesclado.coverUrl && outro.coverUrl) {
    mesclado.coverUrl = outro.coverUrl;
  }
  const links = { ...outro.links, ...prioritario.links };
  if (Object.keys(links).length > 0) {
    mesclado.links = links;
  }
  return mesclado;
}

/**
 * Deduplica usando título + artista normalizados como chave. Quando a mesma
 * música aparece em mais de uma fonte, NÃO descarta a perdedora — mescla os
 * dois resultados (ver `mesclar`), mantendo o título/artista/id de quem tem
 * maior prioridade (menor índice em `prioridade`; fontes fora dessa lista vão
 * pro final).
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
    if (!existente) {
      porChave.set(chave, resultado);
      continue;
    }
    const novoEhPrioritario = posicaoPrioridade(resultado.source) < posicaoPrioridade(existente.source);
    porChave.set(
      chave,
      novoEhPrioritario ? mesclar(resultado, existente) : mesclar(existente, resultado),
    );
  }
  return [...porChave.values()];
}
