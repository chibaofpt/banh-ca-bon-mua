import { apiClient } from "@/src/lib/api/client";
import type { ApiResponse } from "@/src/lib/types/api";
import type { MenuData } from "@/src/lib/types/menu";

const URL = {
  menu: "/api/menu",
} as const;

/**
 * Fetches the full menu (items + addons) from the API.
 * The server performs all data transformation — no client-side mapping needed.
 */
export async function fetchMenu(): Promise<MenuData> {
  const res = await apiClient.get<ApiResponse<MenuData>>(URL.menu);
  return res.data.data;
}
