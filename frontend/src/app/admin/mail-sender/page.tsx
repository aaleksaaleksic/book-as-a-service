'use client';

import { useState } from 'react';
import { Send, Mail, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api-client';
import { emailApi } from '@/api/email';
import type { RecipientGroup } from '@/api/types/email.types';

export default function MailSenderPage() {
    const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>('ALL_USERS');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsLoading(true);

        try {
            console.log('Sending email with data:', { recipientGroup, subject, content });
            const response = await emailApi.sendBulkEmail(api, {
                recipientGroup,
                subject,
                content,
            });

            console.log('Email sent successfully:', response.data);
            setMessage({
                type: 'success',
                text: `Email uspešno poslat na ${response.data.recipientCount} korisnika!`,
            });

            // Reset form
            setSubject('');
            setContent('');
        } catch (error: any) {
            console.error('Error sending email:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Greška prilikom slanja emaila. Pokušajte ponovo.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-950 text-white">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mail Sender</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Pošaljite email svim korisnicima ili samo aktivnim korisnicima
                        </p>
                    </div>
                </div>

                {/* Message Alert */}
                {message && (
                    <div
                        className={`rounded-lg border p-4 flex items-start gap-3 ${
                            message.type === 'success'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                        }`}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                            <p
                                className={`text-sm font-medium ${
                                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                                }`}
                            >
                                {message.text}
                            </p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-6 space-y-6">
                        {/* Recipients Dropdown */}
                        <div className="space-y-2">
                            <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">
                                Primaoci *
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    id="recipients"
                                    value={recipientGroup}
                                    onChange={(e) => setRecipientGroup(e.target.value as RecipientGroup)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none appearance-none bg-white"
                                >
                                    <option value="ALL_USERS">Svi korisnici</option>
                                    <option value="ACTIVE_USERS">Aktivni korisnici</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                {recipientGroup === 'ALL_USERS'
                                    ? 'Email će biti poslat svim korisnicima u sistemu'
                                    : 'Email će biti poslat samo aktivnim korisnicima'}
                            </p>
                        </div>

                        {/* Subject Field */}
                        <div className="space-y-2">
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                Naslov *
                            </label>
                            <input
                                id="subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Unesite naslov emaila"
                                required
                                className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Content Field */}
                        <div className="space-y-2">
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                                Tekst poruke *
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Unesite sadržaj emaila..."
                                required
                                rows={10}
                                className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-950 focus:border-transparent outline-none resize-none"
                            />
                            <p className="text-xs text-gray-500">
                                Email će biti formatiran sa Bookotecha stilom
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-sky-950 rounded-lg hover:bg-sky-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Slanje...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Pošalji email</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-900 mb-1">Napomena</h3>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• Emailovi će biti poslati asinhrono</li>
                                <li>• Svaki email će biti personalizovan sa Bookotecha templateom</li>
                                <li>• Korisnici će moći da odgovore na email</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
