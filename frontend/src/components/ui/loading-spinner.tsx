
import React from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'spinner' | 'book' | 'dots';
    className?: string;
    text?: string;
    color?: 'primary' | 'secondary' | 'muted';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
                                                                  size = 'md',
                                                                  variant = 'spinner',
                                                                  className,
                                                                  text,
                                                                  color = 'primary',
                                                              }) => {

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12',
    };

    // Color mappings
    const colorClasses = {
        primary: 'text-reading-accent',
        secondary: 'text-reading-text/70',
        muted: 'text-reading-text/50',
    };

    // Text size mappings
    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
    };

    // Spinner variant
    if (variant === 'spinner') {
        return (
            <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
                <Loader2
                    className={cn(
                        'animate-spin',
                        sizeClasses[size],
                        colorClasses[color]
                    )}
                />
                {text && (
                    <p className={cn(
                        'font-medium',
                        textSizeClasses[size],
                        colorClasses[color]
                    )}>
                        {text}
                    </p>
                )}
            </div>
        );
    }

    // Book variant
    if (variant === 'book') {
        return (
            <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
                <div className="relative">
                    <BookOpen
                        className={cn(
                            'animate-pulse',
                            sizeClasses[size],
                            colorClasses[color]
                        )}
                    />
                    {/* Subtle rotating ring around book */}
                    <div
                        className={cn(
                            'absolute inset-0 border-2 border-transparent border-t-current rounded-full animate-spin',
                            sizeClasses[size],
                            colorClasses[color]
                        )}
                        style={{
                            transform: 'scale(1.3)',
                            opacity: 0.3
                        }}
                    />
                </div>
                {text && (
                    <p className={cn(
                        'font-medium text-center',
                        textSizeClasses[size],
                        colorClasses[color]
                    )}>
                        {text}
                    </p>
                )}
            </div>
        );
    }

    if (variant === 'dots') {
        const dotSizeClasses = {
            sm: 'w-1 h-1',
            md: 'w-1.5 h-1.5',
            lg: 'w-2 h-2',
            xl: 'w-3 h-3',
        };

        return (
            <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
                <div className="flex space-x-1">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={cn(
                                'rounded-full animate-bounce',
                                dotSizeClasses[size],
                                colorClasses[color],
                                'bg-current'
                            )}
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                animationDuration: '0.6s',
                            }}
                        />
                    ))}
                </div>
                {text && (
                    <p className={cn(
                        'font-medium text-center',
                        textSizeClasses[size],
                        colorClasses[color]
                    )}>
                        {text}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
            <Loader2
                className={cn(
                    'animate-spin',
                    sizeClasses[size],
                    colorClasses[color]
                )}
            />
            {text && (
                <p className={cn(
                    'font-medium',
                    textSizeClasses[size],
                    colorClasses[color]
                )}>
                    {text}
                </p>
            )}
        </div>
    );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" variant="book" text={text} />
    </div>
);

export const ComponentLoader: React.FC<{ text?: string }> = ({ text }) => (
    <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" variant="spinner" text={text} />
    </div>
);

export const ButtonLoader: React.FC = () => (
    <LoadingSpinner size="sm" variant="spinner" />
);

export const InlineLoader: React.FC<{ text?: string }> = ({ text }) => (
    <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" variant="dots" />
        {text && <span className="text-sm text-reading-text/70">{text}</span>}
    </div>
);

export const OverlayLoader: React.FC<{ text?: string; isVisible?: boolean }> = ({
                                                                                    text = "Loading...",
                                                                                    isVisible = true
                                                                                }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-reading-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-reading-surface p-8 rounded-xl shadow-2xl border border-reading-accent/10">
                <LoadingSpinner size="xl" variant="book" text={text} />
            </div>
        </div>
    );
};