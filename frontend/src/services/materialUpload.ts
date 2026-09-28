import { api } from "@/services/api";
import type { 
  CsvImportHistoryResponse, 
  CsvImportResponse, 
  CsvValidationResponse, 
  ManualMaterialBatch 
} from "@/types";

// Company self-service material upload - the REAL (non-demo) counterpart to
// services/demoImport.ts. Production ingestion is still connector-first
// (see services/synchronization.ts); this lets an authorized company user
// also upload their own real material master, strictly scoped to their own
// CPSE, through the exact same governed AI pipeline.

function buildForm(file: File, cpseId?: string) {
  const form = new FormData();
  form.append("file", file);
  if (cpseId) form.append("cpse_id", cpseId);
  return form;
}

export async function validateMaterialUpload(file: File, cpseId?: string) {
  const { data } = await api.post<CsvValidationResponse>(
    "/materials/upload/validate", 
    buildForm(file, cpseId)
  );
  return data;
}

export async function confirmMaterialUpload(file: File, cpseId?: string, groupId?: string) {
  const form = new FormData();
  form.append("file", file);
  if (cpseId) {
    form.append("cpse_id", cpseId);
  }
  if (groupId) {
    form.append("group_id", groupId);
  }
  const { data } = await api.post<CsvImportResponse>(
    "/materials/upload/confirm", 
    form
  );
  return data;
}

export async function validateManualUpload(batch: ManualMaterialBatch) {
  const { data } = await api.post<CsvValidationResponse>("/materials/upload/manual/validate", batch);
  return data;
}

export async function confirmManualUpload(batch: ManualMaterialBatch) {
  const { data } = await api.post<CsvImportResponse>("/materials/upload/manual/confirm", batch);
  return data;
}

export async function getMaterialUploadHistory(cpseId?: string) {
  const url = cpseId ? `/materials/upload/history?cpse_id=${cpseId}` : "/materials/upload/history";
  const { data } = await api.get<CsvImportHistoryResponse>(url);
  return data;
}

export async function downloadUploadTemplate(mode?: "single"): Promise<void> {
  const url = mode === "single" ? "/materials/upload/template?mode=single" : "/materials/upload/template";
  const response = await api.get(url, { responseType: "blob" });
  const downloadUrl = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download =
    mode === "single"
      ? "material_upload_template_single.csv"
      : "material_upload_template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
