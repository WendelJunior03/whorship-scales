import { api } from './api';
import { DiaSemana, EscalaEfetivaItem, EscalaFixaMontada, MinhaEscalaFixaItem } from '@/types';

export interface CriarEscalaFixaInput {
  membroId: number;
  diaSemana: DiaSemana;
  funcao: string;
}

/**
 * Vincula um membro a um dia da semana + função. Admin e ministro.
 */
export async function criarEscalaFixa(input: CriarEscalaFixaInput): Promise<void> {
  await api.post('/escala-fixa', input);
}

/**
 * Escala fixa completa (todos os membros, todos os dias), com nome já
 * resolvido via JOIN. Admin e ministro.
 */
export async function getEscalaFixaMontada(): Promise<EscalaFixaMontada[]> {
  const response = await api.get<EscalaFixaMontada[]>('/escala-fixa');
  return response.data;
}

/**
 * Escala fixa só do usuário logado, já com o `id` de cada vínculo
 * (necessário pra criar uma exceção referenciando ele).
 */
export async function getMinhaEscalaFixa(): Promise<MinhaEscalaFixaItem[]> {
  const response = await api.get<MinhaEscalaFixaItem[]>('/escala-fixa/me');
  return response.data;
}

/**
 * Escala "efetiva" de uma data específica — já considera substituições
 * registradas em excecoes pra aquela data exata.
 */
export async function getEscalaEfetiva(data: string): Promise<EscalaEfetivaItem[]> {
  const response = await api.get<{ message: string; escalaEfetiva: EscalaEfetivaItem[] }>(
    '/escala-fixa/efetiva',
    { params: { data } },
  );
  return response.data.escalaEfetiva;
}
