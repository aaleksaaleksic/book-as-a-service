"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHttpClient } from "@/context/HttpClientProvider";
import { publishersApi } from "@/api/publishers";
import { toast } from "@/hooks/use-toast";
import type { PublisherCreateDTO, PublisherResponseDTO } from "@/api/types/publishers.types";

export function usePublishers() {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["publishers"],
        queryFn: async () => {
            const response = await publishersApi.getAllPublishers(client);
            return response.data;
        },
        staleTime: 60 * 60 * 1000, // 1 hour - publishers don't change often
    });
}

export function usePublisher(id: number) {
    const client = useHttpClient();

    return useQuery({
        queryKey: ["publishers", id],
        queryFn: async () => {
            const response = await publishersApi.getPublisherById(client, id);
            return response.data;
        },
        enabled: !!id,
        staleTime: 60 * 60 * 1000,
    });
}

export function useCreatePublisher() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: PublisherCreateDTO) => {
            const response = await publishersApi.createPublisher(client, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["publishers"] });
            toast({
                title: "Uspešno!",
                description: "Izdavač je uspešno kreiran.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno kreiranje izdavača.",
                variant: "destructive",
            });
        },
    });
}

export function useUpdatePublisher() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: PublisherCreateDTO }) => {
            const response = await publishersApi.updatePublisher(client, id, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["publishers", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["publishers"] });
            toast({
                title: "Uspešno ažurirano!",
                description: "Izdavač je uspešno ažuriran.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || "Neuspešno ažuriranje izdavača.",
                variant: "destructive",
            });
        },
    });
}

export function useDeletePublisher() {
    const client = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await publishersApi.deletePublisher(client, id);
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["publishers"] });
            queryClient.removeQueries({ queryKey: ["publishers", id] });
            toast({
                title: "Izdavač obrisan",
                description: "Izdavač je uspešno obrisan iz sistema.",
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška pri brisanju",
                description: error.response?.data?.message || "Neuspešno brisanje izdavača.",
                variant: "destructive",
            });
        },
    });
}
