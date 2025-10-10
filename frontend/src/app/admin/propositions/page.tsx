'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { Trash2, Lightbulb, Calendar, MessageSquare } from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useHttpClient } from '@/context/HttpClientProvider';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface Proposition {
    id: number;
    message: string;
    createdAt: string;
}

export default function PropositionsPage() {
    const client = useHttpClient();
    const queryClient = useQueryClient();
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['propositions'],
        queryFn: async () => {
            const response = await client.get('/api/v1/propositions/admin');
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await client.delete(`/api/v1/propositions/admin/${id}`);
            return response.data;
        },
        onMutate: (id) => {
            setDeletingId(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['propositions'] });
        },
        onSettled: () => {
            setDeletingId(null);
        },
    });

    const handleDelete = async (id: number) => {
        if (confirm('Da li ste sigurni da želite da obrišete ovaj predlog?')) {
            deleteMutation.mutate(id);
        }
    };

    const propositions: Proposition[] = data?.propositions || [];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Predlozi knjiga</h1>
                        <p className="text-gray-600 mt-2">
                            Pregled svih predloga korisnika za nove knjige
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-sky-950/20 bg-sky-950/5 px-4 py-2">
                        <Lightbulb className="h-5 w-5 text-sky-950" />
                        <span className="text-sm font-semibold text-sky-950">
                            {propositions.length} {propositions.length === 1 ? 'predlog' : 'predloga'}
                        </span>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-full max-w-md rounded-3xl bg-library-parchment/95 px-10 py-8 text-sky-950 shadow-inner">
                            <LoadingSpinner size="lg" text="Učitavamo predloge..." color="primary" />
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-red-600 font-semibold mb-2">Greška pri učitavanju predloga</p>
                        <p className="text-red-500 text-sm">Molimo pokušajte ponovo kasnije</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && propositions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                        <Lightbulb className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema predloga</h3>
                        <p className="text-gray-600 text-sm">
                            Još nema korisničkih predloga za nove knjige.
                        </p>
                    </div>
                )}

                {/* Propositions List */}
                {!isLoading && !error && propositions.length > 0 && (
                    <div className="space-y-4">
                        {propositions.map((proposition) => {
                            const formattedDate = format(
                                new Date(proposition.createdAt),
                                "d. MMMM yyyy. 'u' HH:mm",
                                { locale: srLatn }
                            );

                            const isDeleting = deletingId === proposition.id;

                            return (
                                <div
                                    key={proposition.id}
                                    className={cn(
                                        "rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all",
                                        isDeleting && "opacity-50 pointer-events-none"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>{formattedDate}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-600 font-medium">ID: {proposition.id}</span>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <MessageSquare className="h-5 w-5 text-sky-950 mt-0.5 flex-shrink-0" />
                                                <p className="text-base text-gray-900 leading-relaxed">
                                                    {proposition.message}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(proposition.id)}
                                            disabled={isDeleting}
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {isDeleting ? 'Brisanje...' : 'Obriši'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
