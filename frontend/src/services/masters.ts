import { api } from "@/services/api";
import type { Sector, AdministrativeMinistry } from "@/types";

export async function getHierarchy() {
  const { data } = await api.get<Sector[]>("/masters/hierarchy");
  return data;
}

export async function getAdministrativeMinistries() {
  const { data } = await api.get<AdministrativeMinistry[]>("/masters/administrative-ministries");
  return data;
}
