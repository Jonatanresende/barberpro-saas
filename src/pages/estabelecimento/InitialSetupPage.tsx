import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { api } from '@/services/api';
import { slugify } from '@/utils/slugify';

const defaultLogo = '/landing/images/logo.png';

const InitialSetupPage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [establishmentName, setEstablishmentName] = useState('');
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
    };

    try {
      await api.updateEstabelecimento(estId, user.id, updates);
      toast.success('Configurado com sucesso!');
      
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
        <p className="text-gray-300 mb-8">Vamos dar um nome oficial para o seu negócio.</p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="establishmentName" className="block text-sm font-medium text-gray-300 mb-2 text-left">
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
