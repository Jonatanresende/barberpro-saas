import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '@/src/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

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

    let effectiveUser: SupabaseUser = session.user;

    // One-time update to set the admin's full name if it's not already set.
    // This logic is now more robust to ensure the UI reflects the change immediately.
    if (effectiveUser.email === 'admin@barberpro.com' && !effectiveUser.user_metadata.full_name) {
      const { data: updatedUserData, error } = await supabase.auth.updateUser({
        data: { full_name: 'Jonathan Resende de Sousa' }
      });

      if (error) {
        console.error("Failed to update admin name:", error);
      } else if (updatedUserData?.user) {
        // IMPORTANT: Use the freshly updated user object to ensure the UI gets the new name.
        effectiveUser = updatedUserData.user;
      }
    }

    const baseUser: User = {
      id: effectiveUser.id,
      email: effectiveUser.email!,
      role: effectiveUser.user_metadata.role as UserRole,
      full_name: effectiveUser.user_metadata.full_name,
    };

    // If the user is a barbershop owner, find their barbershop to get the ID and slug
    if (baseUser.role === UserRole.BARBEARIA) {
      const { data: barbearia, error } = await supabase
        .from('barbearias')
        .select('id, link_personalizado')
        .eq('dono_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find barbershop for owner:", error);
        logout();
        return;
      }

      if (barbearia) {
        baseUser.barbeariaId = barbearia.id;
        baseUser.link_personalizado = barbearia.link_personalizado;
      }
    }

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