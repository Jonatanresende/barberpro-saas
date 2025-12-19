import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { NotificationContext, NotificationContextType } from '@/context/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { RealtimeChannel } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [newAppointmentCount, setNewAppointmentCount] = useState(0);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const incrementAppointmentCount = useCallback(() => {
    setNewAppointmentCount(prev => prev + 1);
  }, []);

  const resetAppointmentCount = useCallback(() => {
    setNewAppointmentCount(0);
  }, []);

  const setupRealtime = useCallback(() => {
    // 1. Remove o canal anterior, se existir
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
    }

    if (!user || authLoading) return;

    let filter: string | undefined;
    let channelName: string;

    if (user.role === UserRole.BARBEARIA && user.barbeariaId) {
      // Dono da Barbearia: escuta todos os agendamentos da sua barbearia
      filter = `barbearia_id=eq.${user.barbeariaId}`;
      channelName = `appointments:barbearia_id=eq.${user.barbeariaId}`;
    } else if (user.role === UserRole.BARBEIRO && user.barbeiroId) {
      // Barbeiro: escuta apenas os agendamentos destinados a ele
      filter = `barbeiro_id=eq.${user.barbeiroId}`;
      channelName = `appointments:barbeiro_id=eq.${user.barbeiroId}`;
    } else {
      return; // Não é um usuário que precisa de notificações de agendamento
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
    // Configura o Realtime sempre que o usuário ou o estado de autenticação mudar
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