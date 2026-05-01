import { apiClient } from "@/src/lib/api/client";
import type { ApiResponse } from "@/src/lib/types/api";

const URL = {
  list: "/api/admin/menu",
  byId: (id: string) => `/api/admin/menu/${id}`,
} as const;

/** Shape of a menu item returned by GET /api/admin/menu */
export interface AdminMenuItem {
  id: string;
  name: string;
  description: string | null;
  price_vnd: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

/** Fetch all menu items including unavailable ones — ADMIN only */
export async function listAdminMenuItems(): Promise<AdminMenuItem[]> {
  const res = await apiClient.get<ApiResponse<AdminMenuItem[]>>(URL.list);
  return res.data.data;
}

/** Tạo menu item mới. */
export async function createMenuItem(): Promise<void> {}

/** Cập nhật menu item theo id. */
export async function updateMenuItem(_id: string): Promise<void> {}

/** Soft-delete menu item (set is_available = false). */
export async function deleteMenuItem(_id: string): Promise<void> {}

/** Fetch addon groups của một menu item. */
export async function fetchAddonGroups(): Promise<void> {}

/** Tạo hoặc cập nhật addon group. */
export async function upsertAddonGroup(): Promise<void> {}

/** Xoá addon group. */
export async function deleteAddonGroup(_id: string): Promise<void> {}
