/**
 * React context provider and state management module for A ut hC on te xt.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { currentUser } from '@/data/mockData';
import type { User } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface SignupData {
  name: string;
  email: string;
  password: string;
  university: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock login - accept any valid-looking email/password
    if (email.includes('@') && password.length >= 6) {
      setUser(currentUser);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock signup - always succeed
    const newUser: User = {
      ...currentUser,
      name: data.name,
      email: data.email,
      university: data.university,
    };
    setUser(newUser);
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      signup,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

