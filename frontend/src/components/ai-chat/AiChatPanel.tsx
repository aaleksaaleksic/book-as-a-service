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
        <div className={cn(
            'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300',
            isExpanded ? 'h-[400px]' : 'h-14'
        )}>
            {/* Header Bar */}
            <div
                className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-800/80 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-slate-200">AI Asistent</span>
                    {messages.length > 0 && (
                        <span className="text-xs text-slate-400">
                            ({messages.length} {messages.length === 1 ? 'poruka' : 'poruka'})
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {messages.length > 0 && isExpanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                clearChat();
                            }}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                            title="Obriši razgovor"
                        >
                            <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    )}
                </div>
            </div>

            {/* Chat Panel */}
            {isExpanded && (
                <div className="h-[calc(100%-3.5rem)] bg-slate-950 border-t border-slate-800 flex flex-col">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center">
                                <div className="space-y-2">
                                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto" />
                                    <p className="text-slate-400">
                                        Postavite pitanje o knjizi koju čitate
                                    </p>
                                    <p className="text-xs text-slate-500">
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
                    <div className="border-t border-slate-800 p-4">
                        <div className="flex gap-2">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pitajte AI asistenta..."
                                className="flex-1 bg-slate-900 text-slate-200 placeholder-slate-500 border border-slate-800 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                rows={2}
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isLoading}
                                className="self-end bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Pritisnite Enter za slanje, Shift+Enter za novi red
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
