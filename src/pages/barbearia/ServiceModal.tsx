import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/components/Modal';
import toast from 'react-hot-toast';
import { Servico } from '@/types';
import { ScissorsIcon } from '@/components/icons';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: any, photoFile?: File) => Promise<void>;
  serviceToEdit: Servico | null;
}

const ServiceModal = ({ isOpen, onClose, onSave, serviceToEdit }: ServiceModalProps) => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serviceToEdit) {
      setNome(serviceToEdit.nome);
      setPreco(serviceToEdit.preco.toString());
      setDuracao(serviceToEdit.duracao.toString());
      setDescricao('');
      setPhotoPreview(serviceToEdit.imagem_url || null);
      setPhotoFile(null);
    } else {
      setNome('');
      setPreco('');
      setDuracao('');
      setDescricao('');
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [serviceToEdit, isOpen]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nome.trim() || !preco || !duracao) {
      toast.error('Preencha nome, preço e duração.');
      return;
    }

    const parsedPrice = parseFloat(preco.replace(',', '.'));
    const parsedDuration = parseInt(duracao, 10);

    if (Number.isNaN(parsedPrice) || Number.isNaN(parsedDuration)) {
      toast.error('Preço e duração devem ser números válidos.');
      return;
    }

    setIsSaving(true);
    const servicePayload = {
      nome: nome.trim(),
      preco: parsedPrice,
      duracao: parsedDuration,
      descricao: descricao.trim() || undefined,
      imagem_url: photoPreview,
    };

    try {
      await onSave(servicePayload, photoFile || undefined);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={serviceToEdit ? 'Editar Serviço' : 'Adicionar Serviço'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 overflow-y-auto pr-4 -mr-4" style={{ maxHeight: '65vh' }}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Serviço</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-brand-gray rounded-md flex items-center justify-center overflow-hidden border-2 border-gray-600">
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço</label>
            <input
              type="text"
              value={nome}
              onChange={event => setNome(event.target.value)}
              required
              className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={preco}
                onChange={event => setPreco(event.target.value)}
                required
                className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Duração (min)</label>
              <input
                type="number"
                value={duracao}
                onChange={event => setDuracao(event.target.value)}
                required
                className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição (opcional)</label>
            <textarea
              value={descricao}
              onChange={event => setDescricao(event.target.value)}
              className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white h-24 resize-none"
              placeholder="Detalhes adicionais sobre o serviço"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-brand-gray">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-brand-gray hover:bg-gray-700 text-white font-semibold">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-brand-gold hover:opacity-90 text-brand-dark font-bold disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceModal;

