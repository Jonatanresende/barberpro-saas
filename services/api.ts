import { supabase } from '@/src/integrations/supabase/client';
import { Agendamento, Barbearia, Barbeiro, Servico, User, Plano } from '../types';

export type BarbeariaInsert = Omit<Barbearia, 'id' | 'criado_em' | 'dono_id'>;
export type BarbeariaUpdate = Partial<BarbeariaInsert>;

// Helper function to upload photo and get URL
const uploadPhoto = async (photoFile: File): Promise<string | null> => {
  if (!photoFile) return null;

  const filePath = `public/${Date.now()}-${photoFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from('fotos-barbearias')
    .upload(filePath, photoFile);

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from('fotos-barbearias')
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

  updateSystemSettings: async (updates: { system_name?: string; support_email?: string }, logoFile?: File) => {
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
    let photoUrl = null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile);
    }

    const { data, error } = await supabase.functions.invoke('create-barbershop', {
      body: { barbeariaData, password, photoUrl },
    });

    if (error) {
      const errorMessage = data?.error || error.message;
      throw new Error(errorMessage);
    }

    return data as Barbearia;
  },

  updateBarbearia: async (id: string, dono_id: string, updates: BarbeariaUpdate, photoFile?: File): Promise<Barbearia> => {
    let photoUrl = updates.foto_url || null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile);
    }

    const finalUpdates = { ...updates, foto_url: photoUrl };

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
  getBarbeariaDashboardStats: async (barbeariaId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { count: agendamentosCount, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaId)
      .eq('data', today);

    if (agendamentosError) console.error("Error fetching appointments count", agendamentosError);

    const { count: barbeirosCount, error: barbeirosError } = await supabase
      .from('barbeiros')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaId);

    if (barbeirosError) console.error("Error fetching barbers count", barbeirosError);

    const { data: clientes, error: clientesError } = await supabase
      .from('agendamentos')
      .select('cliente_id')
      .eq('barbearia_id', barbeariaId);

    if (clientesError) console.error("Error fetching clients", clientesError);
    
    const uniqueClients = new Set(clientes?.map(a => a.cliente_id) || []);

    return {
      totalAgendamentos: agendamentosCount ?? 0,
      totalBarbeiros: barbeirosCount ?? 0,
      totalClientes: uniqueClients.size,
    };
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

  // BARBEARIA - Serviços
  getServicosByBarbearia: async (barbeariaId: string): Promise<Servico[]> => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('barbearia_id', barbeariaId);
    if (error) throw new Error(error.message);
    return data;
  },

  // BARBEARIA - Agendamentos
  getAgendamentosByBarbearia: async (barbeariaId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('barbearia_id', barbeariaId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // BARBEIRO - Agendamentos
  getAgendamentosByBarbeiro: async (barbeiroId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('barbeiro_id', barbeiroId)
      .order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  // PUBLIC/CLIENTE
  getBarbeariaBySlug: async (slug: string): Promise<Barbearia | null> => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .eq('link_personalizado', slug)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is fine
      throw new Error(error.message);
    }
    return data;
  },

  createAgendamento: async (agendamentoData: Partial<Agendamento>): Promise<Agendamento> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([agendamentoData])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};