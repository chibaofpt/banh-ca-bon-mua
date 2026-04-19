export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone_number: string;
  role: Role;
  points_balance: number;
  qr_token: string;
  otp_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/** Subset returned after login/register — never expose password_hash */
export type AuthUser = Pick<User, "id" | "name" | "phone_number" | "role" | "points_balance" | "qr_token">;
