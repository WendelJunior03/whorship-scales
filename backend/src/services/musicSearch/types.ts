/** Fontes de busca de música suportadas — adicionar uma nova fonte = adicionar um
 *  valor aqui + um provider em `providers/`, nada mais espalhado pelo código. */
export type FonteMusica = 'deezer' | 'itunes' | 'youtube' | 'getsongbpm';

/** Formato único que todo provider devolve — o resto do sistema (e o frontend)
 *  nunca lida com o formato bruto de cada API externa. */
export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  source: FonteMusica;
  externalId: string;
}

/** Contrato que todo provider implementa. Nunca deve rejeitar/lançar — falha de
 *  rede, chave ausente, "sem resultado" etc. sempre viram lista vazia (o
 *  agregador trata cada provider isoladamente, uma fonte fora do ar não pode
 *  derrubar a busca inteira). */
export interface MusicProvider {
  readonly source: FonteMusica;
  buscar(termo: string): Promise<MusicSearchResult[]>;
}
