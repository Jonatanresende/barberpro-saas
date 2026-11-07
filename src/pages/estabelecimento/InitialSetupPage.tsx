import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { api } from '@/services/api';
import { slugify } from '@/utils/slugify';
import { Nicho } from '@/types';
import { SERVICOS_EXEMPLO } from '@/config/servicosExemplo';

const defaultLogo = '/landing/images/logo.png';

const NICHO_OPTIONS: { value: Nicho; label: string }[] = [
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'salao',     label: 'Salão de Beleza' },
  { value: 'estetica',  label: 'Estética' },
  { value: 'manicure',  label: 'Manicure' },
  { value: 'outro',     label: 'Outro' },
];

const InitialSetupPage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [establishmentName, setEstablishmentName] = useState('');
  const [nicho, setNicho] = useState<Nicho>('barbearia');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const estId = user?.estabelecimentoId || (user as any)?.barbeariaId;
    if (!estId || !user?.id) {
      toast.error('Erro: Usuário não encontrado. Por favor, faça login novamente.');
      return;
    }
    if (!establishmentName.trim()) {
      toast.error('Por favor, insira o nome do seu estabelecimento.');
      return;
    }

    setIsSaving(true);
    const newSlug = slugify(establishmentName);
    const updates = {
      nome: establishmentName.trim(),
      link_personalizado: newSlug,
      nicho,
    };

    try {
      await api.updateEstabelecimento(estId, user.id, updates);

      // Criar serviços de exemplo para o nicho selecionado
      const exemplos = SERVICOS_EXEMPLO[nicho] || [];
      await Promise.allSettled(
        exemplos.map(s =>
          api.createServico(
            { nome: s.nome, duracao: s.duracao, preco: s.preco },
            estId,
          )
        )
      );

      toast.success('Configurado com sucesso! Serviços de exemplo criados.');
      
      navigate(`/${newSlug}/dashboard`, { replace: true });
      window.location.reload();

    } catch (error: any) {
      toast.error(`Falha ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-brand-gray rounded-xl shadow-lg p-8 border border-gray-700 text-center">
        <img src={settings?.logo_url || defaultLogo} alt="Logo" className="w-48 h-auto mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo!</h1>
        <p className="text-gray-300 mb-8">Vamos configurar o seu negócio.</p>
        
        <form onSubmit={handleSave} className="space-y-6 text-left">
          <div>
            <label htmlFor="establishmentName" className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Estabelecimento
            </label>
            <input
              type="text"
              id="establishmentName"
              value={establishmentName}
              onChange={(e) => setEstablishmentName(e.target.value)}
              className="bg-brand-dark w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold text-white"
              placeholder="Ex: Espaço Beleza & Estilo"
              required
            />
          </div>

          <div>
            <label htmlFor="nicho" className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Negócio
            </label>
            <select
              id="nicho"
              value={nicho}
              onChange={e => setNicho(e.target.value as Nicho)}
              className="bg-brand-dark w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold text-white"
            >
              {NICHO_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Serviços de exemplo serão criados automaticamente para você começar.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-brand-gold text-brand-dark font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitialSetupPage;
