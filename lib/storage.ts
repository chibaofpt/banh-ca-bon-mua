import axios from 'axios';
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

import sharp from 'sharp';

export const uploadMenuImage = async (
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  let uploadBuffer = buffer;
  let finalContentType = contentType;
  let finalFileName = fileName;

  // Auto-compress large images to bypass ISP throttling and improve load times
  if (buffer.length > 300 * 1024 && contentType.startsWith('image/')) {
    try {
      uploadBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
        
      finalFileName = fileName.replace(/\.[^/.]+$/, "") + ".webp";
      finalContentType = 'image/webp';
      console.log(`[Storage] Compressed image from ${buffer.length} to ${uploadBuffer.length} bytes`);
    } catch (err) {
      console.error("[Storage] Image compression failed, falling back to original buffer", err);
    }
  }

  const url = `${supabaseUrl}/storage/v1/object/menu-images/${finalFileName}`;

  try {
    await axios.post(url, uploadBuffer, {
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
        'Content-Type': finalContentType,
        'x-upsert': 'true',
        Connection: 'close',
      },
      maxBodyLength: Infinity,
    });
  } catch (error: any) {
    const details = error.response?.data || error.message;
    throw new Error(`Upload failed via direct API: ${JSON.stringify(details)}`);
  }

  const { data: publicData } = getSupabase().storage
    .from('menu-images')
    .getPublicUrl(finalFileName);

  return publicData.publicUrl;
};
