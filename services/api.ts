import { supabase } from '@/src/integrations/supabase/client';
import { Barbearia } from '../types';

export type BarbeariaInsert = Omit<Barbearia, 'id' | 'criado_em'>;
export type BarbeariaUpdate = Partial<BarbeariaInsert>;

export const api = {
  // ADMIN - Barbearias
  getBarbearias: async () => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data as Barbearia[];
  },

  createBarbearia: async (barbearia: BarbeariaInsert) => {
    const { data, error } = await supabase
      .from('barbearias')
      .insert([barbearia])
      .select();
    if (error) throw error;
    return data[0] as Barbearia;
  },

  updateBarbearia: async (id: string, updates: BarbeariaUpdate) => {
    const { data, error } = await supabase
      .from('barbearias')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0] as Barbearia;
  },

  deleteBarbearia: async (id: string) => {
    const { error } = await supabase
      .from('barbearias')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Mocked stats for now
  getAdminDashboardStats: async () => {
    const { count, error } = await supabase.from('barbearias').select('*', { count: 'exact', head: true });
    if (error) console.error("Error fetching stats", error);
    return {
      totalBarbearias: count ?? 0,
      usuariosAtivos: 150, // mock
      totalBarbeiros: 0, // mock
    };
  },
};