"use client";
import React, { createContext, useContext, useEffect, useMemo } from "react";
import type { AxiosInstance, AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";

const HttpClientContext = createContext<AxiosInstance | null>(null);

export const HttpClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<any>) => {
                const { response } = error;

                if (response?.status === 401) {
                    toast({
                        title: "Session Expired",
                        description: "Please login again to continue",
                        variant: "destructive",
                    });
                } else if (response?.status === 403) {
                    toast({
                        title: "Access Denied",
                        description: "You don't have permission to perform this action",
                        variant: "destructive",
                    });
                } else if (response?.status === 500) {
                    toast({
                        title: "Server Error",
                        description: "Something went wrong. Please try again later.",
                        variant: "destructive",
                    });
                }

                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    const client = useMemo(() => api, []);

    return <HttpClientContext.Provider value={client}>{children}</HttpClientContext.Provider>;
};

export const useHttpClient = () => {
    const context = useContext(HttpClientContext);
    if (!context) {
        throw new Error("useHttpClient must be used within HttpClientProvider");
    }
    return context;
};