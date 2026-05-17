const axios = require('axios');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const fileName = `Usucha-${Date.now()}.png`;
const url = `${supabaseUrl}/storage/v1/object/menu-images/${fileName}`;

const filePath = 'C:\\Users\\TAICHINH-01\\Downloads\\Usucha.png';

async function testUpload() {
  try {
    const buffer = fs.readFileSync(filePath);
    console.log("Uploading with Connection: close...");
    const res = await axios.post(url, buffer, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
        'Connection': 'close' // Disable keep-alive
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    console.log("Upload Success! Status:", res.status);
  } catch (err) {
    if (err.response) {
      console.error("Upload Failed:", err.response.status, err.response.data);
    } else {
      console.error("Upload Exception:", err.message);
    }
  }
}

testUpload();
