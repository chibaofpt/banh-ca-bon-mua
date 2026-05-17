import { SignJWT } from "jose";
import { config } from "dotenv";
config({ path: ".env" });

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_dev_only_do_not_use_in_prod");
const BASE_URL = "http://localhost:3000";

async function main() {
  const token = await new SignJWT({ id: "admin-test-id", role: "ADMIN", phone_number: "+84111222333" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);

  const headers = {
    "Cookie": `access_token=${token}`
  };

  const form3 = new FormData();
  form3.append("name", "Latte Test");
  form3.append("category", "latte");
  form3.append("is_seasonal", "false");
  form3.append("is_available", "true");
  form3.append("sort_order", "0");
  form3.append("matcha_powder_id", "8f6e5dc4-08b2-4a90-98fc-873b1534e235");
  form3.append("sizes", JSON.stringify([
    { size: "M", base_price_vnd: 45000 },
    { size: "L", base_price_vnd: 55000 },
    { size: "XL", base_price_vnd: 65000 }
  ]));

  const res3 = await fetch(`${BASE_URL}/api/admin/menu/5f45cc18-9f9f-4ba1-84e8-09ea1ac30045`, {
    method: "PUT",
    headers,
    body: form3 as any
  });
  console.log(res3.status);
  console.log(await res3.json());
}

main().catch(console.error);
