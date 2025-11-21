import React, { useState, useEffect, useRef } from 'react';
import { Barbeiro } from '@/types';
import Modal from '@/components/Modal';
import { UsersIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface BarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barberData: any, password?: string, photoFile?: File) => Promise<void>;
  barberToEdit: Barbeiro | null;
  hasBarberPanelFeature: boolean;
}

const BarberModal = ({ isOpen, onClose, onSave, barberToEdit, hasBarberPanelFeature }: BarberModalProps) => {
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barberToEdit) {
      setNome(barberToEdit.nome);
      setEspecialidade(barberToEdit.especialidade || '');
      setEmail(barberToEdit.email || '');
      setTelefone(barberToEdit.telefone || '');
      setAtivo(barberToEdit.ativo);
      setPhotoPreview(barberToEdit.foto_url || null);
      setPhotoFile(null);
      setPassword('');
    } else {
      setNome('');
      setEspecialidade('');
      setEmail('');
      setTelefone('');
      setPassword('');
      setAtivo(true);
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [barberToEdit, isOpen]);

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
    if (!barberToEdit && hasBarberPanelFeature && !password) {
      toast.error("A senha é obrigatória para criar um novo barbeiro com acesso ao painel.");
      return;
    }
    setIsSaving(true);
    const barberData = {
      nome,
      especialidade,
      email: hasBarberPanelFeature ? email : null,
      telefone,
      ativo,
      foto_url: photoPreview,
    };
    await onSave(barberData, password, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={barberToEdit ? 'Editar Barbeiro' : 'Adicionar Barbeiro'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 overflow-y-auto pr-4 -mr-4" style={{ maxHeight: '65vh' }}>
            <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Foto do Barbeiro</label>
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
            <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
            <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
            </div>
            
            {hasBarberPanelFeature && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">E-mail de Acesso</label>
                  <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required={hasBarberPanelFeature} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                </div>
                {!barberToEdit && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required={hasBarberPanelFeature} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                    </div>
                )}
              </>
            )}

            <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
            <input type="tel" id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
            </div>
            <div>
            <label htmlFor="especialidade" className="block text-sm font-medium text-gray-300 mb-1">Especialidade</label>
            <input type="text" id="especialidade" value={especialidade} onChange={e => setEspecialidade(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
            </div>
            <div className="flex items-center">
            <input id="ativo" type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-brand-gray text-brand-gold focus:ring-brand-gold" />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-300">Ativo</label>
            </div>
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

export default BarberModal;