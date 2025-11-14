import React, { useState, useEffect } from 'react';
import { Servico } from '../../types';
import Modal from '../../components/Modal';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: any) => Promise<void>;
  serviceToEdit: Omit<Servico, 'id' | 'barbearia_id'> | Servico | null;
}

const ServiceModal = ({ isOpen, onClose, onSave, serviceToEdit }: ServiceModalProps) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (serviceToEdit) {
      setNome(serviceToEdit.nome || '');
      setPreco(String(serviceToEdit.preco || ''));
      setDuracao(String(serviceToEdit.duracao || ''));
    } else {
      setNome('');
      setPreco('');
      setDuracao('');
    }
  }, [serviceToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const serviceData = {
      nome,
      preco: parseFloat(preco),
      duracao: parseInt(duracao, 10),
    };
    await onSave(serviceData);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={serviceToEdit ? 'Editar Serviço' : 'Adicionar Serviço'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço</label>
          <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div>
          <label htmlFor="preco" className="block text-sm font-medium text-gray-300 mb-1">Preço (ex: 40.00)</label>
          <input type="number" step="0.01" id="preco" value={preco} onChange={e => setPreco(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div>
          <label htmlFor="duracao" className="block text-sm font-medium text-gray-300 mb-1">Duração (em minutos)</label>
          <input type="number" id="duracao" value={duracao} onChange={e => setDuracao(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
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

export default ServiceModal;