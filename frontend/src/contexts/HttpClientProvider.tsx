"use client";
import React, { createContext, useContext, useMemo } from "react";
import axios, { AxiosInstance, AxiosError } from "axios";
import { toast } from "@/hooks/use-toast";
import { AUTH_CONFIG } from "@/utils/constants";

const HttpClientContext = createContext<AxiosInstance | null>(null);

export const HttpClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const client = useMemo(() => {
        const axiosInstance = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
            timeout: 10000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Request interceptor - automatically adds JWT token
        axiosInstance.interceptors.request.use(
            (config) => {
                if (typeof window !== "undefined") {
                    const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor - handles errors globally
        axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<any>) => {
                const { response } = error;

                if (response?.status === 401) {
                    // Token expired or invalid - logout user
                    if (typeof window !== "undefined") {
                        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
                        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
                        window.location.href = AUTH_CONFIG.LOGIN_REDIRECT;
                    }
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

        return axiosInstance;
    }, []);

    return <HttpClientContext.Provider value={client}>{children}</HttpClientContext.Provider>;
};

export const useHttpClient = () => {
    const context = useContext(HttpClientContext);
    if (!context) {
        throw new Error("useHttpClient must be used within HttpClientProvider");
    }
    return context;
};