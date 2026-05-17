import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  const results: any = {};
  const testBuffer = Buffer.from("Hello world " + Date.now());
  const fileName = `test-${Date.now()}.txt`;
  const contentType = "text/plain";

  // Test 1: @supabase/supabase-js with Buffer
  try {
    const supabase1 = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase1.storage
      .from("menu-images")
      .upload("buffer-" + fileName, testBuffer, { contentType, upsert: true });
    results.supabaseBuffer = { success: !error, error: error?.message, data };
  } catch (err: any) {
    results.supabaseBuffer = { success: false, error: err.message };
  }

  // Test 2: @supabase/supabase-js with Uint8Array
  try {
    const supabase2 = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase2.storage
      .from("menu-images")
      .upload("uint8array-" + fileName, new Uint8Array(testBuffer), { contentType, upsert: true });
    results.supabaseUint8Array = { success: !error, error: error?.message, data };
  } catch (err: any) {
    results.supabaseUint8Array = { success: false, error: err.message };
  }

  // Test 3: Raw fetch
  try {
    const url = `${supabaseUrl}/storage/v1/object/menu-images/raw-fetch-${fileName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "apikey": supabaseKey,
        "Content-Type": contentType,
      },
      body: testBuffer,
    });
    const data = await res.json();
    results.rawFetch = { success: res.ok, status: res.status, data };
  } catch (err: any) {
    results.rawFetch = { success: false, error: err.message };
  }

  // Test 4: Axios
  try {
    const url = `${supabaseUrl}/storage/v1/object/menu-images/axios-${fileName}`;
    const res = await axios.post(url, testBuffer, {
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "apikey": supabaseKey,
        "Content-Type": contentType,
      },
    });
    results.axios = { success: true, status: res.status, data: res.data };
  } catch (err: any) {
    results.axios = { success: false, error: err.message };
  }

  return NextResponse.json(results);
}
