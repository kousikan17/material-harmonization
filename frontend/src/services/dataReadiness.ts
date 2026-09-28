import { DataReadinessDashboard } from "../types";
import { api } from "./api";

export const dataReadinessService = {
  getDashboard: async (): Promise<DataReadinessDashboard> => {
    const response = await api.get("/data-readiness/dashboard");
    return response.data;
  },
};
