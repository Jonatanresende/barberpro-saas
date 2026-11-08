import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Profissional, TipoProfissional } from '@/types';
import Modal from '@/components/Modal';
import { UsersIcon } from '@/components/icons';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';

export interface ProfissionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profissionalData: any, password?: string, photoFile?: File) => Promise<void>;
  profissionalToEdit?: Profissional | null;
  barberToEdit?: Profissional | null;
  hasBarberPanelFeature?: boolean;
  hasProfessionalPanelFeature?: boolean;
  professionalTypes?: TipoProfissional[];
  tiposProfissional?: TipoProfissional[];
}

const ProfissionalModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  profissionalToEdit, 
  barberToEdit, 
  hasBarberPanelFeature, 
  hasProfessionalPanelFeature, 
  professionalTypes,
  tiposProfissional 
}: ProfissionalModalProps) => {
  const itemToEdit = profissionalToEdit || barberToEdit;
  const hasPanelFeature = hasProfessionalPanelFeature ?? hasBarberPanelFeature ?? false;
  const typesList = tiposProfissional || professionalTypes || [];
  const hasLogin = Boolean(itemToEdit?.user_id);

  const { slug } = useParams<{ slug: string }>();
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [tipoProfissionalId, setTipoProfissionalId] = useState<string | undefined>(undefined);
  const [commissionManual, setCommissionManual] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemToEdit) {
      setNome(itemToEdit.nome);
      setEspecialidade(itemToEdit.especialidade || '');
      setEmail(itemToEdit.email || '');
      setTelefone(itemToEdit.telefone || '');
      setAtivo(itemToEdit.ativo);
      setPhotoPreview(itemToEdit.foto_url || null);
      setPassword('');
      setPhotoFile(null);

      if (hasPanelFeature) {
        setTipoProfissionalId(itemToEdit.tipo_profissional_id);
      } else {
        setCommissionManual(null); 
      }
    } else {
      setNome('');
      setEspecialidade('');
      setEmail('');
      setTelefone('');
      setPassword('');
      setAtivo(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setTipoProfissionalId(undefined);
      setCommissionManual(null);
    }
  }, [itemToEdit, isOpen, hasPanelFeature]);

  const automaticCommission = useMemo(() => {
    if (hasPanelFeature && tipoProfissionalId) {
      const selectedType = typesList.find(t => t.id === tipoProfissionalId);
      return selectedType?.percentual_comissao || null;
    }
    return null;
  }, [tipoProfissionalId, typesList, hasPanelFeature]);

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
    
    const profissionalData: any = {
      nome,
      especialidade,
      telefone,
      ativo,
    };

    if (hasPanelFeature) {
      if (typesList.length === 0) {
        toast.error("Crie um Tipo de Profissional antes de adicionar um profissional.");
        return;
      }
      if (!tipoProfissionalId) {
        toast.error("Selecione um Tipo de Profissional.");
        return;
      }
      if (!email) {
        toast.error("O e-mail de acesso é obrigatório.");
        return;
      }
      if (!itemToEdit && !password) {
        toast.error("A senha é obrigatória para criar um novo profissional com acesso ao painel.");
        return;
      }
      if (itemToEdit && !hasLogin && email && !password) {
        toast.error("A senha é obrigatória para criar o acesso ao painel.");
        return;
      }
      if (password && password.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      
      profissionalData.email = email;
      profissionalData.tipo_profissional_id = tipoProfissionalId;
      profissionalData.user_id = itemToEdit?.user_id;
      
    } else {
      if (commissionManual !== null && (isNaN(commissionManual) || commissionManual < 0 || commissionManual > 100)) {
        toast.error("A comissão deve ser um número entre 0 e 100.");
        return;
      }
      
      profissionalData.tipo_profissional_id = null;
      profissionalData.user_id = null;
      profissionalData.email = null;
    }

    setIsSaving(true);
    await onSave(profissionalData, password || undefined, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={itemToEdit ? 'Editar Profissional' : 'Adicionar Profissional'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 overflow-y-auto pr-4 -mr-4" style={{ maxHeight: '65vh' }}>
            <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Foto do Profissional</label>
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
            
            {hasPanelFeature ? (
              <>
                <div>
                  <label htmlFor="tipo_profissional_id" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Profissional</label>
                  {typesList.length > 0 ? (
                    <select 
                      id="tipo_profissional_id" 
                      value={tipoProfissionalId || ''} 
                      onChange={e => setTipoProfissionalId(e.target.value)} 
                      required
                      className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                    >
                      <option value="" disabled>Selecione um tipo</option>
                      {typesList.map(type => (
                          <option key={type.id} value={type.id}>{type.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-yellow-500/10 p-3 rounded-md border border-yellow-500/30">
                        <p className="text-sm text-yellow-400">
                            Você precisa <Link to={`/${slug}/settings/types`} onClick={onClose} className="underline font-semibold">criar um Tipo de Profissional</Link> antes de adicionar um profissional com acesso ao painel.
                        </p>
                    </div>
                  )}
                </div>
                
                {automaticCommission !== null && (
                    <div>
                        <label htmlFor="commission_display" className="block text-sm font-medium text-gray-300 mb-1">Comissão (Automática)</label>
                        <input 
                            type="text" 
                            id="commission_display" 
                            value={`${automaticCommission}%`} 
                            readOnly 
                            className="bg-brand-dark w-full px-3 py-2 rounded-md border border-gray-600 text-brand-gold font-bold cursor-not-allowed" 
                        />
                    </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">E-mail de Acesso</label>
                  <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required={hasPanelFeature} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                    {!itemToEdit
                      ? 'Senha'
                      : (!hasLogin
                        ? 'Senha (cria o acesso ao painel)'
                        : 'Nova senha (deixe em branco para não alterar)')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required={!itemToEdit || (!hasLogin && Boolean(email.trim()))}
                    placeholder={hasLogin ? '••••••••' : undefined}
                    minLength={6}
                    className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white"
                  />
                </div>
              </>
            ) : (
              <div className="bg-brand-dark p-4 rounded-lg border border-gray-700">
                  <p className="text-sm text-yellow-400 mb-2">
                      <span className="font-bold">Plano Básico:</span> A comissão é definida pelo padrão do estabelecimento.
                  </p>
                  <p className="text-xs text-gray-500">
                      Para gerenciar comissões individuais e dar acesso ao painel para o profissional, faça upgrade para o Plano Profissional.
                  </p>
              </div>
            )}
            
            <div>
            <label htmlFor="especialidade" className="block text-sm font-medium text-gray-300 mb-1">Especialidade</label>
            <input type="text" id="especialidade" value={especialidade} onChange={e => setEspecialidade(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
            </div>

            <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
            <input type="tel" id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
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

export default ProfissionalModal;
export const BarberModal = ProfissionalModal;
