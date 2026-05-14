import { apiClient } from "@/src/lib/api/client";
import type { ApiResponse } from "@/src/lib/types/api";
import type { AdminMenuItem } from "@/src/lib/types/menu";

const URL = {
  list: "/api/admin/menu",
  byId: (id: string) => `/api/admin/menu/${id}`,
} as const;

/** Fetch all menu items including unavailable ones — ADMIN only */
export async function listAdminMenuItems(): Promise<AdminMenuItem[]> {
  const res = await apiClient.get<ApiResponse<AdminMenuItem[]>>(URL.list);
  return res.data.data;
}

/** Tạo menu item mới — POST /api/admin/menu (multipart/form-data) */
export async function createMenuItem(fd: FormData): Promise<AdminMenuItem> {
  const res = await apiClient.post<ApiResponse<AdminMenuItem>>(URL.list, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

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
