import { api } from './api';

export interface CriarExcecaoInput {
  escalaFixaId: number;
  data: string;
  substitutoId?: number;
}

/**
 * Registra uma exceção (falta) numa data específica de um vínculo de
 * escala fixa, com substituto opcional. Admin, ou o próprio dono do vínculo.
 * Se um substituto for informado, o back-end já notifica ele por e-mail.
 */
export async function criarExcecao(input: CriarExcecaoInput): Promise<void> {
  await api.post('/excecoes', input);
}
