import { supabase } from '@/integrations/supabase/client';
import { Agendamento, Barbearia, Barbeiro, Servico, User, Plano, AppointmentStatus, Cliente, BarbeiroDisponibilidade } from '@/types';

export type BarbeariaInsert = Omit<Barbearia, 'id' | 'criado_em' | 'dono_id'>;
export type BarbeariaUpdate = Partial<BarbeariaInsert>;

// Helper function to upload photo and get URL
const uploadPhoto = async (photoFile: File, bucket: string): Promise<string | null> => {
  if (!photoFile) return null;

  const filePath = `public/${Date.now()}-${photoFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, photoFile);

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
};

// Helper function to upload system assets like the logo
const uploadSystemAsset = async (assetFile: File): Promise<string | null> => {
  if (!assetFile) return null;

  const fileExtension = assetFile.name.split('.').pop();
  // Using a consistent name overwrites the old logo, saving storage space.
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
  
  // Appending a timestamp forces the browser to reload the image, bypassing cache.
  return `${urlData.publicUrl}?t=${new Date().getTime()}`;
};


export const api = {
  // System Settings
  getSystemSettings: async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();
    if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error on first load
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

  // Planos
  getPlanos: async (): Promise<Plano[]> => {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .order('preco', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  },

  getPlanoByName: async (nome: string): Promise<Plano | null> => {
    const { data, error } = await supabase
      .from('planos')
      .select('*')
      .eq('nome', nome)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // no rows found
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

  // ADMIN - Barbearias
  getBarbearias: async (): Promise<Barbearia[]> => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Barbearia[];
  },

  createBarbeariaAndOwner: async (barbeariaData: any, password: string, photoFile?: File): Promise<Barbearia> => {
    const photoUrl = await uploadPhoto(photoFile!, 'fotos-barbearias');

    const { data, error } = await supabase.functions.invoke('create-barbershop', {
      body: { barbeariaData, password, photoUrl },
    });

    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }

    return data as Barbearia;
  },

  updateBarbearia: async (id: string, dono_id: string, updates: BarbeariaUpdate, photoFile?: File, heroFile?: File): Promise<Barbearia> => {
    const finalUpdates = { ...updates };

    if (photoFile) {
      finalUpdates.foto_url = await uploadPhoto(photoFile, 'fotos-barbearias');
    }
    if (heroFile) {
      finalUpdates.hero_image_url = await uploadPhoto(heroFile, 'hero-images');
    }

    const { data, error } = await supabase.functions.invoke('update-barbershop', {
      body: { 
        barbeariaId: id,
        ownerId: dono_id,
        updates: finalUpdates
      },
    });

    if (error) {
        const errorMessage = data?.error || error.message;
        throw new Error(errorMessage);
    }
    return data as Barbearia;
  },

  updateBarbershopPlan: async (barbeariaId: string, newPlanName: string): Promise<Barbearia> => {
    const { data, error } = await supabase.functions.invoke('update-barbershop-plan', {
      body: { barbeariaId, newPlanName },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data as Barbearia;
  },

  deleteBarbearia: async (id: string, dono_id: string): Promise<boolean> => {
    const { error, data } = await supabase.functions.invoke('delete-barbershop', {
      body: {
        barbeariaId: id,
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
      full_name: u.user_metadata.full_name,
      role: u.user_metadata.role,
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
      full_name: data.user_metadata.full_name,
      role: data.user_metadata.role,
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
      full_name: data.user_metadata.full_name,
      role: data.user_metadata.role,
    };
  },

  deleteAdminUser: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('delete-admin-user', {
      body: { userId },
    });
    if (error) throw new Error(data?.error || error.message);
    return data.success;
  },


  // BARBEARIA - Dashboard
  getBarbeariaDashboardData: async (barbeariaId: string) => {
    const { data, error } = await supabase.functions.invoke('get-barbershop-dashboard', {
      body: { barbeariaId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data;
  },

  getBarbeariaById: async (barbeariaId: string): Promise<Barbearia> => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .eq('id', barbeariaId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // BARBEARIA - Barbeiros
  getBarbeirosByBarbearia: async (barbeariaId: string): Promise<Barbeiro[]> => {
    const { data, error } = await supabase
      .from('barbeiros')
      .select('*')
      .eq('barbearia_id', barbeariaId);
    if (error) throw new Error(error.message);
    return data;
  },

  createBarbeiro: async (barberData: any, barbeariaId: string, password: string, photoFile?: File): Promise<Barbeiro> => {
    const photoUrl = await uploadPhoto(photoFile!, 'fotos-barbeiros');
    const finalBarberData = { ...barberData, barbearia_id: barbeariaId };
    const { data, error } = await supabase.functions.invoke('create-barber-user', {
      body: { barberData: finalBarberData, password, photoUrl },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data as Barbeiro;
  },

  createBarbeiroWithoutAuth: async (barberData: any, barbeariaId: string, photoFile?: File): Promise<Barbeiro> => {
    const photoUrl = await uploadPhoto(photoFile!, 'fotos-barbeiros');
    const { data, error } = await supabase
      .from('barbeiros')
      .insert([{ ...barberData, barbearia_id: barbeariaId, foto_url: photoUrl, user_id: null }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateBarbeiro: async (id: string, userId: string | undefined, barbeiroData: any, photoFile?: File): Promise<Barbeiro> => {
    let finalUpdates = { ...barbeiroData };
    if (photoFile) {
      finalUpdates.foto_url = await uploadPhoto(photoFile, 'fotos-barbeiros');
    }
    const { data, error } = await supabase.functions.invoke('update-barber-user', {
      body: { barberId: id, userId, updates: finalUpdates },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data as Barbeiro;
  },

  deleteBarbeiro: async (id: string, userId?: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('delete-barber-user', {
      body: { barberId: id, userId: userId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
  },

  // BARBEARIA - Serviços
  getServicosByBarbearia: async (barbeariaId: string): Promise<Servico[]> => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('barbearia_id', barbeariaId);
    if (error) throw new Error(error.message);
    return data;
  },

  createServico: async (servicoData: any, barbeariaId: string, photoFile?: File): Promise<Servico> => {
    const imageUrl = await uploadPhoto(photoFile!, 'fotos-servicos');
    const { data, error } = await supabase
      .from('servicos')
      .insert([{ ...servicoData, barbearia_id: barbeariaId, imagem_url: imageUrl }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateServico: async (id: string, servicoData: any, photoFile?: File): Promise<Servico> => {
    let finalUpdates = { ...servicoData };
    if (photoFile) {
      finalUpdates.imagem_url = await uploadPhoto(photoFile, 'fotos-servicos');
    }
    const { data, error } = await supabase
      .from('servicos')
      .update(finalUpdates)
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

  // BARBEARIA - Agendamentos
  getAgendamentosByBarbearia: async (barbeariaId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(preco)')
      .eq('barbearia_id', barbeariaId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  updateAgendamento: async (id: string, updates: { status: AppointmentStatus }): Promise<Agendamento> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .update(updates)
      .eq('id', id)
      .select('*, servicos(preco)')
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // BARBEARIA - Clientes
  getClientsByBarbearia: async (barbeariaId: string): Promise<Cliente[]> => {
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('agendamentos')
      .select('cliente_id')
      .eq('barbearia_id', barbeariaId)
      .not('cliente_id', 'is', null);

    if (appointmentError) throw new Error(appointmentError.message);

    const clientIds = [...new Set(appointmentData.map(a => a.cliente_id))];
    if (clientIds.length === 0) return [];

    const { data: clientsData, error: clientsError } = await supabase
      .from('clientes')
      .select('*')
      .in('id', clientIds);

    if (clientsError) throw new Error(clientsError.message);
    return clientsData;
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

  getAppointmentsByClient: async (clientId: string, barbeariaId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('cliente_id', clientId)
      .eq('barbearia_id', barbeariaId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // BARBEIRO - Dashboard & Agendamentos
  getBarberDashboardData: async (barbeiroId: string) => {
    const { data, error } = await supabase.functions.invoke('get-barber-dashboard', {
      body: { barbeiroId },
    });
    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }
    return data;
  },

  getAgendamentosByBarbeiro: async (barbeiroId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, servicos(preco)')
      .eq('barbeiro_id', barbeiroId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // BARBEIRO - Disponibilidade
  getBarbeiroDisponibilidade: async (barbeiroId: string, year: number, month: number): Promise<BarbeiroDisponibilidade[]> => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('barbeiro_disponibilidade')
      .select('*')
      .eq('barbeiro_id', barbeiroId)
      .gte('data', startDate)
      .lte('data', endDate);
    if (error) throw new Error(error.message);
    return data;
  },

  setBarbeiroDisponibilidade: async (disponibilidadeData: BarbeiroDisponibilidade): Promise<BarbeiroDisponibilidade> => {
    const { data, error } = await supabase
      .from('barbeiro_disponibilidade')
      .upsert(disponibilidadeData, { onConflict: 'barbeiro_id, data' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  // PUBLIC/CLIENTE
  getBarbeariaBySlug: async (slug: string): Promise<Barbearia | null> => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .eq('link_personalizado', slug)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }
    
    return data && data.length > 0 ? data[0] : null;
  },

  getBookingDataForMonth: async (barbeariaId: string, year: number, month: number) => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const [agendamentos, disponibilidades] = await Promise.all([
      supabase
        .from('agendamentos')
        .select('data, hora, barbeiro_id')
        .eq('barbearia_id', barbeariaId)
        .gte('data', startDate)
        .lte('data', endDate),
      supabase
        .from('barbeiro_disponibilidade')
        .select('*')
        .in('barbeiro_id', (await supabase.from('barbeiros').select('id').eq('barbearia_id', barbeariaId)).data?.map(b => b.id) || [])
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

  getClientAppointment: async (telefone: string): Promise<Agendamento> => {
    const { data, error } = await supabase.functions.invoke('get-client-appointment', {
      body: { telefone },
    });
    if (error) throw new Error(data?.message || data?.error || error.message);
    return data;
  },

  cancelClientAppointment: async (appointmentId: string, telefone: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('cancel-client-appointment', {
      body: { appointmentId, telefone },
    });
    if (error) throw new Error(data?.error || error.message);
    return data.success;
  },
};