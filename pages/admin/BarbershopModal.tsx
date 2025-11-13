import React, { useState, useEffect, useRef } from 'react';
import { Barbearia } from '../../types';
import { UsersIcon } from '../../components/icons';

interface BarbershopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barbearia: any, password?: string, photoFile?: File) => Promise<void>;
  barbeariaToEdit: Barbearia | null;
}

const InputField = ({ id, label, value, onChange, type = 'text', required = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type={type}
            id={id}
            value={value}
            onChange={onChange}
            required={required}
            className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
        />
    </div>
);

const BarbershopModal = ({ isOpen, onClose, onSave, barbeariaToEdit }: BarbershopModalProps) => {
  const [nome, setNome] = useState('');
  const [donoNome, setDonoNome] = useState('');
  const [donoEmail, setDonoEmail] = useState('');
  const [password, setPassword] = useState('');
  const [endereco, setEndereco] = useState('');
  const [documento, setDocumento] = useState('');
  const [plano, setPlano] = useState<'Básico' | 'Premium' | 'Pro'>('Básico');
  const [status, setStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barbeariaToEdit) {
      setNome(barbeariaToEdit.nome);
      setDonoNome(barbeariaToEdit.dono_nome || '');
      setDonoEmail(barbeariaToEdit.dono_email);
      setEndereco(barbeariaToEdit.endereco || '');
      setDocumento(barbeariaToEdit.documento || '');
      setPlano(barbeariaToEdit.plano);
      setStatus(barbeariaToEdit.status);
      setPhotoPreview(barbeariaToEdit.foto_url || null);
      setPassword('');
      setPhotoFile(null);
    } else {
      // Reset form for new entry
      setNome('');
      setDonoNome('');
      setDonoEmail('');
      setPassword('');
      setEndereco('');
      setDocumento('');
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
      dono_nome: donoNome,
      dono_email: donoEmail,
      endereco,
      documento,
      plano,
      status,
    };
    await onSave(barbeariaData, password, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 overflow-y-auto pr-4 -mr-4" style={{ maxHeight: '65vh' }}>
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
        
        <InputField id="nome" label="Nome da Barbearia" value={nome} onChange={e => setNome(e.target.value)} required />
        <InputField id="dono_nome" label="Nome do Proprietário" value={donoNome} onChange={e => setDonoNome(e.target.value)} required />
        <InputField id="dono_email" label="E-mail do Proprietário" value={donoEmail} onChange={e => setDonoEmail(e.target.value)} type="email" required />
        {!barbeariaToEdit && (
          <InputField id="password" label="Senha de Acesso" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        )}
        <InputField id="endereco" label="Endereço Completo" value={endereco} onChange={e => setEndereco(e.target.value)} required />
        <InputField id="documento" label="CPF / Documento" value={documento} onChange={e => setDocumento(e.target.value)} required />

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
      </div>

      <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-brand-gray">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">Cancelar</button>
        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50">
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
};

export default BarbershopModal;