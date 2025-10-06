import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHttpClient } from '@/context/HttpClientProvider';
import { categoriesApi, CategoryResponseDTO, CreateCategoryRequest } from '@/api/categories';
import { toast } from '@/hooks/use-toast';

export function useCategories() {
    const api = useHttpClient();

    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoriesApi.getAllCategories(api);
            return response.data;
        },
    });
}

export function useCategory(id: number) {
    const api = useHttpClient();

    return useQuery({
        queryKey: ['categories', id],
        queryFn: async () => {
            const response = await categoriesApi.getCategoryById(api, id);
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const api = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateCategoryRequest) => {
            const response = await categoriesApi.createCategory(api, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({
                title: "Uspešno!",
                description: data.message || 'Kategorija je uspešno kreirana.',
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || 'Neuspešno kreiranje kategorije.',
                variant: "destructive",
            });
        },
    });
}

export function useUpdateCategory() {
    const api = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: CreateCategoryRequest }) => {
            const response = await categoriesApi.updateCategory(api, id, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            queryClient.invalidateQueries({ queryKey: ['categories', variables.id] });
            toast({
                title: "Uspešno!",
                description: data.message || 'Kategorija je uspešno ažurirana.',
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || 'Neuspešno ažuriranje kategorije.',
                variant: "destructive",
            });
        },
    });
}

export function useDeleteCategory() {
    const api = useHttpClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await categoriesApi.deleteCategory(api, id);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast({
                title: "Uspešno!",
                description: data.message || 'Kategorija je uspešno obrisana.',
                variant: "default",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Greška",
                description: error.response?.data?.message || 'Neuspešno brisanje kategorije.',
                variant: "destructive",
            });
        },
    });
}
