import { api } from './api';
import { Papel } from '@/types';

export interface CadastroInput {
  name: string;
  email: string;
  passwordUser: string;
  role: Papel;
  instrument?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  passwordUser: string;
}

/**
 * Cadastra um novo membro. Só admin pode chamar (a rota exige token de admin).
 */
export async function cadastrar(input: CadastroInput): Promise<void> {
  await api.post('/membros/cadastro', input);
}

/**
 * Faz login e devolve o token JWT. Quem chama decide o que fazer com ele
 * (normalmente, passar pro `signIn` do AuthContext pra persistir).
 */
export async function login(input: LoginInput): Promise<string> {
  const response = await api.post<{ token: string; message: string }>('/membros/login', input);
  return response.data.token;
}
