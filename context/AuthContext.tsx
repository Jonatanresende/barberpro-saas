
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Users
const mockUsers: Record<UserRole, User> = {
  [UserRole.ADMIN]: { id: 'user_admin_1', email: 'admin@barberpro.app', role: UserRole.ADMIN },
  [UserRole.BARBEARIA]: { id: 'user_barbearia_1', email: 'dono@navalha.com', role: UserRole.BARBEARIA, barbeariaId: '1' },
  [UserRole.BARBEIRO]: { id: 'user_barbeiro_1', email: 'joao.silva@navalha.com', role: UserRole.BARBEIRO, barbeariaId: '1', barbeiroId: 'b1' },
  [UserRole.CLIENTE]: { id: 'user_cliente_1', email: 'cliente@email.com', role: UserRole.CLIENTE }, // Not used for login
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = (role: UserRole) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser(mockUsers[role]);
      setLoading(false);
    }, 500);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
