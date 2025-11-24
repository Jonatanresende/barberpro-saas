import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const fetchUserAndBarbearia = useCallback(async (session: Session | null) => {
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    let effectiveUser: SupabaseUser = session.user;

    if (effectiveUser.email === 'jonne.obr@gmail.com' && !effectiveUser.user_metadata.full_name) {
      const { data: updatedUserData, error } = await supabase.auth.updateUser({
        data: { full_name: 'Jonathan Resende de Sousa' }
      });

      if (error) {
        console.error("Failed to update admin name:", error);
      } else if (updatedUserData?.user) {
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
        logout();
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
  }, [logout]);

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
  }, [fetchUserAndBarbearia]);

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
