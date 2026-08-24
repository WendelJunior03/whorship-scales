import { api } from './api';
import { MembroCandidato } from '@/types';

export interface CriarExcecaoInput {
  escalaFixaId: number;
  data: string;
  substitutoId?: number;
  indicadoId?: number;
}

/**
 * Registra uma exceção (falta) numa data específica de um vínculo de
 * escala fixa, com substituto opcional. Admin, ou o próprio dono do vínculo.
 * Se um substituto for informado, o back-end já notifica ele por e-mail.
 * `indicadoId` é diferente: é só uma indicação (nome sugerido) que vai no
 * aviso que os admins recebem, não escala ninguém automaticamente.
 */
export async function criarExcecao(input: CriarExcecaoInput): Promise<void> {
  await api.post('/excecoes', input);
}

/**
 * Membros ativos que dá pra indicar como substituto numa falta de escala
 * fixa (exclui quem está indicando).
 */
export async function getCandidatosExcecao(): Promise<MembroCandidato[]> {
  const response = await api.get<MembroCandidato[]>('/excecoes/candidatos');
  return response.data;
}
