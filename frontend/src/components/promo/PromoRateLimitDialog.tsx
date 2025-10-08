'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, LogIn } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dt } from '@/lib/design-tokens';

interface PromoRateLimitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentCount: number;
    maxCount: number;
}

export function PromoRateLimitDialog({
    open,
    onOpenChange,
    currentCount,
    maxCount,
}: PromoRateLimitDialogProps) {
    const router = useRouter();

    const handleRegister = () => {
        onOpenChange(false);
        router.push('/auth/register');
    };

    const handleLogin = () => {
        onOpenChange(false);
        router.push('/auth/login');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-3xl border border-library-gold/30 bg-library-parchment/95">
                <DialogHeader className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-library-gold/20">
                        <AlertCircle className="h-8 w-8 text-library-gold" />
                    </div>
                    <DialogTitle className={cn(dt.typography.sectionTitle, 'text-center text-reading-text')}>
                        Dnevni limit za promo poglavlja dostignut
                    </DialogTitle>
                    <DialogDescription className="space-y-3 text-center text-reading-text/80">
                        <p>
                            Pregledali ste <span className="font-semibold text-library-gold">{currentCount} od {maxCount}</span> besplatnih
                            promo poglavlja danas.
                        </p>
                        <p>
                            Da biste nastavili sa čitanjem promo poglavlja i pristupili celoj Bookotecha biblioteci,
                            kreirajte besplatan nalog.
                        </p>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-col gap-3 sm:flex-col">
                    <Button
                        onClick={handleRegister}
                        className={cn(
                            dt.interactive.buttonPrimary,
                            'flex w-full items-center justify-center gap-2'
                        )}
                    >
                        <UserPlus className="h-5 w-5" />
                        Kreiraj besplatan nalog
                    </Button>
                    <Button
                        onClick={handleLogin}
                        variant="outline"
                        className={cn(
                            dt.interactive.buttonSecondary,
                            'flex w-full items-center justify-center gap-2 text-reading-text'
                        )}
                    >
                        <LogIn className="h-5 w-5" />
                        Prijavi se
                    </Button>
                    <Button
                        onClick={() => onOpenChange(false)}
                        variant="ghost"
                        className="w-full text-reading-text/70"
                    >
                        U redu, razumem
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
