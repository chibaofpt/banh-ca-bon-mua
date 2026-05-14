import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

/** Returns a singleton instance of the Supabase client for storage operations. */
function getSupabase() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Role Key are required for storage operations.');
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);
  return supabase;
}

/**
 * Uploads a menu item image to Supabase Storage.
 */
export const uploadMenuImage = async (
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> => {
  const { data, error } = await getSupabase().storage
    .from('menu-images')
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicData } = getSupabase().storage
    .from('menu-images')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};
