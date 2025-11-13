import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '@/src/integrations/supabase/client';
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

  const fetchUserAndBarbearia = async (session: Session | null) => {
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    const sessionUser = session.user;
    const baseUser: User = {
      id: sessionUser.id,
      email: sessionUser.email!,
      role: sessionUser.user_metadata.role as UserRole,
    };

    // If the user is a barbershop owner, find their barbershop to get the ID and slug
    if (baseUser.role === UserRole.BARBEARIA) {
      const { data: barbearia, error } = await supabase
        .from('barbearias')
        .select('id, link_personalizado')
        .eq('dono_id', sessionUser.id)
        .single();

      if (error) {
        console.error("Could not find barbershop for owner:", error);
        // Log them out if their barbershop isn't found, as they can't do anything
        logout();
        return;
      }

      if (barbearia) {
        baseUser.barbeariaId = barbearia.id;
        baseUser.link_personalizado = barbearia.link_personalizado;
      }
    }
    // TODO: Add similar logic for BARBEIRO role if needed

    setUser(baseUser);
    setLoading(false);
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserAndBarbearia(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserAndBarbearia(session);
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