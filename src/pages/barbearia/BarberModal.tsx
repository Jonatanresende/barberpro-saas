import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Barbeiro, ProfessionalType } from '@/types';
import Modal from '@/components/Modal';
import { UsersIcon } from '@/components/icons';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom'; // Importando Link e useParams

interface BarberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barberData: any, password?: string, photoFile?: File) => Promise<void>;
  barberToEdit: Barbeiro | null;
  hasBarberPanelFeature: boolean;
  professionalTypes: ProfessionalType[]; // Novo prop
}

const BarberModal = ({ isOpen, onClose, onSave, barberToEdit, hasBarberPanelFeature, professionalTypes }: BarberModalProps) => {
  const { slug } = useParams<{ slug: string }>(); // Obtendo o slug para o link
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Campos de comissão/tipo
  const [professionalTypeId, setProfessionalTypeId] = useState<string | undefined>(undefined);
  const [commissionManual, setCommissionManual] = useState<number | null>(null); // Usado apenas no Plano Básico

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barberToEdit) {
      setNome(barberToEdit.nome);
      setEspecialidade(barberToEdit.especialidade || '');
      setEmail(barberToEdit.email || '');
      setTelefone(barberToEdit.telefone || '');
      setAtivo(barberToEdit.ativo);
      setPhotoPreview(barberToEdit.foto_url || null);
      setPassword('');
      setPhotoFile(null);

      if (hasBarberPanelFeature) {
        // Plano Profissional: Usa Tipo de Profissional
        setProfessionalTypeId(barberToEdit.professional_type_id);
      } else {
        // Plano Básico: Usa comissão manual (se houver um valor salvo no professional_type_id, ele é ignorado aqui)
        setCommissionManual(null); 
      }
    } else {
      // Reset form for new entry
      setNome('');
      setEspecialidade('');
      setEmail('');
      setTelefone('');
      setPassword('');
      setAtivo(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setProfessionalTypeId(undefined);
      setCommissionManual(null);
    }
  }, [barberToEdit, isOpen, hasBarberPanelFeature]);

  // Lógica para exibir a comissão automática (Plano Profissional)
  const automaticCommission = useMemo(() => {
    if (hasBarberPanelFeature && professionalTypeId) {
      const selectedType = professionalTypes.find(t => t.id === professionalTypeId);
      return selectedType?.commission_percent || null;
    }
    return null;
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
    
    const barberData: any = {
      nome,
      especialidade,
      telefone,
      ativo,
    };

    if (hasBarberPanelFeature) {
      // Plano Profissional: Requer tipo, e-mail e senha (se for novo)
      if (professionalTypes.length === 0) {
        toast.error("Crie um Tipo de Profissional antes de adicionar um barbeiro.");
        return;
      }
      if (!professionalTypeId) {
        toast.error("Selecione um Tipo de Profissional.");
        return;
      }
      if (!email) {
        toast.error("O e-mail de acesso é obrigatório.");
        return;
      }
      if (!barberToEdit && !password) {
        toast.error("A senha é obrigatória para criar um novo barbeiro com acesso ao painel.");
        return;
      }
      
      barberData.email = email;
      barberData.professional_type_id = professionalTypeId;
      barberData.user_id = barberToEdit?.user_id; // Mantém o user_id se estiver editando
      
    } else {
      // Plano Básico: A comissão manual é apenas para anotação.
      if (commissionManual !== null && (isNaN(commissionManual) || commissionManual < 0 || commissionManual > 100)) {
        toast.error("A comissão deve ser um número entre 0 e 100.");
        return;
      }
      
      barberData.professional_type_id = null;
    }

    setIsSaving(true);
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
            
            {/* --- Lógica Condicional de Plano --- */}
            {hasBarberPanelFeature ? (
              // PLANO PROFISSIONAL: Tipo de Profissional + Acesso
              <>
                <div>
                  <label htmlFor="professional_type_id" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Profissional</label>
                  {professionalTypes.length > 0 ? (
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
                  ) : (
                    <div className="bg-yellow-500/10 p-3 rounded-md border border-yellow-500/30">
                        <p className="text-sm text-yellow-400">
                            Você precisa <Link to={`/${slug}/settings/types`} onClick={onClose} className="underline font-semibold">criar um Tipo de Profissional</Link> antes de adicionar um barbeiro com acesso ao painel.
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
                  <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required={hasBarberPanelFeature} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                </div>
                {!barberToEdit && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required={hasBarberPanelFeature} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
                    </div>
                )}
              </>
            ) : (
              // PLANO BÁSICO: Comissão Manual (para anotação)
              <>
                <div>
                    <label htmlFor="commission_manual" className="block text-sm font-medium text-gray-300 mb-1">Adicione o valor da comissão (%)</label>
                    <input 
                        type="number" 
                        id="commission_manual" 
                        value={commissionManual || ''} 
                        onChange={e => setCommissionManual(parseInt(e.target.value, 10))} 
                        min="0" 
                        max="100" 
                        placeholder="Ex: 40"
                        className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" 
                    />
                    <p className="text-xs text-gray-500 mt-1">A comissão real será a padrão da barbearia, este campo é apenas para referência interna.</p>
                </div>
              </>
            )}
            
            {/* Campo Especialidade (Comum a ambos os planos) */}
            <div>
            <label htmlFor="especialidade" className="block text-sm font-medium text-gray-300 mb-1">Especialidade</label>
            <input type="text" id="especialidade" value={especialidade} onChange={e => setEspecialidade(e.target.value)} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white" />
            </div>

            {/* Telefone e Ativo (Comum a ambos os planos) */}
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

export default BarberModal;