import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/hooks/useAiChat';

interface ChatMessageProps {
    message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={cn(
            'flex gap-3 p-3 rounded-lg',
            isUser ? 'bg-slate-800/50' : 'bg-slate-900/50'
        )}>
            <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                isUser ? 'bg-blue-600' : 'bg-purple-600'
            )}>
                {isUser ? (
                    <User className="w-4 h-4 text-white" />
                ) : (
                    <Bot className="w-4 h-4 text-white" />
                )}
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                        {isUser ? 'Vi' : 'AI Asistent'}
                    </span>
                    <span className="text-xs text-slate-500">
                        {message.timestamp.toLocaleTimeString('sr-RS', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {message.content}
                </div>
            </div>
        </div>
    );
};
