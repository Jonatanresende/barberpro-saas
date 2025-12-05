import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { Agendamento, Barbearia, AppointmentStatus } from '@/types';
import toast from 'react-hot-toast';
import { api } from '@/services/api';

interface ClientAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Agendamento | null;
  barbearia: Barbearia;
  clientPhone: string;
  onAppointmentUpdate: () => void;
}

const ClientAppointmentModal = ({ isOpen, onClose, appointment, barbearia, clientPhone, onAppointmentUpdate }: ClientAppointmentModalProps) => {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!appointment) return null;

  const [year, month, day] = appointment.data.split('-').map(Number);
  const [hour, minute] = appointment.hora.split(':').map(Number);
  const bookingDate = new Date(year, month - 1, day, hour, minute);
  
  const formattedDate = bookingDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const formattedTime = bookingDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isCancellable = appointment.status !== AppointmentStatus.CANCELADO && appointment.status !== AppointmentStatus.CONCLUIDO;

  const handleCancel = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    setIsCancelling(true);
    try {
      await api.cancelClientAppointment(appointment.id, clientPhone);
      toast.success('Agendamento cancelado com sucesso!');
      onAppointmentUpdate(); // Notifica o componente pai para fechar e/ou atualizar
    } catch (error: any) {
      toast.error(`Falha ao cancelar: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusClass = (status: AppointmentStatus) => {
    switch (status) {
        case AppointmentStatus.CONFIRMADO: return 'bg-blue-500/20 text-blue-400';
        case AppointmentStatus.CONCLUIDO: return 'bg-green-500/20 text-green-400';
        case AppointmentStatus.CANCELADO: return 'bg-red-500/20 text-red-400';
        case AppointmentStatus.PENDENTE: default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seu Próximo Agendamento">
      <div className="space-y-4">
        <div className="bg-brand-dark/60 rounded-xl border border-gray-700 p-4 text-left space-y-3">
          <p className="text-sm uppercase text-gray-400">Status</p>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(appointment.status)}`}>
            {appointment.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-brand-dark/60 rounded-xl border border-gray-700 p-4">
          <div>
            <p className="text-sm uppercase text-gray-400">Data</p>
            <p className="text-lg font-semibold capitalize">{formattedDate}</p>
          </div>
          <div>
            <p className="text-sm uppercase text-gray-400">Horário</p>
            <p className="text-lg font-semibold">{formattedTime}</p>
          </div>
          <div>
            <p className="text-sm uppercase text-gray-400">Barbeiro</p>
            <p className="text-lg font-semibold">{appointment.barbeiro_nome}</p>
          </div>
          <div>
            <p className="text-sm uppercase text-gray-400">Serviço</p>
            <p className="text-lg font-semibold">{appointment.servico_nome}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-brand-gray flex justify-end space-x-3">
          {isCancellable && (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar Agendamento'}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ClientAppointmentModal;