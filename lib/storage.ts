import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Uploads a menu item image to Supabase Storage.
 */
export const uploadMenuImage = async (
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('menu-images')
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from('menu-images')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};
