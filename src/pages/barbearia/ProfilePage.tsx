import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/services/api';
import { Barbearia } from '@/types';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Barbearia>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.barbeariaId) {
      setLoading(true);
      api.getBarbeariaById(user.barbeariaId)
        .then(setProfile)
        .catch(() => toast.error("Falha ao carregar dados do perfil."))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.barbeariaId || !user.id) return;

    const updates = {
      dono_nome: profile.dono_nome,
      dono_email: profile.dono_email,
      telefone: profile.telefone,
      documento: profile.documento,
    };

    setIsSaving(true);
    toast.promise(
      api.updateBarbearia(user.barbeariaId, user.id, updates),
      {
        loading: 'Salvando perfil...',
        success: 'Perfil atualizado com sucesso!',
        error: (err) => `Falha ao salvar: ${err.message}`,
      }
    ).finally(() => setIsSaving(false));
  };

  if (loading) return <p className="text-center text-gray-400">Carregando perfil...</p>;

  return (
    <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-6">Meu Perfil</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="dono_nome" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
          <input type="text" id="dono_nome" name="dono_nome" value={profile.dono_nome || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
        </div>
        <div>
          <label htmlFor="dono_email" className="block text-sm font-medium text-gray-300 mb-2">E-mail de Acesso</label>
          <input type="email" id="dono_email" name="dono_email" value={profile.dono_email || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
        </div>
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
          <input type="tel" id="telefone" name="telefone" value={profile.telefone || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
        </div>
        <div>
          <label htmlFor="documento" className="block text-sm font-medium text-gray-300 mb-2">CPF/Documento</label>
          <input type="text" id="documento" name="documento" value={profile.documento || ''} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"/>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-brand-gray">
        <button onClick={handleSave} disabled={isSaving} className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50">
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;