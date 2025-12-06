import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { ProfessionalType } from '@/types';
import toast from 'react-hot-toast';

interface ProfessionalTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (typeData: { name: string; commission_percent: number }) => Promise<void>;
  typeToEdit: ProfessionalType | null;
}

const ProfessionalTypeModal = ({ isOpen, onClose, onSave, typeToEdit }: ProfessionalTypeModalProps) => {
  const [name, setName] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeToEdit) {
      setName(typeToEdit.name);
      setCommissionPercent(String(typeToEdit.commission_percent));
    } else {
      setName('');
      setCommissionPercent('');
    }
  }, [typeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseInt(commissionPercent, 10);

    if (!name.trim() || isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Nome é obrigatório e a comissão deve ser entre 0 e 100.");
      return;
    }

    setIsSaving(true);
    await onSave({ name: name.trim(), commission_percent: percent });
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={typeToEdit ? 'Editar Tipo de Profissional' : 'Criar Novo Tipo de Profissional'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Tipo</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div>
          <label htmlFor="commission" className="block text-sm font-medium text-gray-300 mb-1">Comissão (%)</label>
          <input type="number" id="commission" value={commissionPercent} onChange={e => setCommissionPercent(e.target.value)} required min="0" max="100" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
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

export default ProfessionalTypeModal;