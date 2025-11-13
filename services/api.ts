import { supabase } from '@/src/integrations/supabase/client';
import { Agendamento, Barbearia, Barbeiro, Servico } from '../types';

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
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('fotos-barbearias')
    .getPublicUrl(filePath);
  
  return urlData.publicUrl;
};


export const api = {
  // ADMIN - Barbearias
  getBarbearias: async (): Promise<Barbearia[]> => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
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

  getAdminDashboardStats: async () => {
    const { count, error } = await supabase.from('barbearias').select('*', { count: 'exact', head: true });
    if (error) console.error("Error fetching stats", error);
    return {
      totalBarbearias: count ?? 0,
      usuariosAtivos: 150, // mock
      totalBarbeiros: 0, // mock
    };
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
    if (error) throw error;
    return data;
  },

  // BARBEARIA - Serviços
  getServicosByBarbearia: async (barbeariaId: string): Promise<Servico[]> => {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('barbearia_id', barbeariaId);
    if (error) throw error;
    return data;
  },

  // BARBEARIA - Agendamentos
  getAgendamentosByBarbearia: async (barbeariaId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('barbearia_id', barbeariaId)
      .order('data', { ascending: false });
    if (error) throw error;
    return data;
  },

  // BARBEIRO - Agendamentos
  getAgendamentosByBarbeiro: async (barbeiroId: string): Promise<Agendamento[]> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('barbeiro_id', barbeiroId)
      .order('data', { ascending: false });
    if (error) throw error;
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
      throw error;
    }
    return data;
  },

  createAgendamento: async (agendamentoData: Partial<Agendamento>): Promise<Agendamento> => {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([agendamentoData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};