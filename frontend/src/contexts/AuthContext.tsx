import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, clearToken, setUnauthorizedHandler } from '@/services/api';
import * as authService from '@/services/auth';
import * as membrosService from '@/services/membros';
import { Membro } from '@/types';

interface AuthContextData {
  user: Membro | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Membro | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSession() {
    const token = await getToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const perfil = await membrosService.getMeuPerfil();
      setUser(perfil);
      setIsAuthenticated(true);
    } catch {
      // token invalido/expirado - o interceptor de 401 ja limpou o token
      setUser(null);
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
      setIsAuthenticated(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  async function signIn(email: string, password: string) {
    const token = await authService.login({ email, passwordUser: password });
    await saveToken(token);
    const perfil = await membrosService.getMeuPerfil();
    setUser(perfil);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await clearToken();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, signIn, signOut }}>
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
