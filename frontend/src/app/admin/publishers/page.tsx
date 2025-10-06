'use client';

import { useState } from 'react';
import {
    Plus,
    Edit,
    Trash,
    Building2,
    X,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    usePublishers,
    useCreatePublisher,
    useUpdatePublisher,
    useDeletePublisher,
} from '@/hooks/use-publishers';
import { useCan } from '@/hooks/useAuth';
import { PublisherResponseDTO } from '@/api/types/publishers.types';

export default function AdminPublishersPage() {
    const { can } = useCan();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPublisher, setEditingPublisher] = useState<PublisherResponseDTO | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', website: '' });

    const { data: publishers, isLoading, error } = usePublishers();
    const createMutation = useCreatePublisher();
    const updateMutation = useUpdatePublisher();
    const deleteMutation = useDeletePublisher();

    const handleOpenDialog = (publisher?: PublisherResponseDTO) => {
        if (publisher) {
            setEditingPublisher(publisher);
            setFormData({
                name: publisher.name,
                description: publisher.description || '',
                website: publisher.website || ''
            });
        } else {
            setEditingPublisher(null);
            setFormData({ name: '', description: '', website: '' });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingPublisher(null);
        setFormData({ name: '', description: '', website: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingPublisher) {
            await updateMutation.mutateAsync({
                id: editingPublisher.id,
                data: formData,
            });
        } else {
            await createMutation.mutateAsync(formData);
        }

        handleCloseDialog();
    };

    const handleDelete = async (id: number) => {
        if (confirm('Da li ste sigurni da želite obrisati ovog izdavača?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Upravljanje izdavačima</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Ukupno {publishers?.length || 0} izdavača
                        </p>
                    </div>

                    {can('CAN_CREATE_BOOKS') && (
                        <button
                            onClick={() => handleOpenDialog()}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-950 rounded-lg hover:bg-sky-900 transition-colors duration-200"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Dodaj izdavača
                        </button>
                    )}
                </div>

                {/* Publishers Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="m-6 rounded-lg bg-red-50 border border-red-200 p-4">
                            <p className="text-sm text-red-800">
                                Greška pri učitavanju izdavača. Pokušajte ponovo.
                            </p>
                        </div>
                    ) : publishers?.length === 0 ? (
                        <div className="p-12 text-center">
                            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 mb-4">
                                Nema dodatih izdavača
                            </p>
                            {can('CAN_CREATE_BOOKS') && (
                                <button
                                    onClick={() => handleOpenDialog()}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Dodaj prvog izdavača
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Naziv
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Opis
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Website
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Akcije
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {publishers?.map((publisher) => (
                                        <tr key={publisher.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-sky-950" />
                                                    <span className="font-medium text-gray-900">{publisher.name}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-600">
                                                    {publisher.description || '-'}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                {publisher.website ? (
                                                    <a
                                                        href={publisher.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sky-950 hover:underline text-sm"
                                                    >
                                                        {publisher.website}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {can('CAN_UPDATE_BOOKS') && (
                                                        <button
                                                            onClick={() => handleOpenDialog(publisher)}
                                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {can('CAN_DELETE_BOOKS') && (
                                                        <button
                                                            onClick={() => handleDelete(publisher.id)}
                                                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Dialog */}
            {isDialogOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-gray-900/50 z-50 transition-opacity duration-300"
                        onClick={handleCloseDialog}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {editingPublisher ? 'Izmeni izdavača' : 'Dodaj novog izdavača'}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {editingPublisher
                                                ? 'Izmeni podatke o izdavaču'
                                                : 'Unesite podatke o novom izdavaču'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCloseDialog}
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="px-6 py-4 space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Naziv izdavača *
                                        </label>
                                        <input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="npr. Laguna, Vulkan, Dereta..."
                                            required
                                            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Opis
                                        </label>
                                        <textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                            placeholder="Kratak opis izdavača..."
                                            rows={3}
                                            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none resize-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                                            Website
                                        </label>
                                        <input
                                            id="website"
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) =>
                                                setFormData({ ...formData, website: e.target.value })
                                            }
                                            placeholder="https://www.izdavac.com"
                                            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseDialog}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        Otkaži
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="px-4 py-2 text-sm font-medium text-white bg-sky-950 rounded-lg hover:bg-sky-900 transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {editingPublisher ? 'Sačuvaj izmene' : 'Dodaj izdavača'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
