"use client";

import React, { useCallback, useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

import ReaderView from "@/components/reader/ReaderView";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import {
    useBookReadAccess,
    useEndReadingSession,
    useStartReadingSession,
    useUpdateReadingProgress,
} from "@/hooks/use-reader";

interface ReaderPageProps {
    params: Promise<{ bookId: string }>;
}

const ReaderBookPage: React.FC<ReaderPageProps> = ({ params }) => {
    const resolvedParams = use(params);
    const bookId = Number(resolvedParams.bookId);

    if (!Number.isFinite(bookId) || Number.isNaN(bookId)) {
        notFound();
    }

    const { toast } = useToast();
    const { data, isLoading, error, refetch, isFetching } = useBookReadAccess(bookId);
    const startSession = useStartReadingSession();
    const updateProgress = useUpdateReadingProgress();
    const endSession = useEndReadingSession();

    const [sessionId, setSessionId] = useState<number | null>(null);
    const lastPageRef = useRef<number>(1);

    useEffect(() => {
        if (!data?.canAccess || !data.stream || "error" in data.stream) {
            return;
        }
        if (sessionId || startSession.isPending) {
            return;
        }

        startSession.mutate(
            { bookId },
            {
                onSuccess: response => {
                    if (response?.success && response.session?.id) {
                        setSessionId(response.session.id);
                        return;
                    }

                    toast({
                        title: "Sesija čitanja nije pokrenuta",
                        description: response?.message ?? "Pokušajte ponovo kasnije.",
                        variant: "destructive",
                    });
                },
                onError: () => {
                    toast({
                        title: "Greška pri pokretanju čitanja",
                        description: "Pokušajte da osvežite stranicu i probate ponovo.",
                        variant: "destructive",
                    });
                },
            }
        );
    }, [bookId, data?.canAccess, data?.stream, sessionId, startSession, toast]);

    useEffect(() => {
        return () => {
            // Clear progress update timeout
            if (progressUpdateTimeoutRef.current) {
                clearTimeout(progressUpdateTimeoutRef.current);
            }

            if (sessionId) {
                endSession.mutate({ sessionId, pagesRead: lastPageRef.current });
            }
        };
    }, [endSession, sessionId]);

    // Debounced progress update to avoid infinite loops
    const progressUpdateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handlePageChange = useCallback(
        (page: number) => {
            console.log("📋 Parent received onPageChange:", page, "at", new Date().toISOString());
            lastPageRef.current = page;

            if (!sessionId) {
                console.log("⏸️ No sessionId, skipping API call");
                return;
            }

            // Clear previous timeout
            if (progressUpdateTimeoutRef.current) {
                clearTimeout(progressUpdateTimeoutRef.current);
            }

            // Debounce progress updates by 1 second
            progressUpdateTimeoutRef.current = setTimeout(() => {
                console.log("📡 Calling updateProgress API for page:", page);
                updateProgress.mutate({ sessionId, currentPage: page });
            }, 1000);

            console.log("✅ Parent handlePageChange completed for page:", page);
        },
        [sessionId, updateProgress]
    );

    if (isLoading || isFetching) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <LoadingSpinner size="lg" variant="book" text="Pripremamo vaš čitač…" />
                <p className="text-sm text-muted-foreground">Proveravamo pristup i bezbednosne dozvole…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <div>
                    <h1 className="text-lg font-semibold">Neuspešno učitavanje čitača</h1>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        {(error as Error).message || "Došlo je do neočekivane greške."}
                    </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button onClick={() => refetch()}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Pokušaj ponovo
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Nazad na biblioteku
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    if (!data.success || !data.canAccess) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <div>
                    <h1 className="text-lg font-semibold">Pristup nije dozvoljen</h1>
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                        {data.message || "Za pristup ovoj knjizi potrebna je aktivna pretplata."}
                    </p>
                </div>
                {data.contentPreview && (
                    <div className="max-w-2xl rounded-lg border border-dashed border-border bg-background/60 p-6 text-left text-sm text-muted-foreground">
                        <h2 className="mb-2 text-lg font-semibold text-foreground">Pregled dostupnog sadržaja</h2>
                        <p className="whitespace-pre-wrap leading-relaxed">{data.contentPreview}</p>
                    </div>
                )}
                <Button asChild variant="outline">
                    <Link href="/pricing">
                        Pogledaj pretplate
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <ReaderView
            bookId={bookId}
            bookTitle={data.book?.title}
            stream={data.stream ?? null}
            watermark={data.watermark ?? null}
            fallbackPreview={data.contentPreview ?? null}
            onPageChange={handlePageChange}
        />
    );
};

export default ReaderBookPage;
