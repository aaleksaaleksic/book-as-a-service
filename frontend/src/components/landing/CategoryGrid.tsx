'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Globe, Beaker, User, Zap, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/use-categories';
import { dt } from '@/lib/design-tokens';

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    bookCount: number;
    icon: React.ElementType;
    color: string;
}

interface CategoryGridProps {
    categories?: Category[];
}

const defaultCategories: Category[] = [
    {
        id: 1,
        name: 'Književnost',
        slug: 'knjizevnost',
        description: 'Romani i priče',
        bookCount: 1250,
        icon: BookOpen,
        color: 'from-blue-400 to-blue-600',
    },
    {
        id: 2,
        name: 'Istorija',
        slug: 'istorija',
        description: 'Istorijski zapisi',
        bookCount: 890,
        icon: Clock,
        color: 'from-amber-400 to-amber-600',
    },
    {
        id: 3,
        name: 'Nauka',
        slug: 'nauka',
        description: 'Naučna otkrića',
        bookCount: 674,
        icon: Beaker,
        color: 'from-green-400 to-green-600',
    },
    {
        id: 4,
        name: 'Biografija',
        slug: 'biografija',
        description: 'Životne priče',
        bookCount: 445,
        icon: User,
        color: 'from-purple-400 to-purple-600',
    },
    {
        id: 5,
        name: 'Tehnologija',
        slug: 'tehnologija',
        description: 'Tech inovacije',
        bookCount: 532,
        icon: Zap,
        color: 'from-orange-400 to-orange-600',
    },
    {
        id: 6,
        name: 'Putovanja',
        slug: 'putovanja',
        description: 'Svetske avanture',
        bookCount: 298,
        icon: Globe,
        color: 'from-teal-400 to-teal-600',
    },
];

export const CategoryGrid = ({ categories: customCategories }: CategoryGridProps) => {
    const router = useRouter();
    const { data: apiCategories, isLoading } = useCategories();

    // Use API categories if available, otherwise fall back to default categories
    const displayCategories = apiCategories?.slice(0, 6).map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        description: cat.description || '',
        bookCount: 0, // This would come from backend analytics
        icon: [BookOpen, Clock, Beaker, User, Zap, Globe][index % 6],
        color: [
            'from-blue-400 to-blue-600',
            'from-amber-400 to-amber-600',
            'from-green-400 to-green-600',
            'from-purple-400 to-purple-600',
            'from-orange-400 to-orange-600',
            'from-teal-400 to-teal-600'
        ][index % 6],
    })) || customCategories || defaultCategories;

    const handleCategoryClick = (slug: string) => {
        router.push(`/category/${slug}`);
    };

    if (isLoading) {
        return (
            <section className={dt.spacing.pageSections}>
                <div className="mb-12 pl-4">
                    <h2 className={`${dt.typography.sectionTitle} text-reading-text mb-4`}>
                        Istražite kategorije
                    </h2>
                    <p className={`${dt.typography.body} text-reading-text/70 max-w-2xl`}>
                        Učitavanje kategorija...
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className={dt.spacing.pageSections}>
            <div className="mb-12 pl-4">
                <h2 className={`${dt.typography.sectionTitle} text-reading-text mb-4`}>
                    Istražite kategorije
                </h2>
                <p className={`${dt.typography.body} text-reading-text/70 max-w-2xl`}>
                    Otkrijte knjige iz različitih žanrova i tema. Od književnosti do nauke,
                    pronađite svoju sledeću odličnu knjigu u našim pažljivo odabranim kategorijama.
                </p>
            </div>

            <div className={dt.responsive.categoryGrid}>
                {displayCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <Card
                            key={category.id}
                            className={`${dt.components.card} cursor-pointer group hover:shadow-lg transition-all duration-300`}
                            onClick={() => handleCategoryClick(category.slug)}
                        >
                            <CardContent className="p-6 text-center space-y-4">
                                <div className="relative">
                                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-reading-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                <div className="space-y-2">
                                    <h3 className={`${dt.typography.cardTitle} text-reading-text`}>
                                        {category.name}
                                    </h3>
                                    <p className={`${dt.typography.small} text-reading-text/60`}>
                                        {category.description}
                                    </p>
                                </div>

                                {category.bookCount > 0 && (
                                    <Badge variant="secondary" className="bg-book-green-100 text-reading-accent">
                                        {category.bookCount.toLocaleString()} knjiga
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
};