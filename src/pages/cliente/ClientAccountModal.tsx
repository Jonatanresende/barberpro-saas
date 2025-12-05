import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { api } from '@/services/api';
import { Agendamento } from '@/types';

interface ClientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentFound: (appointment: Agendamento, phone: string) => void;
}

const ClientAccountModal = ({ isOpen, onClose, onAppointmentFound }: ClientAccountModalProps) => {
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!phone.trim()) {
      toast.error('Por favor, insira seu telefone.');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointment = await api.getClientAppointment(phone.trim());
      
      // Se a API retornar 200, mas o agendamento for null (o que não deve acontecer se a função Edge estiver correta, mas por segurança)
      if (!appointment) {
        toast.error('Nenhum agendamento futuro encontrado para este telefone.');
        return;
      }

      onAppointmentFound(appointment, phone.trim());
      onClose();
    } catch (error: any) {
      // A função Edge retorna 404 com a mensagem 'Nenhum agendamento futuro encontrado.'
      const errorMessage = error.message.includes('404') 
        ? 'Nenhum agendamento futuro encontrado para este telefone.' 
        : `Falha na busca: ${error.message}`;
        
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta / Meus Agendamentos">
      <p className="text-sm text-gray-300 mb-4">
        Insira seu telefone para visualizar, reagendar ou cancelar seu próximo agendamento.
      </p>

      <form className="space-y-4" onSubmit={handleSearch}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Telefone / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={event => setPhone(event.target.value)}
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
    </Modal>
  );
};

export default ClientAccountModal;