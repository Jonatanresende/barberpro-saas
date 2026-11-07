import React, { useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { NotificationContext, NotificationContextType } from '@/context/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// Chave de armazenamento local para a contagem de notificações
const getStorageKey = (userId: string) => `notifications_count_${userId}`;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [newAppointmentCount, setNewAppointmentCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null); 

  // 1. Inicializa o estado a partir do localStorage
  useEffect(() => {
    if (user) {
      const storedCount = localStorage.getItem(getStorageKey(user.id));
      if (storedCount) {
        setNewAppointmentCount(parseInt(storedCount, 10));
      } else {
        setNewAppointmentCount(0);
      }
    } else {
      setNewAppointmentCount(0);
    }
  }, [user]);

  // 2. Funções de manipulação que atualizam o localStorage
  const incrementAppointmentCount = useCallback(() => {
    setNewAppointmentCount(prev => {
      const newCount = prev + 1;
      if (user) {
        localStorage.setItem(getStorageKey(user.id), String(newCount));
      }
      return newCount;
    });
  }, [user]);

  const resetAppointmentCount = useCallback(() => {
    setNewAppointmentCount(0);
    if (user) {
      localStorage.removeItem(getStorageKey(user.id));
    }
  }, [user]);

  // 3. Lógica de Realtime
  useEffect(() => {
    if (authLoading || !user) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    let filter: string | undefined;
    let channelName: string;

    if (user.role === UserRole.ESTABELECIMENTO && user.estabelecimentoId) {
      filter = `estabelecimento_id=eq.${user.estabelecimentoId}`;
      channelName = `appointments:estabelecimento_id=eq.${user.estabelecimentoId}`;
    } else if (user.role === UserRole.PROFISSIONAL && user.profissionalId) {
      filter = `profissional_id=eq.${user.profissionalId}`;
      channelName = `appointments:profissional_id=eq.${user.profissionalId}`;
    } else {
      return;
    }
    
    const newChannel = supabase.channel(channelName);

    newChannel.on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'agendamentos',
        filter: filter
      },
      (payload) => {
        const newAppointment = payload.new as any;
        
        incrementAppointmentCount();
        toast(`Novo Agendamento: ${newAppointment.cliente_nome} para ${newAppointment.servico_nome}!`, {
            icon: '🔔',
            duration: 5000,
        });
      }
    )
    .subscribe();

    channelRef.current = newChannel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, user?.role, user?.estabelecimentoId, user?.profissionalId, authLoading, incrementAppointmentCount]);

  const contextValue: NotificationContextType = {
    newAppointmentCount,
    incrementAppointmentCount,
    resetAppointmentCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};
