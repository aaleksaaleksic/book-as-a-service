"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, ChevronUp, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ChatMessage } from './ChatMessage';
import { useAiChat } from '@/hooks/useAiChat';
import { cn } from '@/lib/utils';

interface AiChatPanelProps {
    bookId?: number;
    bookTitle?: string;
}

export const AiChatPanel: React.FC<AiChatPanelProps> = ({ bookId, bookTitle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { messages, isLoading, sendMessage, clearChat } = useAiChat();

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (isExpanded) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isExpanded]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded) {
            inputRef.current?.focus();
        }
    }, [isExpanded]);

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;

        const context = bookTitle ? `Reading book: ${bookTitle}` : undefined;
        sendMessage(inputValue, context);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {/* Chat Panel - Expanded */}
            {isExpanded && (
                <div className="mb-4 w-[min(90vw,800px)] h-[min(85vh,900px)] bg-slate-950 border border-slate-800/60 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            <span className="font-semibold text-slate-200 text-lg">AI Asistent</span>
                            {messages.length > 0 && (
                                <span className="text-xs text-slate-400">
                                    ({messages.length} {messages.length === 1 ? 'poruka' : 'poruka'})
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Obriši razgovor"
                                >
                                    <Trash2 className="w-4 h-4 text-slate-400" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                                title="Zatvori"
                            >
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center">
                                <div className="space-y-3">
                                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto" />
                                    <p className="text-slate-400 text-lg">
                                        Postavite pitanje o knjizi koju čitate
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Mogu vam pomoći da razumete kod, objasnim koncepte ili sumirizam delove teksta
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map(message => (
                                    <ChatMessage key={message.id} message={message} />
                                ))}
                                {isLoading && (
                                    <div className="flex items-center gap-2 p-3">
                                        <LoadingSpinner size="sm" />
                                        <span className="text-sm text-slate-400">AI razmišlja...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-slate-800/60 p-6 bg-slate-900/40">
                        <div className="flex gap-3">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pitajte AI asistenta..."
                                className="flex-1 bg-slate-900 text-slate-200 placeholder-slate-500 border border-slate-800 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                rows={3}
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className="self-end bg-purple-600 hover:bg-purple-700 text-white h-12 w-12 p-0"
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Pritisnite Enter za slanje, Shift+Enter za novi red
                        </p>
                    </div>
                </div>
            )}

            {/* Glowing Purple Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "relative group rounded-full p-5 transition-all duration-300",
                    "bg-purple-600 hover:bg-purple-700",
                    "shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]",
                    "before:absolute before:inset-0 before:rounded-full before:bg-purple-500 before:opacity-0 before:animate-pulse",
                    "hover:before:opacity-20",
                    isExpanded && "shadow-[0_0_40px_rgba(168,85,247,0.8)]"
                )}
            >
                <Sparkles className="w-7 h-7 text-white relative z-10" />
                {messages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold shadow-lg">
                        {messages.length > 9 ? '9+' : messages.length}
                    </span>
                )}
            </button>
        </div>
    );
};
