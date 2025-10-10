"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import { useHttpClient } from '@/context/HttpClientProvider';
import { discountsApi } from '@/api/discounts';
import type {
    PublicDiscountGenerateRequest,
    AdminDiscountGenerateRequest,
    ValidateDiscountRequest,
    UseDiscountRequest,
} from '@/api/discounts';

export const useGeneratePublicDiscount = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (data: PublicDiscountGenerateRequest) => {
            const response = await discountsApi.generatePublicDiscount(client, data);
            return response.data;
        },
    });
};

export const useGenerateAdminDiscount = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (data: AdminDiscountGenerateRequest) => {
            const response = await discountsApi.generateAdminDiscount(client, data);
            return response.data;
        },
    });
};

export const useValidateDiscount = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (data: ValidateDiscountRequest) => {
            const response = await discountsApi.validateDiscount(client, data);
            return response.data;
        },
    });
};

export const useUseDiscount = () => {
    const client = useHttpClient();
    return useMutation({
        mutationFn: async (data: UseDiscountRequest) => {
            const response = await discountsApi.useDiscount(client, data);
            return response.data;
        },
    });
};

export const usePublicGeneratorAvailability = () => {
    const client = useHttpClient();
    return useQuery({
        queryKey: ['public-discount-availability'],
        queryFn: async () => {
            const response = await discountsApi.checkPublicGeneratorAvailability(client);
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useAllDiscounts = () => {
    const client = useHttpClient();
    return useQuery({
        queryKey: ['admin-all-discounts'],
        queryFn: async () => {
            const response = await discountsApi.getAllDiscounts(client);
            return response.data;
        },
        staleTime: 30 * 1000, // 30 seconds
    });
};
