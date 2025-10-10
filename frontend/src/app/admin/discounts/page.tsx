'use client';

import { useState } from 'react';
import { Gift, Mail, CheckCircle, Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useGenerateAdminDiscount } from '@/hooks/use-discounts';
import { useToast } from '@/hooks/use-toast';

export default function AdminDiscountPage() {
    const [email, setEmail] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState<string>('10');
    const [discountData, setDiscountData] = useState<{
        code: string;
        percentage: number;
        expiresAt: string;
        email: string;
    } | null>(null);

    const { toast } = useToast();
    const generateDiscount = useGenerateAdminDiscount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        generateDiscount.mutate(
            {
                email,
                discountPercentage: parseInt(discountPercentage),
            },
            {
                onSuccess: (data) => {
                    if (data.success && data.discount) {
                        setDiscountData({
                            code: data.discount.code,
                            percentage: data.discount.percentage,
                            expiresAt: data.discount.expiresAt,
                            email: data.discount.email,
                        });
                        toast({
                            title: 'Uspešno!',
                            description: 'Kod za popust je poslat na email korisnika',
                        });
                    } else {
                        toast({
                            title: 'Greška',
                            description: data.message || 'Došlo je do greške',
                            variant: 'destructive',
                        });
                    }
                },
                onError: (error: any) => {
                    toast({
                        title: 'Greška',
                        description: error.response?.data?.message || 'Greška pri generisanju koda',
                        variant: 'destructive',
                    });
                },
            }
        );
    };

    return (
        <AdminLayout>
            <div className="max-w-3xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-library-gold to-amber-500 shadow-lg">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-sky-950">
                            Generator Popust Kodova
                        </h1>
                    </div>
                    <p className="text-sky-900/70">
                        Kreirajte prilagođene popust kodove za korisnike (10% - 100%)
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl border border-sky-200 shadow-lg p-6">
                    {!discountData ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-semibold text-sky-950 mb-2">
                                    Email adresa korisnika
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-700" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="korisnik@primer.com"
                                        required
                                        className="pl-12 h-12 bg-white border-sky-200 focus:border-library-gold text-sky-950"
                                        disabled={generateDiscount.isPending}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="discount" className="block text-sm font-semibold text-sky-950 mb-2">
                                    Procenat popusta
                                </label>
                                <div className="relative">
                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-700 z-10" />
                                    <Select
                                        value={discountPercentage}
                                        onValueChange={setDiscountPercentage}
                                        disabled={generateDiscount.isPending}
                                    >
                                        <SelectTrigger className="pl-12 h-12 bg-white border-sky-200 focus:border-library-gold text-sky-950">
                                            <SelectValue placeholder="Izaberite procenat" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((percent) => (
                                                <SelectItem key={percent} value={percent.toString()}>
                                                    {percent}% popusta
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                <h3 className="font-semibold text-blue-950 mb-2 text-sm">📌 Informacije:</h3>
                                <ul className="text-sm text-blue-900/80 space-y-1 list-disc list-inside">
                                    <li>Kod važi <strong>5 dana</strong> od generisanja</li>
                                    <li>Kod može biti iskorišćen samo <strong>jednom</strong></li>
                                    <li>Korisnik će primiti email sa kodom</li>
                                    <li>Kod važi samo za navedeni email</li>
                                </ul>
                            </div>

                            <Button
                                type="submit"
                                disabled={generateDiscount.isPending}
                                className={cn(
                                    'w-full h-12 text-lg',
                                    'bg-library-gold hover:bg-library-gold/90 text-library-midnight font-semibold'
                                )}
                            >
                                {generateDiscount.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Generisanje...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="w-5 h-5 mr-2" />
                                        Generiši kod za popust
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-sky-950 mb-2">Uspešno!</h2>
                                <p className="text-sky-900/80">
                                    Kod za popust je uspešno generisan i poslat na <strong>{discountData.email}</strong>
                                </p>
                            </div>

                            {/* Discount Code Display */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-3 border-dashed border-green-500 rounded-xl p-8">
                                <p className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wider">
                                    Generisani kod
                                </p>
                                <div className="text-4xl font-bold tracking-[0.3em] text-green-800 font-mono my-4">
                                    {discountData.code}
                                </div>
                                <p className="text-lg font-semibold text-green-700">{discountData.percentage}% popusta</p>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-left">
                                <h3 className="font-semibold text-amber-900 mb-2 text-sm">ℹ️ Detalji:</h3>
                                <ul className="text-sm text-amber-900/80 space-y-1">
                                    <li>Email: <strong>{discountData.email}</strong></li>
                                    <li>Popust: <strong>{discountData.percentage}%</strong></li>
                                    <li>Ističe: <strong>{discountData.expiresAt}</strong></li>
                                    <li>Email je uspešno poslat korisniku</li>
                                </ul>
                            </div>

                            <Button
                                onClick={() => {
                                    setDiscountData(null);
                                    setEmail('');
                                    setDiscountPercentage('10');
                                }}
                                className={cn(
                                    'w-full h-12 text-lg',
                                    'bg-library-gold hover:bg-library-gold/90 text-library-midnight font-semibold'
                                )}
                            >
                                Generiši još jedan kod
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
