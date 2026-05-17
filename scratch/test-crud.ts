import { SignJWT } from "jose";
import { config } from "dotenv";
config({ path: ".env" });

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_dev_only_do_not_use_in_prod");
const BASE_URL = "http://localhost:3000";

const POWDER_SAMPLE_A_ID = "8f6e5dc4-08b2-4a90-98fc-873b1534e235";
const POWDER_SAMPLE_B_ID = "e72e1b9b-a927-4d62-9ac5-f420917e8762";

async function main() {
  // Generate admin token
  const token = await new SignJWT({ id: "admin-test-id", role: "ADMIN", phone_number: "+84111222333" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  const headers = {
    "Cookie": `access_token=${token}`
  };

  const jsonHeaders = {
    ...headers,
    "Content-Type": "application/json"
  };

  console.log("=== BƯỚC 0-A: Tạo Sample A ===");
  const res0a = await fetch(`${BASE_URL}/api/admin/powders`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      id: POWDER_SAMPLE_A_ID,
      name: "Sample A",
      manufacturer: "Test Manufacturer",
      description: "Bột test cho Latte — xóa sau khi test xong",
      price_per_gram: 5000,
      type: "NONE",
      fragrance: 3,
      body: 3,
      bitterness: 2,
      umami: 3,
      color: 3,
      is_available: true
    })
  });
  const data0a = await res0a.json();
  console.log(data0a);
  const actualPowderAId = data0a.data?.id || POWDER_SAMPLE_A_ID;

  console.log("\n=== BƯỚC 0-B: Tạo Sample B ===");
  const res0b = await fetch(`${BASE_URL}/api/admin/powders`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      id: POWDER_SAMPLE_B_ID,
      name: "Sample B",
      manufacturer: "Test Manufacturer",
      description: "Bột test cho Fusion — xóa sau khi test xong",
      price_per_gram: 7000,
      type: "NONE",
      fragrance: 4,
      body: 4,
      bitterness: 3,
      umami: 2,
      color: 4,
      is_available: true
    })
  });
  const data0b = await res0b.json();
  console.log(data0b);
  const actualPowderBId = data0b.data?.id || POWDER_SAMPLE_B_ID;

  console.log("\n=== BƯỚC 1: CREATE Latte ===");
  const form1 = new FormData();
  form1.append("name", "Latte Sample A");
  form1.append("description", "Latte test item dùng bột Sample A");
  form1.append("category", "latte");
  form1.append("is_seasonal", "false");
  form1.append("matcha_powder_id", actualPowderAId);
  form1.append("sort_order", "99");
  form1.append("sizes", JSON.stringify([
    { size: "M", base_price_vnd: 45000 },
    { size: "L", base_price_vnd: 55000 },
    { size: "XL", base_price_vnd: 65000 }
  ]));

  const res1 = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: "POST",
    headers,
    body: form1
  });
  const data1 = await res1.json();
  console.log(data1);
  const LATTE_ITEM_ID = data1.data?.id;

  console.log("\n=== BƯỚC 2: CREATE Fusion ===");
  const form2 = new FormData();
  form2.append("name", "Fusion Sample B");
  form2.append("description", "Fusion test item dùng bột Sample B");
  form2.append("category", "fusion");
  form2.append("is_seasonal", "false");
  form2.append("default_powder_id", actualPowderBId);
  form2.append("base_liquid_note", "Base: Oat milk");
  form2.append("sort_order", "98");
  form2.append("sizes", JSON.stringify([
    { size: "M", base_price_vnd: 50000 },
    { size: "L", base_price_vnd: 60000 },
    { size: "XL", base_price_vnd: null }
  ]));

  const res2 = await fetch(`${BASE_URL}/api/admin/menu`, {
    method: "POST",
    headers,
    body: form2
  });
  const data2 = await res2.json();
  console.log(data2);
  const FUSION_ITEM_ID = data2.data?.id;

  console.log("\n=== BƯỚC 3: UPDATE Latte ===");
  if (!LATTE_ITEM_ID) {
    console.log("Latte ID missing!");
  } else {
    const form3 = new FormData();
    form3.append("name", "Latte Sample A (Updated)");
    form3.append("description", "Đã được update — version 2");
    form3.append("is_seasonal", "true");
    form3.append("sizes", JSON.stringify([
      { size: "M", base_price_vnd: 48000 },
      { size: "L", base_price_vnd: 58000 },
      { size: "XL", base_price_vnd: 68000 }
    ]));
    const res3 = await fetch(`${BASE_URL}/api/admin/menu/${LATTE_ITEM_ID}`, {
      method: "PUT",
      headers,
      body: form3
    });
    console.log(await res3.json());
  }

  console.log("\n=== BƯỚC 4: UPDATE Fusion ===");
  if (!FUSION_ITEM_ID) {
    console.log("Fusion ID missing!");
  } else {
    const form4 = new FormData();
    form4.append("is_seasonal", "true");
    form4.append("base_liquid_note", "Base: Oat milk — updated");
    form4.append("sizes", JSON.stringify([
      { size: "M", base_price_vnd: 52000 },
      { size: "L", base_price_vnd: 62000 },
      { size: "XL", base_price_vnd: 72000 }
    ]));
    const res4 = await fetch(`${BASE_URL}/api/admin/menu/${FUSION_ITEM_ID}`, {
      method: "PUT",
      headers,
      body: form4
    });
    console.log(await res4.json());
  }

  console.log("\n=== BƯỚC 5: Soft DELETE ===");
  if (LATTE_ITEM_ID) await fetch(`${BASE_URL}/api/admin/menu/${LATTE_ITEM_ID}`, { method: "DELETE", headers });
  if (FUSION_ITEM_ID) await fetch(`${BASE_URL}/api/admin/menu/${FUSION_ITEM_ID}`, { method: "DELETE", headers });
  if (actualPowderAId) await fetch(`${BASE_URL}/api/admin/powders/${actualPowderAId}`, { method: "DELETE", headers });
  if (actualPowderBId) await fetch(`${BASE_URL}/api/admin/powders/${actualPowderBId}`, { method: "DELETE", headers });
  console.log("Delete finished");
}

main().catch(console.error);
