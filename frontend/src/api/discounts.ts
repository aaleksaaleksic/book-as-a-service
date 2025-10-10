import type { AxiosInstance } from 'axios';

export interface DiscountResponse {
    success: boolean;
    message: string;
    discount?: {
        code: string;
        percentage: number;
        expiresAt: string;
        email: string;
        createdBy?: string;
    };
}

export interface ValidateDiscountResponse {
    success: boolean;
    valid: boolean;
    message: string;
    discount?: {
        code: string;
        percentage: number;
        expiresAt: string;
    };
}

export interface PublicDiscountGenerateRequest {
    email: string;
}

export interface AdminDiscountGenerateRequest {
    email: string;
    discountPercentage: number;
}

export interface ValidateDiscountRequest {
    code: string;
    email: string;
}

export interface UseDiscountRequest {
    code: string;
    email: string;
}

export interface DiscountListItem {
    id: number;
    code: string;
    email: string;
    discountPercentage: number;
    type: string;
    isUsed: boolean;
    createdAt: string;
    expiresAt: string;
    usedAt: string | null;
    createdBy: string;
    isExpired: boolean;
    isValid: boolean;
}

export interface AllDiscountsResponse {
    success: boolean;
    discounts: DiscountListItem[];
    totalCount: number;
}

export const discountsApi = {
    // Public endpoint - generate 10% discount
    generatePublicDiscount: (client: AxiosInstance, data: PublicDiscountGenerateRequest) =>
        client.post<DiscountResponse>('/api/v1/public/discount/generate', data),

    // Admin endpoint - generate custom discount
    generateAdminDiscount: (client: AxiosInstance, data: AdminDiscountGenerateRequest) =>
        client.post<DiscountResponse>('/api/v1/admin/discount/generate', data),

    // Validate discount code
    validateDiscount: (client: AxiosInstance, data: ValidateDiscountRequest) =>
        client.post<ValidateDiscountResponse>('/api/v1/discount/validate', data),

    // Use/consume discount code
    useDiscount: (client: AxiosInstance, data: UseDiscountRequest) =>
        client.post<{ success: boolean; message: string }>('/api/v1/discount/use', data),

    // Check if public generator is available
    checkPublicGeneratorAvailability: (client: AxiosInstance) =>
        client.get<{ success: boolean; available: boolean; message: string }>('/api/v1/public/discount/available'),

    // Admin endpoint - get all discount codes
    getAllDiscounts: (client: AxiosInstance) =>
        client.get<AllDiscountsResponse>('/api/v1/admin/discounts'),
};
