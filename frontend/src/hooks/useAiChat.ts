import { useState } from 'react';
import type { AxiosError } from 'axios';
import { api } from '@/lib/api-client';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AiChatRequest {
    message: string;
    bookContext?: string;
}

interface AiChatResponse {
    response: string;
    success: boolean;
    error?: string;
}

export const useAiChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (message: string, bookContext?: string) => {
        if (!message.trim()) return;

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const request: AiChatRequest = {
                message,
                bookContext,
            };

            const response = await api.post<AiChatResponse>('/api/v1/ai-chat/ask', request, {
                timeout: Math.max(api.defaults.timeout ?? 0, 45000),
            });

            if (response.data.success) {
                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: response.data.response,
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(response.data.error || 'Failed to get AI response');
            }
        } catch (err) {
            const axiosError = err as AxiosError<{ error?: string }>;
            const timeoutMessage = axiosError.code === 'ECONNABORTED'
                ? 'AI odgovor traje duže nego obično. Molimo pokušajte ponovo sa kraćim odlomkom.'
                : null;
            const errorMessage = timeoutMessage
                ?? axiosError.response?.data?.error
                ?? (axiosError instanceof Error ? axiosError.message : 'Failed to send message');
            setError(errorMessage);
            console.error('AI Chat error:', err);

            // Add error message as assistant response
            const errorResponse: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${errorMessage}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
    };

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearChat,
    };
};
