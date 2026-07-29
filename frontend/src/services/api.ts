import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/**
 * Erro normalizado que todo o resto do app deveria tratar,
 * em vez de lidar com o formato bruto do axios/back-end.
 */
export class ApiError extends Error {
  status: number | null;
  isNetworkError: boolean;

  constructor(message: string, status: number | null, isNetworkError: boolean) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Registrado pelo AuthContext: quando uma requisição volta 401,
 * o app inteiro precisa saber que a sessão caiu (pra fazer logout/redirecionar).
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError('Sem conexão com o servidor. Verifique sua internet.', null, true),
      );
    }

    const status = error.response.status;
    const backendMessage = error.response.data?.message;

    if (status === 401) {
      await clearToken();
      unauthorizedHandler?.();
      return Promise.reject(
        new ApiError(backendMessage ?? 'Sessão expirada, faça login novamente.', status, false),
      );
    }

    return Promise.reject(
      new ApiError(backendMessage ?? 'Ocorreu um erro inesperado.', status, false),
    );
  },
);
