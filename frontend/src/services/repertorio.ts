import { api } from './api';
import { Culto, Repertorio } from '@/types';

export interface CriarRepertorioInput {
  cultoId: number;
  nome: string;
  tom: string;
  linkMusica: string;
}

export interface MeuProximoCulto {
  culto: Culto;
  repertorios: Repertorio[];
}

/**
 * Cadastra uma música no repertório de um culto. Admin e ministro.
 */
export async function criarRepertorio(input: CriarRepertorioInput): Promise<void> {
  await api.post('/repertorio', input);
}

/**
 * Próximo culto em que o usuário logado está escalado como vocal
 * (via escala_vocal), junto com o repertório já cadastrado pra ele.
 * `repertorios` pode vir vazio — culto sem repertório definido ainda
 * é normal, não é erro.
 */
export async function getMeuProximoCulto(): Promise<MeuProximoCulto> {
  const response = await api.get<{ message: string; culto: Culto; repertorios: Repertorio[] }>(
    '/repertorio/meu-proximo-culto',
  );
  return { culto: response.data.culto, repertorios: response.data.repertorios };
}

/**
 * Repertório cadastrado para um culto específico. Pode vir vazio —
 * culto sem repertório definido ainda é normal, não é erro.
 */
export async function getRepertorioDoCulto(cultoId: number): Promise<Repertorio[]> {
  const response = await api.get<Repertorio[]>(`/repertorio/${cultoId}`);
  return response.data;
}
