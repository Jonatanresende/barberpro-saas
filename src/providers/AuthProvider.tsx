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

    const effectiveUser: SupabaseUser = session.user;

    const metadata = effectiveUser.user_metadata || {};
    const baseUser: User = {
      id: effectiveUser.id,
      email: effectiveUser.email!,
      role: (effectiveUser.app_metadata?.role as UserRole) || UserRole.CLIENTE,
      full_name: metadata.full_name,
    };

    let trialStartedAt: string | undefined = undefined;
    let trialExpiresAt: string | undefined = undefined;

    if (baseUser.role === UserRole.ESTABELECIMENTO) {
      const { data: estabelecimento, error } = await supabase
        .from('estabelecimentos')
        .select('id, nome, link_personalizado, trial_started_at, trial_expires_at, status')
        .eq('dono_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find establishment for owner:", error);
      }

      if (estabelecimento) {
        baseUser.estabelecimentoId = estabelecimento.id;
        baseUser.estabelecimentoNome = estabelecimento.nome;
        baseUser.link_personalizado = estabelecimento.link_personalizado;
        baseUser.estabelecimentoStatus = (estabelecimento as any).status;
        trialStartedAt = estabelecimento.trial_started_at || undefined;
        trialExpiresAt = estabelecimento.trial_expires_at || undefined;
      }
    } else if (baseUser.role === UserRole.PROFISSIONAL) {
      const { data: profissional, error } = await supabase
        .from('profissionais')
        .select('id, estabelecimento_id, estabelecimentos:estabelecimento_id(status)')
        .eq('user_id', effectiveUser.id)
        .single();

      if (error) {
        console.error("Could not find professional profile for user:", error);
      }

      if (profissional) {
        baseUser.profissionalId = profissional.id;
        baseUser.estabelecimentoId = (profissional as any).estabelecimento_id;
        const estabRel = (profissional as any).estabelecimentos;
        if (estabRel && estabRel.status) {
          baseUser.estabelecimentoStatus = estabRel.status;
        }
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
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Sessão inválida ou expirada:", error.message);
          try {
            await supabase.auth.signOut();
          } catch { }
          await fetchUserAndEstablishment(null);
          return;
        }
        await fetchUserAndEstablishment(data?.session || null);
      } catch (err: any) {
        console.warn("Erro ao recuperar sessão:", err?.message);
        try {
          await supabase.auth.signOut();
        } catch { }
        await fetchUserAndEstablishment(null);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else {
        setTimeout(() => {
          fetchUserAndEstablishment(session);
        }, 100);
      }
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
