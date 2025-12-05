import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { api } from '@/services/api';
import { Agendamento } from '@/types';

interface ClientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentFound: (appointment: Agendamento, phone: string) => void;
  onHistoryFound: (clientName: string, appointments: Agendamento[]) => void;
}

const ClientAccountModal = ({ isOpen, onClose, onAppointmentFound, onHistoryFound }: ClientAccountModalProps) => {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setPhone('');
      setHasHistory(false);
      setClientName('');
    }
  }, [isOpen]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!phone.trim()) {
      toast.error('Por favor, insira seu telefone.');
      return;
    }

    setIsSubmitting(true);
    setHasHistory(false);
    setClientName('');

    try {
      // 1. Tenta buscar o próximo agendamento (para gerenciar)
      const nextAppointment = await api.getClientAppointment(phone.trim());
      
      if (nextAppointment) {
        onAppointmentFound(nextAppointment, phone.trim());
        onClose();
        return;
      }

      // 2. Se não houver agendamento futuro, busca o histórico completo
      const historyData = await api.getClientAppointmentsHistory(phone.trim());

      if (historyData && historyData.appointments.length > 0) {
        setClientName(historyData.clientName);
        setHasHistory(true);
        toast('Nenhum agendamento futuro, mas você tem histórico.', { icon: 'ℹ️' });
      } else {
        toast.error('Nenhum agendamento encontrado para este telefone.');
      }

    } catch (error: any) {
      const errorMessage = `Falha na busca: ${error.message}`;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHistory = async () => {
    if (!phone.trim()) return;
    setIsSubmitting(true);
    try {
        const historyData = await api.getClientAppointmentsHistory(phone.trim());
        if (historyData) {
            onHistoryFound(historyData.clientName, historyData.appointments);
            onClose();
        }
    } catch (error: any) {
        toast.error(`Falha ao carregar histórico: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta / Meus Agendamentos">
      <p className="text-sm text-gray-300 mb-4">
        Insira seu telefone para buscar seu próximo agendamento ou histórico.
      </p>

      <form className="space-y-4" onSubmit={handleSearch}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={event => { setPhone(event.target.value); setHasHistory(false); }}
            className="w-full px-3 py-2 rounded-md bg-brand-gray border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="(00) 00000-0000"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 rounded-md bg-brand-gold text-brand-dark font-semibold hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Buscando...' : 'Buscar Agendamento'}
        </button>
      </form>
      
      {hasHistory && (
        <div className="mt-4 pt-4 border-t border-brand-gray">
            <p className="text-gray-400 mb-2">Olá, {clientName}. Você não tem agendamentos futuros.</p>
            <button
                onClick={handleViewHistory}
                disabled={isSubmitting}
                className="w-full py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
                Ver Histórico Completo
            </button>
        </div>
      )}
    </Modal>
  );
};

export default ClientAccountModal;