import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  loginAs: (role: UserRole) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('brightloop_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('brightloop_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await api.getCurrentUser();
        setUser(profile as User);
      } catch (err) {
        console.error('Session expired or invalid', err);
        localStorage.removeItem('brightloop_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (credentials: any) => {
    const res = (await api.login(credentials)) as any;
    localStorage.setItem('brightloop_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const loginAs = async (role: UserRole) => {
    let email = 'admin@brightloop.io';
    let password = 'Admin@1234';

    if (role === 'STAFF') {
      email = 'staff@brightloop.io';
      password = 'Staff@1234';
    } else if (role === 'CUSTOMER') {
      email = 'customer@technova.com';
      password = 'Customer@1234';
    }

    await login({ email, password });
  };

  const register = async (data: any) => {
    const res = (await api.register(data)) as any;
    localStorage.setItem('brightloop_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('brightloop_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAs,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
