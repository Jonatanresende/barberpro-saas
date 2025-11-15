import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { Agendamento } from '../../types';
import Modal from '../../components/Modal';

interface ClientAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClientAccountModal = ({ isOpen, onClose }: ClientAccountModalProps) => {
  const [telefone, setTelefone] = useState('');
  const [appointment, setAppointment] = useState<Agendamento | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAppointment(null);
    try {
      const data = await api.getClientAppointment(telefone);
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || 'Nenhum agendamento encontrado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      setIsLoading(true);
      try {
        await api.cancelClientAppointment(appointment.id, telefone);
        toast.success('Agendamento cancelado com sucesso!');
        setAppointment(null); // Limpa a interface
        onClose(); // Fecha o modal
      } catch (err: any) {
        toast.error(`Falha ao cancelar: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formattedDate = appointment ? new Date(`${appointment.data}T${appointment.hora}`).toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minha Conta">
      {!appointment && (
        <form onSubmit={handleSearch} className="space-y-4">
          <p className="text-gray-300 text-sm">Digite seu número de telefone (com DDD) para encontrar seu próximo agendamento.</p>
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
            <input
              type="tel"
              id="telefone"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
              required
              className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      )}

      {appointment && (
        <div className="space-y-4">
          <h4 className="font-semibold text-white">Seu Próximo Agendamento:</h4>
          <div className="text-left space-y-2 bg-brand-dark p-4 rounded-lg">
            <p><strong className="text-brand-gold">Data:</strong> {formattedDate}</p>
            <p><strong className="text-brand-gold">Serviço:</strong> {appointment.servico_nome}</p>
            <p><strong className="text-brand-gold">Barbeiro:</strong> {appointment.barbeiro_nome}</p>
            <p><strong className="text-brand-gold">Status:</strong> <span className="capitalize">{appointment.status}</span></p>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleCancel} disabled={isLoading} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50">
              {isLoading ? 'Cancelando...' : 'Cancelar Agendamento'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ClientAccountModal;