import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, saveToken, clearToken, setUnauthorizedHandler } from '@/services/api';
import * as authService from '@/services/auth';
import * as membrosService from '@/services/membros';
import * as organizacaoService from '@/services/organizacao';
import * as integracoesService from '@/services/integracoes';
import { obterCodigoGoogle, googleClientId } from '@/utils/googleGsi';
import { NAVIGATION_PERSISTENCE_KEY } from '@/navigation/persistence';
import { Membro, Organizacao } from '@/types';

interface AuthContextData {
  user: Membro | null;
  org: Organizacao | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  entrarComGoogle: () => Promise<void>;
  criarOrganizacao: (
    input: organizacaoService.CriarOrganizacaoInput,
  ) => Promise<organizacaoService.OrganizacaoResumo>;
  entrarComCodigo: (input: organizacaoService.EntrarOrganizacaoInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Membro | null>(null);
  const [org, setOrg] = useState<Organizacao | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega a org do usuário logado. Não é fatal: se falhar, segue sem org.
  async function carregarOrg() {
    try {
      setOrg(await organizacaoService.getOrganizacaoAtual());
    } catch {
      setOrg(null);
    }
  }

  async function loadSession() {
    const token = await getToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setOrg(null);
      setIsLoading(false);
      return;
    }

    try {
      const perfil = await membrosService.getMeuPerfil();
      setUser(perfil);
      await carregarOrg();
      setIsAuthenticated(true);
    } catch {
      // token invalido/expirado - o interceptor de 401 ja limpou o token
      setUser(null);
      setOrg(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setOrg(null);
      setIsAuthenticated(false);
      AsyncStorage.removeItem(NAVIGATION_PERSISTENCE_KEY);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Persiste o token e hidrata perfil + org num fluxo só (login/criar/entrar).
  async function autenticarComToken(token: string) {
    await saveToken(token);
    const perfil = await membrosService.getMeuPerfil();
    setUser(perfil);
    await carregarOrg();
    setIsAuthenticated(true);
  }

  async function signIn(email: string, password: string) {
    const token = await authService.login({ email, passwordUser: password });
    await autenticarComToken(token);
  }

  async function entrarComGoogle() {
    const clientId = googleClientId();
    if (!clientId) throw new Error('Login com Google não está configurado.');
    const code = await obterCodigoGoogle(clientId);
    const token = await integracoesService.loginGoogle(code);
    await autenticarComToken(token);
  }

  async function criarOrganizacao(input: organizacaoService.CriarOrganizacaoInput) {
    const { token, organizacao } = await organizacaoService.criarOrganizacao(input);
    await autenticarComToken(token);
    return organizacao;
  }

  async function entrarComCodigo(input: organizacaoService.EntrarOrganizacaoInput) {
    const { token } = await organizacaoService.entrarComCodigo(input);
    await autenticarComToken(token);
  }

  async function signOut() {
    await clearToken();
    await AsyncStorage.removeItem(NAVIGATION_PERSISTENCE_KEY);
    setUser(null);
    setOrg(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        isAuthenticated,
        isLoading,
        signIn,
        entrarComGoogle,
        criarOrganizacao,
        entrarComCodigo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return context;
}
