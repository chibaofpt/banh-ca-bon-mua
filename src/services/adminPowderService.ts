import { apiClient } from "@/src/lib/api/client";
import type { Powder } from "@/src/lib/types/powder";
import type { CreatePowderInput, UpdatePowderInput } from "@/lib/validations/powder";

export interface AdminPowderApiResponse {
  data: Powder[];
}

export interface AdminSinglePowderResponse {
  data: Powder;
}

export async function listAdminPowders(): Promise<Powder[]> {
  const { data } = await apiClient.get<AdminPowderApiResponse>("/api/admin/powders");
  return data.data;
}

export async function createPowder(payload: CreatePowderInput): Promise<Powder> {
  const { data } = await apiClient.post<AdminSinglePowderResponse>("/api/admin/powders", payload);
  return data.data;
}

export async function updatePowder(id: string, payload: UpdatePowderInput): Promise<Powder> {
  const { data } = await apiClient.put<AdminSinglePowderResponse>(`/api/admin/powders/${id}`, payload);
  return data.data;
}

export async function togglePowderAvailability(id: string, is_available: boolean): Promise<Powder> {
  const { data } = await apiClient.put<AdminSinglePowderResponse>(`/api/admin/powders/${id}`, { is_available });
  return data.data;
}

export async function deletePowder(id: string): Promise<Powder> {
  const { data } = await apiClient.delete<AdminSinglePowderResponse>(`/api/admin/powders/${id}`);
  return data.data;
}
