import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const sessionUser = session.user;
        const appUser: User = {
          id: sessionUser.id,
          email: sessionUser.email!,
          role: sessionUser.user_metadata.role as UserRole,
          barbeariaId: sessionUser.user_metadata.barbeariaId,
          barbeiroId: sessionUser.user_metadata.barbeiroId,
        };
        setUser(appUser);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      if (session) {
        const sessionUser = session.user;
        const appUser: User = {
          id: sessionUser.id,
          email: sessionUser.email!,
          role: sessionUser.user_metadata.role as UserRole,
          barbeariaId: sessionUser.user_metadata.barbeariaId,
          barbeiroId: sessionUser.user_metadata.barbeiroId,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
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