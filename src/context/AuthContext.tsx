import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
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

    // CORREÇÃO: Usando o e-mail correto do administrador 'jonne.obr@gmail.com'
    if (effectiveUser.email === 'jonne.obr@gmail.com' && !effectiveUser.user_metadata.full_name) {
      const { data: updatedUserData, error } = await supabase.auth.updateUser({
        data: { full_name: 'Jonathan Resende de Sousa' }
      });

      if (error) {
        console.error("Failed to update admin name:", error);
      } else if (updatedUserData?.user) {
        // Use the freshly updated user object to ensure the UI gets the new name.
        effectiveUser = updatedUserData.user;
      }
    }

    const metadata = effectiveUser.user_metadata || {};
    const baseUser: User = {
      id: effectiveUser.id,
      email: effectiveUser.email!,
      role: metadata.role as UserRole,
      full_name: metadata.full_name,
    };

    let trialStartedAt: string | undefined = metadata.trial_started_at;
    let trialExpiresAt: string | undefined = metadata.trial_expires_at;

    // If the user is a barbershop owner, find their barbershop to get the ID and slug
    if (baseUser.role === UserRole.BARBEARIA) {
      const { data: barbearia, error } = await supabase
        .from('barbearias')
        .select('id, nome, link_personalizado, trial_started_at, trial_expires_at')
        .eq('dono_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find barbershop for owner:", error);
        logout();
        return;
      }

      if (barbearia) {
        baseUser.barbeariaId = barbearia.id;
        baseUser.barbeariaNome = barbearia.nome;
        baseUser.link_personalizado = barbearia.link_personalizado;
        trialStartedAt = trialStartedAt || barbearia.trial_started_at || undefined;
        trialExpiresAt = trialExpiresAt || barbearia.trial_expires_at || undefined;
      }
    } else if (baseUser.role === UserRole.BARBEIRO) {
      const { data: barbeiro, error } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('user_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find barber profile for user:", error);
        logout(); // Log out if the barber profile is missing
        return;
      }

      if (barbeiro) {
        baseUser.barbeiroId = barbeiro.id;
      }
    }

    if (trialStartedAt) {
      baseUser.trialStartedAt = trialStartedAt;
    }
    if (trialExpiresAt) {
      baseUser.trialExpiresAt = trialExpiresAt;
      baseUser.isTrialActive = new Date(trialExpiresAt) >= new Date();
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