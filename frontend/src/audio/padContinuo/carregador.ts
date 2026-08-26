import { getAudioContext } from '../audioContext';
import { CamadaId, Note } from './tipos';

/**
 * Extensão real dos arquivos servidos pelo app. Gravações-mestre podem (e devem) ser
 * feitas em WAV pra qualidade máxima de edição — mas 6 camadas × 12 notas em WAV são
 * pesadas demais pra um PWA sem CDN ainda (D-06.1 revisitada). Exportar o material final
 * comprimido (ex.: MP3/AAC) e trocar só esta constante, se for o caso.
 */
const EXTENSAO_ARQUIVO = 'mp3';

// Sem "#" no nome do arquivo — esse caractere tem significado especial em URL (marca
// fragmento) e cortaria o resto do caminho. Mesmo mapeamento já usado no Pad Contínuo hoje.
const SUFIXO_DA_NOTA: Record<Note, string> = {
  C: 'C',
  'C#': 'Csharp',
  D: 'D',
  'D#': 'Dsharp',
  E: 'E',
  F: 'F',
  'F#': 'Fsharp',
  G: 'G',
  'G#': 'Gsharp',
  A: 'A',
  'A#': 'Asharp',
  B: 'B',
};

/** Nome de arquivo esperado em `/pads/` para uma (camada, nota) — sem extensão. */
export function nomeDoArquivo(camada: CamadaId, nota: Note): string {
  return `${camada}_${SUFIXO_DA_NOTA[nota]}`;
}

function chave(camada: CamadaId, nota: Note): string {
  return `${camada}_${nota}`;
}

// Cache module-level: decodificado uma vez, reusado pro resto da sessão (não persiste
// entre recarregamentos — mesmo raciocínio de D-06.3, offline adiado).
const cache = new Map<string, AudioBuffer>();

/** Busca (se ainda não tiver em cache) e decodifica o áudio de uma (camada, nota). */
export async function carregar(camada: CamadaId, nota: Note): Promise<AudioBuffer> {
  const k = chave(camada, nota);
  const emCache = cache.get(k);
  if (emCache) return emCache;

  const resposta = await fetch(`/pads/${nomeDoArquivo(camada, nota)}.${EXTENSAO_ARQUIVO}`);
  if (!resposta.ok) {
    throw new Error(`Áudio não encontrado para ${camada} / ${nota}`);
  }
  const dados = await resposta.arrayBuffer();
  const buffer = await getAudioContext().decodeAudioData(dados);
  cache.set(k, buffer);
  return buffer;
}

export function jaCarregado(camada: CamadaId, nota: Note): boolean {
  return cache.has(chave(camada, nota));
}
