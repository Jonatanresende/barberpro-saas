import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { api } from '@/services/api';
import { slugify } from '@/utils/slugify';

const defaultLogo = '/landing/images/logo.png';

const InitialSetupPage = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [barbershopName, setBarbershopName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.barbeariaId || !user.id) {
      toast.error('Erro: Usuário não encontrado. Por favor, faça login novamente.');
      return;
    }
    if (!barbershopName.trim()) {
      toast.error('Por favor, insira o nome da sua barbearia.');
      return;
    }

    setIsSaving(true);
    const newSlug = slugify(barbershopName);
    const updates = {
      nome: barbershopName.trim(),
      link_personalizado: newSlug,
    };

    try {
      await api.updateBarbearia(user.barbeariaId, user.id, updates);
      toast.success('Barbearia configurada com sucesso!');
      
      // Força a atualização dos dados do usuário no contexto (opcional, mas bom para UX)
      // A melhor abordagem é o onAuthStateChange lidar com isso, mas um reload resolve para o usuário.
      // A navegação para a nova URL já vai acionar as verificações necessárias.
      navigate(`/${newSlug}/dashboard`, { replace: true });
      window.location.reload(); // Garante que o AuthContext pegue o novo slug

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
        <p className="text-gray-300 mb-8">Vamos dar um nome oficial para a sua barbearia.</p>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="barbershopName" className="block text-sm font-medium text-gray-300 mb-2 text-left">
              Nome da sua Barbearia
            </label>
            <input
              type="text"
              id="barbershopName"
              value={barbershopName}
              onChange={(e) => setBarbershopName(e.target.value)}
              className="bg-brand-dark w-full px-4 py-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold text-white"
              placeholder="Ex: Barbearia Clássica"
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