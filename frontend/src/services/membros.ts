import { api } from './api';
import { Membro, Papel } from '@/types';

export interface AtualizarMembroInput {
  name: string;
  phone: string;
  instrument: string;
  email: string;
  /** Só é aplicado de fato pelo back-end se quem chama for admin. */
  role?: Papel;
}

export interface AlterarSenhaInput {
  senhaAtual: string;
  novaSenha: string;
}

export interface CadastrarMembroInput {
  name: string;
  email: string;
  passwordUser: string;
  role: Papel;
  instrument: string;
  phone: string;
}

/**
 * Dados do próprio usuário logado.
 */
export async function getMeuPerfil(): Promise<Membro> {
  const response = await api.get<Membro>('/membros/me');
  return response.data;
}

/**
 * Lista todos os membros. Só admin.
 */
export async function getTodosMembros(): Promise<Membro[]> {
  const response = await api.get<Membro[]>('/membros');
  return response.data;
}

/**
 * Busca um membro específico. Admin e ministro.
 */
export async function getMembroPorId(id: number): Promise<Membro> {
  const response = await api.get<Membro>(`/membros/${id}`);
  return response.data;
}

/**
 * Atualiza os dados de um membro. O próprio dono do registro, ou admin.
 * Os 4 campos são obrigatórios (o back-end não faz atualização parcial).
 */
export async function atualizarMembro(id: number, input: AtualizarMembroInput): Promise<void> {
  await api.put(`/membros/${id}`, input);
}

/**
 * Desativa (soft delete) um membro. Só admin.
 */
export async function desativarMembro(id: number): Promise<void> {
  await api.delete(`/membros/${id}`);
}

/**
 * Troca a própria senha. Exige a senha atual pra confirmar — nem admin
 * consegue trocar a senha de outra pessoa por aqui, só o dono da conta.
 */
export async function alterarSenha(id: number, input: AlterarSenhaInput): Promise<void> {
  await api.put(`/membros/${id}/senha`, input);
}

/**
 * Cadastra um membro novo com uma senha inicial (definida por quem
 * cadastra). O próprio membro pode trocá-la depois em "Segurança". Só
 * admin.
 */
export async function cadastrarMembro(input: CadastrarMembroInput): Promise<void> {
  await api.post('/membros/cadastro', input);
}
