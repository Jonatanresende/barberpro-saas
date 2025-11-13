import React, { useState, useEffect, useRef } from 'react';
import { Barbearia } from '../../types';
import { UsersIcon } from '../../components/icons'; // Using an icon as a placeholder

interface BarbershopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barbearia: any, password?: string, photoFile?: File) => Promise<void>;
  barbeariaToEdit: Barbearia | null;
}

const BarbershopModal = ({ isOpen, onClose, onSave, barbeariaToEdit }: BarbershopModalProps) => {
  const [nome, setNome] = useState('');
  const [donoEmail, setDonoEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plano, setPlano] = useState<'Básico' | 'Premium' | 'Pro'>('Básico');
  const [status, setStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barbeariaToEdit) {
      setNome(barbeariaToEdit.nome);
      setDonoEmail(barbeariaToEdit.dono_email);
      setPlano(barbeariaToEdit.plano);
      setStatus(barbeariaToEdit.status);
      setPhotoPreview(barbeariaToEdit.foto_url || null);
      setPassword('');
      setPhotoFile(null);
    } else {
      // Reset form for new entry
      setNome('');
      setDonoEmail('');
      setPassword('');
      setPlano('Básico');
      setStatus('ativa');
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [barbeariaToEdit, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbeariaToEdit && !password) {
        alert("A senha é obrigatória para cadastrar uma nova barbearia.");
        return;
    }
    setIsSaving(true);
    const barbeariaData = {
      nome,
      dono_email: donoEmail,
      plano,
      status,
    };
    await onSave(barbeariaData, password, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Foto da Barbearia</label>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <UsersIcon className="w-10 h-10 text-gray-500" />
            )}
          </div>
          <input type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">
            Escolher Foto
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome da Barbearia</label>
        <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      <div>
        <label htmlFor="dono_email" className="block text-sm font-medium text-gray-300 mb-1">E-mail do Dono</label>
        <input type="email" id="dono_email" value={donoEmail} onChange={e => setDonoEmail(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
      </div>
      {!barbeariaToEdit && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Senha de Acesso</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
      )}
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