import React, { useState, useEffect, useRef } from 'react';
import { Servico } from '../../types';
import Modal from '../../components/Modal';
import { ScissorsIcon } from '../../components/icons';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: any, photoFile?: File) => Promise<void>;
  serviceToEdit: Omit<Servico, 'id' | 'barbearia_id'> | Servico | null;
}

const ServiceModal = ({ isOpen, onClose, onSave, serviceToEdit }: ServiceModalProps) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serviceToEdit) {
      setNome(serviceToEdit.nome || '');
      setPreco(String(serviceToEdit.preco || ''));
      setDuracao(String(serviceToEdit.duracao || ''));
      setPhotoPreview(serviceToEdit.imagem_url || null);
    } else {
      setNome('');
      setPreco('');
      setDuracao('');
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [serviceToEdit, isOpen]);

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
    const serviceData = {
      nome,
      preco: parseFloat(preco),
      duracao: parseInt(duracao, 10),
    };
    await onSave(serviceData, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={serviceToEdit ? 'Editar Serviço' : 'Adicionar Serviço'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Serviço (Opcional)</label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-brand-gray rounded-lg flex items-center justify-center overflow-hidden border-2 border-gray-600">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ScissorsIcon className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} ref={fileInputRef} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">
              Escolher Imagem
            </button>
          </div>
        </div>
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