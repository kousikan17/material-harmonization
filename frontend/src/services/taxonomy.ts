import { TaxonomyCategory, TaxonomyAttribute } from "../types";
import { api } from "./api";

export const taxonomyService = {
  getCategories: async (): Promise<TaxonomyCategory[]> => {
    const response = await api.get("/taxonomy/categories");
    return response.data;
  },
  createCategory: async (data: { name: string; parent_id?: string; description?: string }): Promise<TaxonomyCategory> => {
    const response = await api.post("/taxonomy/categories", data);
    return response.data;
  },
  getAttributes: async (categoryId: string): Promise<TaxonomyAttribute[]> => {
    const response = await api.get(`/taxonomy/categories/${categoryId}/attributes`);
    return response.data;
  },
  createAttribute: async (data: { category_id: string; name: string; description?: string; data_type?: string; is_required?: boolean }): Promise<TaxonomyAttribute> => {
    const response = await api.post("/taxonomy/attributes", data);
    return response.data;
  },
};
