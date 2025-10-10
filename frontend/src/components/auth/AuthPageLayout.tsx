"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { dt } from "@/lib/design-tokens";

interface AuthPageLayoutProps {
    title: string;
    description?: string;
    badge?: string;
    leftExtras?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
}

export const AuthPageLayout = ({
    title,
    description,
    badge,
    leftExtras,
    footer,
    children,
}: AuthPageLayoutProps) => {
    return (
        <div className="relative min-h-screen overflow-hidden bg-library-parchment text-sky-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -left-24 h-[420px] w-[420px] rounded-full bg-library-azure/10 blur-3xl" />
                <div className="absolute -bottom-48 -right-20 h-[460px] w-[460px] rounded-full bg-library-gold/15 blur-3xl" />
                <div className="absolute inset-x-0 top-24 mx-auto h-[520px] max-w-5xl rounded-full bg-white/30 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(19,60,93,0.08),_transparent_55%)]" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_480px]">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="flex justify-center lg:justify-start">
                            <img
                                src="/landing_logo.svg"
                                alt="Bookotecha logo"
                                className="h-auto w-full max-w-md"
                            />
                        </div>

                        {badge ? (
                            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-library-gold/30 bg-library-gold/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-950/70 lg:mx-0">
                                {badge}
                            </div>
                        ) : null}

                        <div className="space-y-5">
                            <h1
                                className={cn(
                                    dt.typography.heroTitle,
                                    dt.responsive.heroTitle,
                                    "mx-auto max-w-2xl text-sky-950 lg:mx-0"
                                )}
                            >
                                {title}
                            </h1>
                            {description ? (
                                <p className="mx-auto max-w-xl font-reading text-base text-sky-950/80 lg:mx-0 lg:text-lg">
                                    {description}
                                </p>
                            ) : null}
                        </div>

                        {leftExtras ? <div className="space-y-4">{leftExtras}</div> : null}

                        {footer ? <div className="space-y-3 text-sm font-ui text-sky-950/80">{footer}</div> : null}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 -translate-y-6 rounded-[40px] bg-gradient-to-br from-white/40 to-white/10 blur-2xl" aria-hidden="true" />
                        <div className="relative rounded-[32px] border border-library-highlight/30 bg-white/85 p-8 shadow-[0_35px_90px_rgba(12,35,64,0.25)] backdrop-blur-xl sm:p-12">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
