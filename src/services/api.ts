import { supabase } from '@/integrations/supabase/client';
import { Agendamento, Estabelecimento, Profissional, Servico, User, Plano, AppointmentStatus, Cliente, ProfissionalDisponibilidade, TipoProfissional, GastoSaas } from '@/types';

export type EstabelecimentoInsert = Omit<Estabelecimento, 'id' | 'criado_em' | 'dono_id'>;
export type EstabelecimentoUpdate = Partial<EstabelecimentoInsert>;

// Função auxiliar para upload de fotos e obtenção de URL
const uploadPhoto = async (photoFile: File, bucket: string): Promise<string | null> => {
  if (!photoFile) return null;

  const filePath = `public/${Date.now()}-${photoFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, photoFile, { upsert: true });

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
};

// Função auxiliar para upload de assets do sistema (ex: logo)
const uploadSystemAsset = async (assetFile: File): Promise<string | null> => {
  if (!assetFile) return null;

  const fileExtension = assetFile.name.split('.').pop();
  const filePath = `public/logo.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from('system-assets')
    .upload(filePath, assetFile, { upsert: true });

  if (uploadError) {
    console.error('Error uploading system asset:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from('system-assets')
    .getPublicUrl(filePath);

  return `${urlData.publicUrl}?t=${new Date().getTime()}`;
};

export const api = {
  // Configurações do Sistema
  getSystemSettings: async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data;
  },

  updateSystemSettings: async (updates: {
    system_name?: string;
    support_email?: string;
    contact_email?: string;
    tos_link?: string;
  }, logoFile?: File) => {
    let logo_url;
    if (logoFile) {
      logo_url = await uploadSystemAsset(logoFile);
    }

    const finalUpdates: any = { ...updates };
    if (logo_url) {
      finalUpdates.logo_url = logo_url;
    }

    finalUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('system_settings')
      .update(finalUpdates)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Gastos SaaS (Admin)
  getSaasExpenses: async (): Promise<GastoSaas[]> => {
    const { data, error } = await supabase
      .from('gastos_saas')
      .select('*')
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  createSaasExpense: async (expenseData: Omit<GastoSaas, 'id' | 'user_id' | 'created_at'>): Promise<GastoSaas> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const { data, error } = await supabase
      .from('gastos_saas')
      .insert([{ ...expenseData, user_id: user.id }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateSaasExpense: async (id: string, expenseData: Partial<Omit<GastoSaas, 'id' | 'user_id' | 'created_at'>>): Promise<GastoSaas> => {
    const { data, error } = await supabase
      .from('gastos_saas')
      .update(expenseData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteSaasExpense: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('gastos_saas')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Planos
  getPlanos: async (): Promise<Plano[]> => {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .order('preco', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  },

  getPlanoByName: async (nome: string | undefined | null): Promise<Plano | null> => {
    if (!nome) {
      console.warn(`Plano com nome "${nome}" não encontrado.`);
      return null;
    }

    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .eq('nome', nome)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`Plano com nome "${nome}" não encontrado.`);
        return null;
      }
      throw new Error(error.message);
    }
    return data;
  },

  createPlano: async (planoData: Omit<Plano, 'id'>): Promise<Plano> => {
    const { data, error } = await supabase
      .from('planos')
      .insert([planoData])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updatePlano: async (id: string, planoData: Partial<Omit<Plano, 'id'>>): Promise<Plano> => {
    const { data, error } = await supabase
      .from('planos')
      .update(planoData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deletePlano: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('planos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Tipos de Profissional
  getTiposProfissional: async (estabelecimentoId: string): Promise<TipoProfissional[]> => {
    const { data, error } = await supabase
      .from('tipos_profissional')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  },

  createTipoProfissional: async (estabelecimentoId: string, typeData: Omit<TipoProfissional, 'id' | 'estabelecimento_id' | 'created_at'>): Promise<TipoProfissional> => {
    const { data, error } = await supabase
      .from('tipos_profissional')
      .insert([{ ...typeData, estabelecimento_id: estabelecimentoId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateTipoProfissional: async (id: string, typeData: Partial<Omit<TipoProfissional, 'id' | 'estabelecimento_id' | 'created_at'>>): Promise<TipoProfissional> => {
    const { data, error } = await supabase
      .from('tipos_profissional')
      .update(typeData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteTipoProfissional: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('tipos_profissional')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ADMIN - Estabelecimentos
  getEstabelecimentos: async (): Promise<Estabelecimento[]> => {
    const { data, error } = await supabase
      .from('estabelecimentos')
      .select('id, nome, dono_email, dono_id, plano, status, criado_em, foto_url, dono_nome, telefone, endereco, documento, link_personalizado, nicho')
      .order('criado_em', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Estabelecimento[];
  },

  createEstabelecimentoAndOwner: async (estabelecimentoData: any, password: string, photoFile?: File): Promise<Estabelecimento> => {
    const photoUrl = await uploadPhoto(photoFile!, 'fotos-estabelecimentos');

    const { data, error } = await supabase.functions.invoke('create-establishment', {
      body: { estabelecimentoData, password, photoUrl },
    });

    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }

    return data as Estabelecimento;
  },

  updateEstabelecimento: async (id: string, dono_id: string, updates: EstabelecimentoUpdate, photoFile?: File, heroFile?: File): Promise<Estabelecimento> => {
    const finalUpdates = { ...updates };

    if (photoFile) {
      finalUpdates.foto_url = await uploadPhoto(photoFile, 'fotos-estabelecimentos');
    }
    if (heroFile) {
      finalUpdates.hero_image_url = await uploadPhoto(heroFile, 'fotos-estabelecimentos');
    }

    const { data, error } = await supabase.functions.invoke('update-establishment', {
      body: {
        estabelecimentoId: id,
        ownerId: dono_id,
        updates: finalUpdates
      },
    });

    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data as Estabelecimento;
  },

  updateEstabelecimentoPlan: async (estabelecimentoId: string, newPlanName: string): Promise<Estabelecimento> => {
    const { data, error } = await supabase.functions.invoke('update-establishment-plan', {
      body: { estabelecimentoId, newPlanName },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data as Estabelecimento;
  },

  deleteEstabelecimento: async (id: string, dono_id: string): Promise<boolean> => {
    const { error, data } = await supabase.functions.invoke('delete-establishment', {
      body: {
        estabelecimentoId: id,
        ownerId: dono_id,
      }
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return true;
  },

  getAdminDashboardData: async () => {
    const { data, error } = await supabase.functions.invoke('get-admin-dashboard');

    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }

    return data;
  },

  // ADMIN - Users
  getAdminUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.functions.invoke('get-admin-users');
    if (error) throw new Error(error.message);
    return data.map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name,
      role: u.app_metadata?.role,
    }));
  },

  createAdminUser: async (email: string, password: string, fullName: string): Promise<User> => {
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: { email, password, fullName },
    });
    if (error) throw new Error(data?.error || error.message);
    return {
      id: data.id,
      email: data.email,
      full_name: data.user_metadata?.full_name,
      role: data.app_metadata?.role,
    };
  },

  updateAdminUser: async (userId: string, userData: { email: string; full_name: string }): Promise<User> => {
    const { data, error } = await supabase.functions.invoke('update-admin-user', {
      body: { userId, email: userData.email, fullName: userData.full_name },
    });
    if (error) throw new Error(data?.error || error.message);
    return {
      id: data.id,
      email: data.email,
      full_name: data.user_metadata?.full_name,
      role: data.app_metadata?.role,
    };
  },

  deleteAdminUser: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('delete-admin-user', {
      body: { userId },
    });
    if (error) throw new Error(data?.error || error.message);
    return data.success;
  },

  // ESTABELECIMENTO - Dashboard
  getEstabelecimentoDashboardData: async (estabelecimentoId: string) => {
    const { data, error } = await supabase.functions.invoke('get-establishment-dashboard', {
      body: { estabelecimentoId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data;
  },

  getEstabelecimentoById: async (estabelecimentoId: string): Promise<Estabelecimento> => {
    const { data, error } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('id', estabelecimentoId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ESTABELECIMENTO - Profissionais
  getProfissionaisByEstabelecimento: async (estabelecimentoId: string): Promise<Profissional[]> => {
    const { data, error } = await supabase
      .from('profissionais')
      .select('*, tipos_profissional(nome, percentual_comissao)')
      .eq('estabelecimento_id', estabelecimentoId);
    if (error) throw new Error(error.message);
    return data;
  },

  createProfissional: async (profissionalData: any, estabelecimentoId: string, password: string, photoFile?: File): Promise<Profissional> => {
    const photoUrl = await uploadPhoto(photoFile!, 'fotos-profissionais');
    const finalProfissionalData = { ...profissionalData, estabelecimento_id: estabelecimentoId };
    const { data, error } = await supabase.functions.invoke('create-professional-user', {
      body: { profissionalData: finalProfissionalData, password, photoUrl },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data as Profissional;
  },

  createProfissionalWithoutAuth: async (profissionalData: any, estabelecimentoId: string, photoFile?: File): Promise<Profissional> => {
    const photoUrl = await uploadPhoto(photoFile!, 'fotos-profissionais');
    const { data, error } = await supabase
      .from('profissionais')
      .insert([{ ...profissionalData, estabelecimento_id: estabelecimentoId, foto_url: photoUrl, user_id: null }])
      .select('*, tipos_profissional(nome, percentual_comissao)')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateProfissional: async (id: string, userId: string | undefined, profissionalData: any, photoFile?: File, password?: string): Promise<Profissional> => {
    let finalUpdates = { ...profissionalData };
    if (photoFile) {
      finalUpdates.foto_url = await uploadPhoto(photoFile, 'fotos-profissionais');
    }
    const { data, error } = await supabase.functions.invoke('update-professional-user', {
      body: {
        profissionalId: id,
        userId,
        updates: finalUpdates,
        password: password || undefined,
        senha: password || undefined,
      },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    const { data: updatedProfissional, error: fetchError } = await supabase
      .from('profissionais')
      .select('*, tipos_profissional(nome, percentual_comissao)')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(fetchError.message);
    return updatedProfissional;
  },

  deleteProfissional: async (id: string, userId?: string): Promise<void> => {
    const { error, data } = await supabase.functions.invoke('delete-professional-user', {
      body: { profissionalId: id, userId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
  },

  // ESTABELECIMENTO - Serviços
  getServicosByEstabelecimento: async (estabelecimentoId: string): Promise<Servico[]> => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId);
    if (error) throw new Error(error.message);
    return data;
  },

  createServico: async (servicoData: any, estabelecimentoId: string): Promise<Servico> => {
    const { data, error } = await supabase
      .from('servicos')
      .insert([{ ...servicoData, estabelecimento_id: estabelecimentoId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateServico: async (id: string, servicoData: any): Promise<Servico> => {
    const { data, error } = await supabase
      .from('servicos')
      .update(servicoData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteServico: async (id: string): Promise<void> => {
    const { error } = await supabase.from('servicos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ESTABELECIMENTO - Agendamentos
  getAgendamentosByEstabelecimento: async (estabelecimentoId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(preco), profissionais(tipos_profissional(percentual_comissao))')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  updateAgendamento: async (id: string, updates: { status: AppointmentStatus }): Promise<Agendamento> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .update(updates)
      .eq('id', id)
      .select('*, servicos(preco), profissionais(tipos_profissional(percentual_comissao))')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // ESTABELECIMENTO - Clientes
  getClientsByEstabelecimento: async (estabelecimentoId: string): Promise<Cliente[]> => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId);

    if (error) throw new Error(error.message);
    return data || [];
  },

  updateClient: async (clientId: string, updates: { nome: string; telefone: string }): Promise<Cliente> => {
    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getAppointmentsByClient: async (clientId: string, estabelecimentoId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(preco), profissionais(tipos_profissional(percentual_comissao))')
      .eq('cliente_id', clientId)
      .eq('estabelecimento_id', estabelecimentoId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // PROFISSIONAL - Dashboard & Agendamentos
  getProfissionalDashboardData: async (profissionalId: string) => {
    const { data, error } = await supabase.functions.invoke('get-professional-dashboard', {
      body: { profissionalId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data;
  },

  getAgendamentosByProfissional: async (profissionalId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(preco), profissionais(tipos_profissional(percentual_comissao))')
      .eq('profissional_id', profissionalId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // PROFISSIONAL - Disponibilidade
  getProfissionalDisponibilidade: async (profissionalId: string, year: number, month: number): Promise<ProfissionalDisponibilidade[]> => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('profissional_disponibilidade')
      .select('*')
      .eq('profissional_id', profissionalId)
      .gte('data', startDate)
      .lte('data', endDate);
    if (error) throw new Error(error.message);
    return data;
  },

  setProfissionalDisponibilidade: async (disponibilidadeData: ProfissionalDisponibilidade): Promise<ProfissionalDisponibilidade> => {
    const { data, error } = await supabase
      .from('profissional_disponibilidade')
      .upsert(disponibilidadeData, { onConflict: 'profissional_id, data' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // PROFISSIONAL - Desempenho (Últimos 30 dias)
  getProfissionalPerformanceData: async (profissionalId: string) => {
    const { data, error } = await supabase.functions.invoke('get-professional-performance', {
      body: { profissionalId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data;
  },

  // PUBLIC/CLIENTE
  getEstabelecimentoBySlug: async (slug: string): Promise<Estabelecimento | null> => {
    const { data, error } = await supabase
      .from('estabelecimentos_publico')
      .select('*')
      .eq('link_personalizado', slug)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return data && data.length > 0 ? (data[0] as unknown as Estabelecimento) : null;
  },

  getProfissionaisPublicos: async (estabelecimentoId: string): Promise<Profissional[]> => {
    const { data, error } = await supabase
      .from('profissionais_publico')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId);
    if (error) throw new Error(error.message);
    return (data || []) as unknown as Profissional[];
  },

  getBookingDataForMonth: async (estabelecimentoId: string, year: number, month: number) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const [agendamentos, disponibilidades] = await Promise.all([
      supabase
        .from('agendamentos_ocupados')
        .select('data, hora, profissional_id')
        .eq('estabelecimento_id', estabelecimentoId)
        .gte('data', startDate)
        .lte('data', endDate),
      supabase
        .from('profissional_disponibilidade')
        .select('*')
        .in('profissional_id', (await supabase.from('profissionais_publico').select('id').eq('estabelecimento_id', estabelecimentoId)).data?.map(b => b.id) || [])
        .gte('data', startDate)
        .lte('data', endDate)
    ]);

    if (agendamentos.error) throw new Error(agendamentos.error.message);
    if (disponibilidades.error) throw new Error(disponibilidades.error.message);

    return { agendamentos: agendamentos.data, disponibilidades: disponibilidades.data };
  },

  createAgendamento: async (agendamentoData: Partial<Agendamento>): Promise<Agendamento> => {
    const { data, error } = await supabase.functions.invoke('create-appointment', {
      body: { agendamentoData },
    });
    if (error) throw new Error(data?.error || error.message);
    return data;
  },

  getClientAppointment: async (telefone: string, estabelecimentoId: string): Promise<Agendamento | null> => {
    const { data, error } = await supabase.functions.invoke('get-client-appointment', {
      body: { telefone, estabelecimento_id: estabelecimentoId },
    });
    if (error) throw new Error(data?.message || data?.error || error.message);
    return data;
  },

  getClientAppointmentsHistory: async (telefone: string, estabelecimentoId: string): Promise<{ clientName: string, appointments: Agendamento[] } | null> => {
    const { data, error } = await supabase.functions.invoke('get-client-appointments-history', {
      body: { telefone, estabelecimento_id: estabelecimentoId },
    });
    if (error) throw new Error(data?.message || data?.error || error.message);
    return data;
  },

  cancelClientAppointment: async (appointmentId: string, telefone: string, estabelecimentoId: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('cancel-client-appointment', {
      body: { appointmentId, telefone, estabelecimento_id: estabelecimentoId },
    });
    if (error) throw new Error(data?.error || error.message);
    return data.success;
  },
};
