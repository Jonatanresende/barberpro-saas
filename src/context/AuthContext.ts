import { createContext } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);