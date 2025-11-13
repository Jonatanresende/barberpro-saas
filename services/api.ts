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
    // 1. Create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: barbeariaData.dono_email,
      password: password,
      options: {
        data: {
          role: UserRole.BARBEARIA,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed.');

    // 2. Upload photo if it exists
    let photoUrl = null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile);
    }

    // 3. Create the barbearia record
    const { data, error } = await supabase
      .from('barbearias')
      .insert([{ 
        ...barbeariaData, 
        dono_id: authData.user.id,
        foto_url: photoUrl,
      }])
      .select();
      
    if (error) throw error;
    return data[0] as Barbearia;
  },

  updateBarbearia: async (id: string, updates: BarbeariaUpdate, photoFile?: File) => {
    let photoUrl = null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile);
      updates.foto_url = photoUrl;
    }

    const { data, error } = await supabase
      .from('barbearias')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0] as Barbearia;
  },

  deleteBarbearia: async (id: string) => {
    // Note: This only deletes the barbearia record. 
    // The owner's auth user is not deleted automatically.
    // Deleting auth users should be a separate, deliberate action.
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