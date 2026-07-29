import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, clearToken, setUnauthorizedHandler } from '@/services/api';

interface AuthContextData {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getToken().then((token) => {
      setIsAuthenticated(!!token);
      setIsLoading(false);
    });
  }, []);

  async function signIn(token: string) {
    await saveToken(token);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await clearToken();
    setIsAuthenticated(false);
  }

  useEffect(() => {
    setUnauthorizedHandler(() => setIsAuthenticated(false));
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut }}>
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
