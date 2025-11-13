import { supabase } from '@/src/integrations/supabase/client';
import { Barbearia } from '../types';
import { UserRole } from '../types';

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
  getBarbearias: async () => {
    const { data, error } = await supabase
      .from('barbearias')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data as Barbearia[];
  },

  createBarbeariaAndOwner: async (barbeariaData: any, password: string, photoFile?: File) => {
    // Usando a função de backend que já garante a confirmação do e-mail
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

  updateBarbearia: async (id: string, dono_id: string, updates: BarbeariaUpdate, photoFile?: File) => {
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

  deleteBarbearia: async (id: string, dono_id: string) => {
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
};