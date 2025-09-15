'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Globe, Beaker, User, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        name: 'Fiction',
        slug: 'fiction',
        description: 'Novels and stories',
        bookCount: 1250,
        icon: BookOpen,
        color: 'from-blue-400 to-blue-600',
    },
    {
        id: 2,
        name: 'History',
        slug: 'history',
        description: 'Historical accounts',
        bookCount: 890,
        icon: Clock,
        color: 'from-amber-400 to-amber-600',
    },
    {
        id: 3,
        name: 'Science',
        slug: 'science',
        description: 'Scientific discoveries',
        bookCount: 674,
        icon: Beaker,
        color: 'from-green-400 to-green-600',
    },
    {
        id: 4,
        name: 'Biography',
        slug: 'biography',
        description: 'Life stories',
        bookCount: 445,
        icon: User,
        color: 'from-purple-400 to-purple-600',
    },
    {
        id: 5,
        name: 'Technology',
        slug: 'technology',
        description: 'Tech innovations',
        bookCount: 532,
        icon: Zap,
        color: 'from-orange-400 to-orange-600',
    },
    {
        id: 6,
        name: 'Travel',
        slug: 'travel',
        description: 'World adventures',
        bookCount: 298,
        icon: Globe,
        color: 'from-teal-400 to-teal-600',
    },
];

export const CategoryGrid = ({ categories = defaultCategories }: CategoryGridProps) => {
    const router = useRouter();

    const handleCategoryClick = (slug: string) => {
        router.push(`/category/${slug}`);
    };

    return (
        <section className={dt.spacing.pageSections}>
            <div className="text-center mb-8">
                <h2 className={`${dt.typography.sectionTitle} text-reading-text mb-4`}>
                    Explore Categories
                </h2>
                <p className={`${dt.typography.body} text-reading-text/70 max-w-2xl mx-auto`}>
                    Discover books across different genres and topics. From fiction to science,
                    find your next great read in our carefully curated categories.
                </p>
            </div>

            <div className={dt.responsive.categoryGrid}>
                {categories.map((category) => {
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

                                <Badge variant="secondary" className="bg-book-green-100 text-reading-accent">
                                    {category.bookCount.toLocaleString()} books
                                </Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
};