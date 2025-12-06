import React, { useState, useEffect, useRef } from 'react';
import { Barbeiro, ProfessionalType } from '@/types';
import Modal from '@/components/Modal';
import { UsersIcon } from '@/components/icons';
import toast from 'react-hot-toast';

interface BarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barberData: any, password?: string, photoFile?: File) => Promise<void>;
  barberToEdit: Barbeiro | null;
  hasBarberPanelFeature: boolean;
  professionalTypes: ProfessionalType[]; // Novo prop
}

const BarberModal = ({ isOpen, onClose, onSave, barberToEdit, hasBarberPanelFeature, professionalTypes }: BarberModalProps) => {
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Novos campos para Tipo de Profissional
  const [professionalTypeId, setProfessionalTypeId] = useState<string | undefined>(undefined);
  const [commissionDisplay, setCommissionDisplay] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barberToEdit) {
      setNome(barberToEdit.nome);
      setEspecialidade(barberToEdit.especialidade || '');
      setEmail(barberToEdit.email || '');
      setTelefone(barberToEdit.telefone || '');
      setAtivo(barberToEdit.ativo);
      setPhotoPreview(barberToEdit.foto_url || null);
      setProfessionalTypeId(barberToEdit.professional_type_id);
      setPassword('');
      setPhotoFile(null);
    } else {
      setNome('');
      setEspecialidade('');
      setEmail('');
      setTelefone('');
      setPassword('');
      setAtivo(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setProfessionalTypeId(undefined);
    }
  }, [barberToEdit, isOpen]);

  useEffect(() => {
    if (hasBarberPanelFeature && professionalTypeId) {
      const selectedType = professionalTypes.find(t => t.id === professionalTypeId);
      setCommissionDisplay(selectedType?.commission_percent || null);
    } else {
      setCommissionDisplay(null);
    }
  }, [professionalTypeId, professionalTypes, hasBarberPanelFeature]);

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
    if (hasBarberPanelFeature && !professionalTypeId) {
        toast.error("Selecione um Tipo de Profissional.");
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
      professional_type_id: hasBarberPanelFeature ? professionalTypeId : null,
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
                  <label htmlFor="professional_type_id" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Profissional</label>
                  <select 
                    id="professional_type_id" 
                    value={professionalTypeId || ''} 
                    onChange={e => setProfessionalTypeId(e.target.value)} 
                    required
                    className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                  >
                    <option value="" disabled>Selecione um tipo</option>
                    {professionalTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                {commissionDisplay !== null && (
                    <div>
                        <label htmlFor="commission_display" className="block text-sm font-medium text-gray-300 mb-1">Comissão (Automática)</label>
                        <input 
                            type="text" 
                            id="commission_display" 
                            value={`${commissionDisplay}%`} 
                            readOnly 
                            className="bg-brand-dark w-full px-3 py-2 rounded-md border border-gray-600 text-brand-gold font-bold cursor-not-allowed" 
                        />
                    </div>
                )}

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
            
            {!hasBarberPanelFeature && (
                // Fallback para plano básico: comissão manual (mantendo o campo original)
                <div>
                    <label htmlFor="comissao_padrao" className="block text-sm font-medium text-gray-300 mb-1">Comissão (%)</label>
                    <input 
                        type="number" 
                        id="comissao_padrao" 
                        value={commissionDisplay || ''} 
                        onChange={e => setCommissionDisplay(parseInt(e.target.value, 10))} 
                        min="0" 
                        max="100" 
                        className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" 
                    />
                </div>
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