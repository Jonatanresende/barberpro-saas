import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { TipoProfissional } from '@/types';
import toast from 'react-hot-toast';

export interface TipoProfissionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (typeData: { nome: string; percentual_comissao: number }) => Promise<void>;
  typeToEdit: TipoProfissional | null;
}

const TipoProfissionalModal = ({ isOpen, onClose, onSave, typeToEdit }: TipoProfissionalModalProps) => {
  const [nome, setNome] = useState('');
  const [percentualComissao, setPercentualComissao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeToEdit) {
      setNome(typeToEdit.nome);
      setPercentualComissao(String(typeToEdit.percentual_comissao));
    } else {
      setNome('');
      setPercentualComissao('');
    }
  }, [typeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = parseInt(percentualComissao, 10);

    if (!nome.trim() || isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Nome é obrigatório e a comissão deve ser entre 0 e 100.");
      return;
    }

    setIsSaving(true);
    await onSave({ nome: nome.trim(), percentual_comissao: percent });
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={typeToEdit ? 'Editar Tipo de Profissional' : 'Criar Novo Tipo de Profissional'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome do Tipo</label>
          <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div>
          <label htmlFor="commission" className="block text-sm font-medium text-gray-300 mb-1">Comissão (%)</label>
          <input type="number" id="commission" value={percentualComissao} onChange={e => setPercentualComissao(e.target.value)} required min="0" max="100" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
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

export default TipoProfissionalModal;
export const ProfessionalTypeModal = TipoProfissionalModal;
