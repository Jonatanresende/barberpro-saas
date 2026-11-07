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

  const fetchUserAndEstablishment = useCallback(async (session: Session | null) => {
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
      role: (effectiveUser.app_metadata?.role || metadata.role) as UserRole,
      full_name: metadata.full_name,
    };

    let trialStartedAt: string | undefined = metadata.trial_started_at;
    let trialExpiresAt: string | undefined = metadata.trial_expires_at;

    if (baseUser.role === UserRole.ESTABELECIMENTO) {
      const { data: estabelecimento, error } = await supabase
        .from('estabelecimentos')
        .select('id, nome, link_personalizado, trial_started_at, trial_expires_at')
        .eq('dono_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find establishment for owner:", error);
      }

      if (estabelecimento) {
        baseUser.estabelecimentoId = estabelecimento.id;
        baseUser.estabelecimentoNome = estabelecimento.nome;
        baseUser.link_personalizado = estabelecimento.link_personalizado;
        trialStartedAt = trialStartedAt || estabelecimento.trial_started_at || undefined;
        trialExpiresAt = trialExpiresAt || estabelecimento.trial_expires_at || undefined;
      }
    } else if (baseUser.role === UserRole.PROFISSIONAL) {
      const { data: profissional, error } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find professional profile for user:", error);
      }

      if (profissional) {
        baseUser.profissionalId = profissional.id;
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
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserAndEstablishment(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        fetchUserAndEstablishment(session);
      }, 100);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserAndEstablishment]);

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
