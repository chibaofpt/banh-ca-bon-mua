import { z } from "zod";

/**
 * Step 1 schema: phone number + password.
 */
export const RegisterStep1Schema = z.object({
  phone_number: z
    .string()
    .regex(/^(0|\+84)\d{9}$/, "Số điện thoại không hợp lệ (ví dụ: 0912345678)"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(72, "Mật khẩu không được vượt quá 72 ký tự"),
});

/**
 * Step 2 schema: display name.
 */
export const RegisterStep2Schema = z.object({
  name: z
    .string()
    .min(1, "Họ và tên không được để trống")
    .max(50, "Họ và tên không được vượt quá 50 ký tự"),
});

/**
 * Full schema for user registration input validation (used by the API route).
 */
export const RegisterSchema = RegisterStep1Schema.merge(RegisterStep2Schema);

/**
 * Schema for user login input validation.
 */
export const LoginSchema = z.object({
  phone_number: z
    .string()
    .regex(
      /^(0|\+84)\d{9}$/,
      "Số điện thoại không hợp lệ (ví dụ: 0912345678)"
    ),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

export type RegisterStep1Input = z.infer<typeof RegisterStep1Schema>;
export type RegisterStep2Input = z.infer<typeof RegisterStep2Schema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
