import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Barbearia, Barbeiro, Plano } from '@/types';
import toast from 'react-hot-toast';
import { KIWIFY_PLAN_LINKS } from '@/utils/constants';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Barbearia>>({});
  const [initialProfile, setInitialProfile] = useState<Partial<Barbearia>>({});
  const [availablePlans, setAvailablePlans] = useState<Plano[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  useEffect(() => {
    if (user?.barbeariaId) {
      setLoading(true);
      Promise.all([
        api.getBarbeariaById(user.barbeariaId),
        api.getPlanos(),
        api.getBarbeirosByBarbearia(user.barbeariaId)
      ]).then(([profileData, plansData, barbersData]) => {
        setProfile(profileData);
        setInitialProfile(profileData);
        setAvailablePlans(plansData.filter(p => p.ativo));
        setBarbeiros(barbersData);
      }).catch(() => {
        toast.error("Falha ao carregar dados do perfil e planos.");
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
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

  const handleSavePlan = async () => {
    if (!user?.barbeariaId || !user.id || !profile.plano) return;

    const targetPlan = availablePlans.find(p => p.nome === profile.plano);
    const currentPlan = availablePlans.find(p => p.nome === initialProfile.plano);
    const activeBarberCount = barbeiros.filter(b => b.ativo).length;

    if (!targetPlan || !currentPlan) {
        toast.error("Não foi possível verificar os detalhes do plano.");
        return;
    }

    // 1. Validação de Downgrade (mantida para UX)
    const isProblematicDowngrade = 
        (targetPlan.limite_barbeiros !== null && activeBarberCount > targetPlan.limite_barbeiros) &&
        (currentPlan.limite_barbeiros === null || targetPlan.limite_barbeiros < currentPlan.limite_barbeiros);

    if (isProblematicDowngrade) {
        const excessCount = activeBarberCount - targetPlan.limite_barbeiros!;
        const confirmation = window.confirm(
            `Atenção! Seu novo plano suporta apenas ${targetPlan.limite_barbeiros} barbeiros, mas você tem ${activeBarberCount} ativos. ` +
            `Ao confirmar, ${excessCount} barbeiro(s) (os mais antigos) serão removidos permanentemente. Deseja continuar?`
        );

        if (!confirmation) {
            setProfile(prev => ({ ...prev, plano: initialProfile.plano })); // Reverte a seleção
            return;
        }
    }
    
    // 2. Redirecionamento para Kiwify
    const checkoutLink = KIWIFY_PLAN_LINKS[targetPlan.nome];

    if (!checkoutLink) {
        toast.error("Link de checkout não encontrado para este plano.");
        setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
        return;
    }

    const confirmationMessage = 
        `Você está prestes a mudar para o plano ${targetPlan.nome}. ` +
        `Você será redirecionado para a Kiwify para finalizar a compra. ` +
        `Lembre-se de cancelar sua assinatura anterior, se necessário. Deseja continuar?`;

    if (window.confirm(confirmationMessage)) {
        // Se for um downgrade problemático, chamamos a função de atualização do plano no backend
        // para que a lógica de remoção de barbeiros seja executada ANTES do redirecionamento.
        if (isProblematicDowngrade) {
            setIsSavingPlan(true);
            try {
                await api.updateBarbershopPlan(user.barbeariaId, profile.plano);
                toast.success('Barbeiros em excesso removidos. Redirecionando para o checkout...');
            } catch (err: any) {
                toast.error(`Falha na pré-validação: ${err.message}`);
                setIsSavingPlan(false);
                setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
                return;
            } finally {
                setIsSavingPlan(false);
            }
        }
        
        // Redireciona o usuário para o link de checkout
        window.open(checkoutLink, '_blank');
        
        // O plano no DB só será atualizado quando o webhook da Kiwify retornar o sucesso da compra.
        toast.success("Redirecionando para o checkout. Após a compra, seu painel será atualizado automaticamente.");
        
        // Reverte a seleção visualmente para o plano inicial até que o webhook confirme a mudança.
        setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
    } else {
        setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
    }
  };

  if (loading) return <p className="text-center text-gray-400">Carregando perfil...</p>;

  return (
    <div className="space-y-8">
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
          <button onClick={handleSaveProfile} disabled={isSaving} className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="bg-brand-dark p-6 rounded-lg border border-brand-gray max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-6">Gerenciar Plano</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="plano" className="block text-sm font-medium text-gray-300 mb-2">Seu Plano</label>
            <select 
              id="plano" 
              name="plano" 
              value={profile.plano || ''} 
              onChange={handleInputChange} 
              className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold"
            >
              {availablePlans.map(p => (
                <option key={p.id} value={p.nome}>
                  {p.nome} - R$ {p.preco.toFixed(2)}/mês
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-brand-gray">
          <button onClick={handleSavePlan} disabled={isSavingPlan} className="bg-brand-gold text-brand-dark font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50">
            {isSavingPlan ? 'Validando...' : 'Mudar de Plano'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-4">
            Ao clicar em "Mudar de Plano", você será redirecionado para a Kiwify para concluir a compra da nova assinatura.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;