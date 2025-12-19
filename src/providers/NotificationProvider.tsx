import React, { useState, ReactNode, useEffect, useCallback } from 'react';
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
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

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

  // 3. Lógica de Realtime (mantida)
  const setupRealtime = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
    }

    if (!user || authLoading) return;

    let filter: string | undefined;
    let channelName: string;

    if (user.role === UserRole.BARBEARIA && user.barbeariaId) {
      filter = `barbearia_id=eq.${user.barbeariaId}`;
      channelName = `appointments:barbearia_id=eq.${user.barbeariaId}`;
    } else if (user.role === UserRole.BARBEIRO && user.barbeiroId) {
      filter = `barbeiro_id=eq.${user.barbeiroId}`;
      channelName = `appointments:barbeiro_id=eq.${user.barbeiroId}`;
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
        
        // Incrementa a contagem e mostra um toast
        incrementAppointmentCount();
        toast(`Novo Agendamento: ${newAppointment.cliente_nome} para ${newAppointment.servico_nome}!`, {
            icon: '🔔',
            duration: 5000,
        });
      }
    )
    .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [user, authLoading, incrementAppointmentCount, channel]);

  useEffect(() => {
    const cleanup = setupRealtime();
    return cleanup;
  }, [setupRealtime]);

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