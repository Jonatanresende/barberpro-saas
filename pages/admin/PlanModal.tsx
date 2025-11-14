import React, { useState, useEffect } from 'react';
import { Plano } from '../../types';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planoData: any) => Promise<void>;
  planToEdit: Omit<Plano, 'id'> | Plano | null;
}

const PlanModal = ({ isOpen, onClose, onSave, planToEdit }: PlanModalProps) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [features, setFeatures] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [popular, setPopular] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (planToEdit) {
      setNome(planToEdit.nome || '');
      setPreco(String(planToEdit.preco || ''));
      setFeatures(planToEdit.features?.join('\n') || '');
      setAtivo(planToEdit.ativo !== undefined ? planToEdit.ativo : true);
      setPopular(planToEdit.popular || false);
    } else {
      // Reset form for new entry
      setNome('');
      setPreco('');
      setFeatures('');
      setAtivo(true);
      setPopular(false);
    }
  }, [planToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const planoData = {
      nome,
      preco: parseFloat(preco),
      features: features.split('\n').filter(f => f.trim() !== ''),
      ativo,
      popular,
    };
    await onSave(planoData);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome do Plano</label>
        <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div>
        <label htmlFor="preco" className="block text-sm font-medium text-gray-300 mb-1">Preço (ex: 39.90)</label>
        <input type="number" step="0.01" id="preco" value={preco} onChange={e => setPreco(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div>
        <label htmlFor="features" className="block text-sm font-medium text-gray-300 mb-1">Funcionalidades (uma por linha)</label>
        <textarea id="features" value={features} onChange={e => setFeatures(e.target.value)} required rows={4} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input id="ativo" type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-brand-gray text-brand-gold focus:ring-brand-gold" />
          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-300">Ativo</label>
        </div>
        <div className="flex items-center">
          <input id="popular" type="checkbox" checked={popular} onChange={e => setPopular(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-brand-gray text-brand-gold focus:ring-brand-gold" />
          <label htmlFor="popular" className="ml-2 block text-sm text-gray-300">Marcar como Popular</label>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-brand-gray">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">Cancelar</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
          {isSaving ? 'Salvando...' : 'Salvar Plano'}
        </button>
      </div>
    </form>
  );
};

export default PlanModal;