import { AxiosInstance } from "axios";

export interface CategoryResponseDTO {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    category?: T;
}

export const categoriesApi = {
    // Public endpoint
    getAllCategories: (client: AxiosInstance) =>
        client.get<CategoryResponseDTO[]>("/api/v1/categories"),

    // Public endpoint
    getCategoryById: (client: AxiosInstance, id: number) =>
        client.get<CategoryResponseDTO>(`/api/v1/categories/${id}`),

    // Admin endpoint
    createCategory: (client: AxiosInstance, data: CreateCategoryRequest) =>
        client.post<ApiResponse<CategoryResponseDTO>>("/api/v1/categories", data),

    // Admin endpoint
    updateCategory: (client: AxiosInstance, id: number, data: CreateCategoryRequest) =>
        client.put<ApiResponse<CategoryResponseDTO>>(`/api/v1/categories/${id}`, data),

    // Admin endpoint
    deleteCategory: (client: AxiosInstance, id: number) =>
        client.delete<ApiResponse<void>>(`/api/v1/categories/${id}`),
};
