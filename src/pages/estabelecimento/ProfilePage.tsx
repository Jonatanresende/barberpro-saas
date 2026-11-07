import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Estabelecimento, Profissional, Plano, Nicho } from '@/types';
import toast from 'react-hot-toast';
import { KIWIFY_PLAN_LINKS } from '@/utils/constants';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Estabelecimento>>({});
  const [initialProfile, setInitialProfile] = useState<Partial<Estabelecimento>>({});
  const [availablePlans, setAvailablePlans] = useState<Plano[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  useEffect(() => {
    const estId = user?.estabelecimentoId || (user as any)?.barbeariaId;
    if (estId) {
      setLoading(true);
      Promise.all([
        api.getEstabelecimentoById(estId),
        api.getPlanos(),
        api.getProfissionaisByEstabelecimento(estId)
      ]).then(([profileData, plansData, profData]) => {
        setProfile(profileData);
        setInitialProfile(profileData);
        setAvailablePlans(plansData.filter(p => p.ativo));
        setProfissionais(profData);
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
    const estId = user?.estabelecimentoId || (user as any)?.barbeariaId;
    if (!estId || !user?.id) return;

    const updates = {
      dono_nome: profile.dono_nome,
      dono_email: profile.dono_email,
      telefone: profile.telefone,
      documento: profile.documento,
      nicho: profile.nicho,
    };

    setIsSaving(true);
    toast.promise(
      api.updateEstabelecimento(estId, user.id, updates),
      {
        loading: 'Salvando perfil...',
        success: 'Perfil atualizado com sucesso!',
        error: (err) => `Falha ao salvar: ${err.message}`,
      }
    ).finally(() => setIsSaving(false));
  };

  const handleSavePlan = async () => {
    const estId = user?.estabelecimentoId || (user as any)?.barbeariaId;
    if (!estId || !user?.id || !profile.plano) return;

    const targetPlan = availablePlans.find(p => p.nome === profile.plano);
    const currentPlan = availablePlans.find(p => p.nome === initialProfile.plano);
    const activeProfCount = profissionais.filter(b => b.ativo).length;

    if (!targetPlan || !currentPlan) {
        toast.error("Não foi possível verificar os detalhes do plano.");
        return;
    }

    const isProblematicDowngrade = 
        (targetPlan.limite_profissionais !== null && targetPlan.limite_profissionais !== undefined && activeProfCount > targetPlan.limite_profissionais) &&
        (currentPlan.limite_profissionais === null || currentPlan.limite_profissionais === undefined || targetPlan.limite_profissionais < currentPlan.limite_profissionais);

    if (isProblematicDowngrade) {
        const excessCount = activeProfCount - targetPlan.limite_profissionais!;
        const confirmation = window.confirm(
            `Atenção! Seu novo plano suporta apenas ${targetPlan.limite_profissionais} profissionais, mas você tem ${activeProfCount} ativos. ` +
            `Ao confirmar, ${excessCount} profissional(is) serão removidos permanentemente. Deseja continuar?`
        );

        if (!confirmation) {
            setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
            return;
        }
    }
    
    const checkoutLink = KIWIFY_PLAN_LINKS[targetPlan.nome];

    if (!checkoutLink) {
        toast.error("Link de checkout não encontrado para este plano.");
        setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
        return;
    }

    const confirmationMessage = 
        `Você está prestes a mudar para o plano ${targetPlan.nome}. ` +
        `Você será redirecionado para a plataforma de pagamento. ` +
        `Após a assinatura, seu painel será atualizado. Deseja continuar?`;

    if (window.confirm(confirmationMessage)) {
        if (isProblematicDowngrade) {
            setIsSavingPlan(true);
            try {
                await api.updateEstabelecimentoPlan(estId, profile.plano);
                toast.success('Profissionais em excesso removidos. Redirecionando para o checkout...');
            } catch (err: any) {
                toast.error(`Falha na pré-validação: ${err.message}`);
                setIsSavingPlan(false);
                setProfile(prev => ({ ...prev, plano: initialProfile.plano }));
                return;
            } finally {
                setIsSavingPlan(false);
            }
        }
        
        window.open(checkoutLink, '_blank');
        toast.success("Redirecionando para o checkout. Após a compra, seu painel será atualizado automaticamente.");
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
          <div>
            <label htmlFor="nicho" className="block text-sm font-medium text-gray-300 mb-2">Nicho do Negócio</label>
            <select id="nicho" name="nicho" value={profile.nicho || 'outro'} onChange={handleInputChange} className="bg-brand-gray w-full px-3 py-2 rounded-md border border-gray-600 focus:ring-brand-gold focus:border-brand-gold text-white">
              <option value="barbearia">Barbearia</option>
              <option value="salao">Salão de Beleza</option>
              <option value="estetica">Estética</option>
              <option value="manicure">Manicure</option>
              <option value="outro">Outro</option>
            </select>
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
      </div>
    </div>
  );
};

export default ProfilePage;
