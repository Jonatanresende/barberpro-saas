import React, { useState, useEffect, useRef } from 'react';
import { Barbeiro } from '../../types';
import Modal from '../../components/Modal';
import { UsersIcon } from '../../components/icons';

interface BarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barberData: any, photoFile?: File) => Promise<void>;
  barberToEdit: Barbeiro | null;
}

const BarberModal = ({ isOpen, onClose, onSave, barberToEdit }: BarberModalProps) => {
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barberToEdit) {
      setNome(barberToEdit.nome);
      setEspecialidade(barberToEdit.especialidade || '');
      setAtivo(barberToEdit.ativo);
      setPhotoPreview(barberToEdit.foto_url || null);
      setPhotoFile(null);
    } else {
      setNome('');
      setEspecialidade('');
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
    setIsSaving(true);
    const barberData = {
      nome,
      especialidade,
      ativo,
      foto_url: photoPreview, // Passa a URL existente para não perdê-la se não houver nova foto
    };
    await onSave(barberData, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={barberToEdit ? 'Editar Barbeiro' : 'Adicionar Barbeiro'}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
          <input type="text" id="nome" value={nome} onChange={e => setNome(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div>
          <label htmlFor="especialidade" className="block text-sm font-medium text-gray-300 mb-1">Especialidade</label>
          <input type="text" id="especialidade" value={especialidade} onChange={e => setEspecialidade(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
        </div>
        <div className="flex items-center">
          <input id="ativo" type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-brand-gray text-brand-gold focus:ring-brand-gold" />
          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-300">Ativo</label>
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