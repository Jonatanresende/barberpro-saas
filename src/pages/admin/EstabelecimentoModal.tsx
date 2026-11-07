import React, { useState, useEffect, useRef } from 'react';
import { Estabelecimento, Plano, Nicho } from '@/types';
import { UsersIcon } from '@/components/icons';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

export interface EstabelecimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (estabelecimento: any, password?: string, photoFile?: File) => Promise<void>;
  estabelecimentoToEdit?: Estabelecimento | null;
  barbeariaToEdit?: Estabelecimento | null;
}

const InputField = ({ id, label, value, onChange, type = 'text', required = false }: any) => (
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

const EstabelecimentoModal = ({ isOpen, onClose, onSave, estabelecimentoToEdit, barbeariaToEdit }: EstabelecimentoModalProps) => {
  const itemToEdit = estabelecimentoToEdit || barbeariaToEdit;
  const [nome, setNome] = useState('');
  const [donoNome, setDonoNome] = useState('');
  const [donoEmail, setDonoEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [endereco, setEndereco] = useState('');
  const [documento, setDocumento] = useState('');
  const [nicho, setNicho] = useState<Nicho>('outro');
  const [plano, setPlano] = useState('');
  const [status, setStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Plano[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPlans = async () => {
        try {
            const plans = await api.getPlanos();
            setAvailablePlans(plans);
            if (!itemToEdit && plans.length > 0) {
                setPlano(plans[0].nome);
            }
        } catch (error) {
            toast.error("Falha ao carregar os planos disponíveis.");
        }
    };
    if (isOpen) {
        fetchPlans();
    }
  }, [isOpen, itemToEdit]);

  useEffect(() => {
    if (itemToEdit) {
      setNome(itemToEdit.nome);
      setDonoNome(itemToEdit.dono_nome || '');
      setDonoEmail(itemToEdit.dono_email);
      setTelefone(itemToEdit.telefone || '');
      setEndereco(itemToEdit.endereco || '');
      setDocumento(itemToEdit.documento || '');
      setNicho(itemToEdit.nicho || 'outro');
      setPlano(itemToEdit.plano || '');
      setStatus(itemToEdit.status);
      setPhotoPreview(itemToEdit.foto_url || null);
      setPassword('');
      setPhotoFile(null);
    } else {
      setNome('');
      setDonoNome('');
      setDonoEmail('');
      setTelefone('');
      setPassword('');
      setEndereco('');
      setDocumento('');
      setNicho('outro');
      setPlano(availablePlans.length > 0 ? availablePlans[0].nome : '');
      setStatus('ativa');
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  }, [itemToEdit, isOpen, availablePlans]);

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
    if (!itemToEdit && !password) {
        alert("A senha é obrigatória para cadastrar um novo estabelecimento.");
        return;
    }
    if (!plano) {
        toast.error("O plano é obrigatório.");
        return;
    }
    setIsSaving(true);
    const estabelecimentoData = {
      nome,
      dono_nome: donoNome,
      dono_email: donoEmail,
      telefone,
      endereco,
      documento,
      nicho,
      plano,
      status,
    };
    await onSave(estabelecimentoData, password, photoFile || undefined);
    setIsSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 overflow-y-auto pr-4 -mr-4" style={{ maxHeight: '65vh' }}>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Foto do Estabelecimento</label>
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
        
        <InputField id="nome" label="Nome do Estabelecimento" value={nome} onChange={(e: any) => setNome(e.target.value)} required />
        <InputField id="dono_nome" label="Nome do Proprietário" value={donoNome} onChange={(e: any) => setDonoNome(e.target.value)} required />
        <InputField id="dono_email" label="E-mail do Proprietário" value={donoEmail} onChange={(e: any) => setDonoEmail(e.target.value)} type="email" required />
        <InputField id="telefone" label="Telefone para Contato" value={telefone} onChange={(e: any) => setTelefone(e.target.value)} type="tel" required />
        {!itemToEdit && (
          <InputField id="password" label="Senha de Acesso" value={password} onChange={(e: any) => setPassword(e.target.value)} type="password" required />
        )}
        <InputField id="endereco" label="Endereço Completo" value={endereco} onChange={(e: any) => setEndereco(e.target.value)} required />
        <InputField id="documento" label="CPF / Documento" value={documento} onChange={(e: any) => setDocumento(e.target.value)} required />

        <div>
          <label htmlFor="nicho" className="block text-sm font-medium text-gray-300 mb-1">Nicho</label>
          <select id="nicho" value={nicho} onChange={e => setNicho(e.target.value as Nicho)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white">
            <option value="barbearia">Barbearia</option>
            <option value="salao">Salão de Beleza</option>
            <option value="estetica">Estética</option>
            <option value="manicure">Manicure</option>
            <option value="outro">Outro</option>
          </select>
        </div>

        <div>
          <label htmlFor="plano" className="block text-sm font-medium text-gray-300 mb-1">Plano</label>
          <select id="plano" value={plano} onChange={e => setPlano(e.target.value)} required className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white">
            <option value="" disabled>Selecione um plano</option>
            {availablePlans.map(p => (
                <option key={p.id} value={p.nome}>{p.nome} - R${p.preco.toFixed(2)}</option>
            ))}
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

export default EstabelecimentoModal;
export const BarbershopModal = EstabelecimentoModal;
