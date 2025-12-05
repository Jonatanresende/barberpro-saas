import React from 'react';
import Modal from '@/components/Modal';
import { Agendamento, AppointmentStatus } from '@/types';

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  appointments: Agendamento[];
}

const ClientHistoryModal = ({ isOpen, onClose, clientName, appointments }: ClientHistoryModalProps) => {
  const upcomingAppointments = appointments
    .filter(a => new Date(`${a.data}T${a.hora}`) >= new Date() && a.status !== AppointmentStatus.CANCELADO)
    .sort((a, b) => new Date(`${a.data}T${a.hora}`).getTime() - new Date(`${b.data}T${b.hora}`).getTime());
  
  const pastAppointments = appointments
    .filter(a => new Date(`${a.data}T${a.hora}`) < new Date() || a.status === AppointmentStatus.CANCELADO)
    .sort((a, b) => new Date(`${b.data}T${b.hora}`).getTime() - new Date(`${a.data}T${a.hora}`).getTime());

  const getStatusClass = (status: AppointmentStatus) => {
    switch (status) {
        case AppointmentStatus.CONFIRMADO: return 'text-blue-400';
        case AppointmentStatus.CONCLUIDO: return 'text-green-400';
        case AppointmentStatus.CANCELADO: return 'text-red-400';
        case AppointmentStatus.PENDENTE: default: return 'text-yellow-400';
    }
  };

  const AppointmentList = ({ title, list }: { title: string, list: Agendamento[] }) => (
    <div>
      <h4 className="text-lg font-semibold text-brand-gold mb-2">{title} ({list.length})</h4>
      {list.length > 0 ? (
        <ul className="space-y-3">
          {list.map(ag => (
            <li key={ag.id} className="bg-brand-gray p-3 rounded-md text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">{ag.servico_nome}</p>
                  <p className="text-gray-400">
                    {new Date(ag.data + 'T00:00:00').toLocaleDateString('pt-BR')} às {ag.hora} com {ag.barbeiro_nome}
                  </p>
                </div>
                <span className={`font-semibold ${getStatusClass(ag.status)}`}>{ag.status}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-sm">Nenhum agendamento encontrado.</p>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico de Agendamentos de ${clientName}`}>
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        <AppointmentList title="Próximos Agendamentos" list={upcomingAppointments} />
        <AppointmentList title="Agendamentos Anteriores/Cancelados" list={pastAppointments} />
      </div>
    </Modal>
  );
};

export default ClientHistoryModal;