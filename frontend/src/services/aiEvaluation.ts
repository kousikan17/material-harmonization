import { EvaluationDataset, EvaluationLabel, EvaluationRun } from "../types";
import { api } from "./api";

export const aiEvaluationService = {
  getDatasets: async (): Promise<EvaluationDataset[]> => {
    const response = await api.get("/ai-evaluation/datasets");
    return response.data;
  },
  createDataset: async (data: { name: string; description?: string }): Promise<EvaluationDataset> => {
    const response = await api.post("/ai-evaluation/datasets", data);
    return response.data;
  },
  getLabels: async (datasetId: string): Promise<EvaluationLabel[]> => {
    const response = await api.get(`/ai-evaluation/datasets/${datasetId}/labels`);
    return response.data;
  },
  addLabel: async (datasetId: string, data: { material_a_id: string; material_b_id: string; expert_label: string }): Promise<EvaluationLabel> => {
    const response = await api.post(`/ai-evaluation/datasets/${datasetId}/labels`, data);
    return response.data;
  },
  runEvaluation: async (datasetId: string): Promise<EvaluationRun> => {
    const response = await api.post(`/ai-evaluation/datasets/${datasetId}/run`);
    return response.data;
  },
  getRuns: async (datasetId: string): Promise<EvaluationRun[]> => {
    const response = await api.get(`/ai-evaluation/datasets/${datasetId}/runs`);
    return response.data;
  },
};
