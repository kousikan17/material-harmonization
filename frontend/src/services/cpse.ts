import { api } from "@/services/api";
import type { CPSE, CPSEStats } from "@/types";

export async function listCPSE(sector?: string) {
  const url = sector ? `/cpse?sector=${encodeURIComponent(sector)}` : "/cpse";
  const { data } = await api.get<CPSEStats[]>(url);
  return data;
}

export async function getCPSE(id: string) {
  const { data } = await api.get<CPSEStats>(`/cpse/${id}`);
  return data;
}

export interface CPSEFormPayload {
  code?: string;
  name?: string;
  cognate_group_id?: string;
  administrative_ministry_id?: string;
  description?: string;
  material_database_available?: boolean;
  is_active?: boolean;
}

export async function createCPSE(payload: CPSEFormPayload) {
  console.log("CPSE payload:", payload);
  const { data } = await api.post<CPSE>("/cpse", payload);
  console.log("CPSE API response:", data);
  return data;
}

export async function updateCPSE(id: string, payload: CPSEFormPayload) {
  const { data } = await api.put<CPSE>(`/cpse/${id}`, payload);
  return data;
}

export async function setCPSEStatus(id: string, is_active: boolean) {
  const { data } = await api.patch<CPSE>(`/cpse/${id}/status`, { is_active });
  return data;
}



export async function bulkAnalyzeCPSE(company_ids: string[]) {
  const { data } = await api.post<{ job_id: string; status: string; company_ids: string[] }>("/cpse/bulk-analyze", { company_ids });
  return data;
}

export interface AnalysisJobStatus {
  job_id: string;
  status: string;
  total_materials: number;
  processed_materials: number;
  company_ids: string[];
  completed_at: string | null;
}

export async function getAnalysisStatus(job_id: string) {
  const { data } = await api.get<AnalysisJobStatus>(`/cpse/analysis/${job_id}`);
  return data;
}

export interface CPSEBulkRowResult {
  row_number: number;
  raw_data: Record<string, any>;
  errors: string[];
  is_valid: boolean;
  is_duplicate: boolean;
  cpse_code: string;
  cognate_group_name: string;
}

export interface CPSEBulkValidationResponse {
  filename: string;
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  duplicate_count: number;
  rows: CPSEBulkRowResult[];
}

export interface CPSEBulkImportResponse {
  batch_id: string;
  filename: string;
  total_rows: number;
  created: number;
  failed: number;
}

export async function validateBulkCPSE(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<CPSEBulkValidationResponse>("/cpse/bulk/validate", formData);
  return data;
}

export async function confirmBulkCPSE(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<CPSEBulkImportResponse>("/cpse/bulk/confirm", formData);
  return data;
}

export async function clearCpseMaterials(cpseId: string) {
  const { data } = await api.post<{ success: boolean; deleted_material_count: number; cpse_code: string; message: string }>(`/cpse/${cpseId}/materials/clear`);
  return data;
}

export async function clearAllMaterials() {
  const { data } = await api.post<{ success: boolean; deleted_material_count: number; message: string }>("/cpse/materials/clear-all");
  return data;
}
