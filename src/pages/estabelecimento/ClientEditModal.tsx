import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Cliente } from '@/types';
import toast from 'react-hot-toast';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientId: string, updates: { nome: string; telefone: string }) => Promise<void>;
  client: Cliente | null;
}

const ClientEditModal = ({ isOpen, onClose, onSave, client }: ClientEditModalProps) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setNome(client.nome);
      setTelefone(client.telefone);
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Nome e telefone são obrigatórios.");
      return;
    }
    setIsSaving(true);
    await onSave(client.id, { nome, telefone });
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
          <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
          <input type="tel" id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-brand-gray">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">Cancelar</button>
          <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientEditModal;