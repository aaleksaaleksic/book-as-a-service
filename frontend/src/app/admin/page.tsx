'use client';

import {
    BookOpen,
    Users,
    DollarSign,
    TrendingUp,
    Clock,
    BookMarked,
    UserPlus,
    CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { dt } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const stats = {
    totalBooks: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    recentActivity: [],
    popularBooks: []
};

export default function AdminDashboardPage() {
    const { user } = useAuth();

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div>
                    <h1 className={cn(dt.typography.pageTitle)}>
                        Dobrodošli nazad, {user?.firstName}!
                    </h1>
                    <p className={cn(dt.typography.muted, "mt-1")}>
                        Evo pregleda današnje aktivnosti i statistike
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Books */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ukupno knjiga
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalBooks}</div>
                            <p className="text-xs text-muted-foreground">
                                +0 ove nedelje
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Aktivni korisnici
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeUsers}</div>
                            <p className="text-xs text-muted-foreground">
                                +0 novih danas
                            </p>
                        </CardContent>
                    </Card>

                    {/* Monthly Revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Mesečni prihod
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {new Intl.NumberFormat('sr-RS', {
                                    style: 'currency',
                                    currency: 'RSD',
                                    minimumFractionDigits: 0
                                }).format(stats.monthlyRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                +0% od prošlog meseca
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Subscriptions */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Aktivne pretplate
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                            <p className="text-xs text-muted-foreground">
                                0 trial korisnika
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Brze akcije</CardTitle>
                        <CardDescription>
                            Često korišćene administratorske funkcije
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Button asChild variant="outline">
                                <Link href="/admin/books/new">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Dodaj novu knjigu
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin/users">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Upravljaj korisnicima
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/admin/analytics">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Vidi analitiku
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity & Popular Books */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Nedavna aktivnost
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                Nema nedavne aktivnosti
                            </div>
                        </CardContent>
                    </Card>

                    {/* Most Popular Books */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookMarked className="h-5 w-5" />
                                Najpopularnije knjige
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                Nema podataka o popularnosti
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}