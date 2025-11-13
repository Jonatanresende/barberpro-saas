import React, { useState, useEffect } from 'react';
import { Barbearia } from '../../types';

interface BarbershopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barbearia: any) => Promise<void>;
  barbeariaToEdit: Barbearia | null;
}

const BarbershopModal = ({ isOpen, onClose, onSave, barbeariaToEdit }: BarbershopModalProps) => {
  const [nome, setNome] = useState('');
  const [donoEmail, setDonoEmail] = useState('');
  const [plano, setPlano] = useState<'Básico' | 'Premium' | 'Pro'>('Básico');
  const [status, setStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (barbeariaToEdit) {
      setNome(barbeariaToEdit.nome);
      setDonoEmail(barbeariaToEdit.dono_email);
      setPlano(barbeariaToEdit.plano);
      setStatus(barbeariaToEdit.status);
    } else {
      // Reset form for new entry
      setNome('');
      setDonoEmail('');
      setPlano('Básico');
      setStatus('ativa');
    }
  }, [barbeariaToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const barbeariaData = {
      nome,
      dono_email: donoEmail,
      plano,
      status,
    };
    await onSave(barbeariaData);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome da Barbearia</label>
        <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div>
        <label htmlFor="dono_email" className="block text-sm font-medium text-gray-300 mb-1">E-mail do Dono</label>
        <input type="email" id="dono_email" value={donoEmail} onChange={e => setDonoEmail(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div>
        <label htmlFor="plano" className="block text-sm font-medium text-gray-300 mb-1">Plano</label>
        <select id="plano" value={plano} onChange={e => setPlano(e.target.value as any)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white">
          <option value="Básico">Básico</option>
          <option value="Premium">Premium</option>
          <option value="Pro">Pro</option>
        </select>
      </div>
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
        <select id="status" value={status} onChange={e => setStatus(e.target.value as any)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white">
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">Cancelar</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default BarbershopModal;