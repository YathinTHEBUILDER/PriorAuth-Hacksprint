import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { UserSummary, UserRole } from '../types';

interface AuthContextType {
  user: UserSummary | null;
  loading: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isDoctor: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await authApi.getMe();
        setUser(res.user);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
      } catch {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
            localStorage.removeItem('auth_user');
          }
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, pass: string, rememberMe?: boolean) => {
    const res = await authApi.login({ email, password: pass, rememberMe });
    setUser(res.user);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    setUser(res.user);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      localStorage.removeItem('auth_user');
    }
  };

  const quickDemoLogin = async (role: UserRole) => {
    const email =
      role === 'ADMINISTRATOR' ? 'admin@priorauth.health' :
      role === 'DOCTOR' ? 'doctor@priorauth.health' :
      'staff@priorauth.health';

    await login(email, 'Password123!');
  };

  const isAdmin = user?.role === 'ADMINISTRATOR';
  const isDoctor = user?.role === 'DOCTOR';
  const isStaff = user?.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        quickDemoLogin,
        isAdmin,
        isDoctor,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
