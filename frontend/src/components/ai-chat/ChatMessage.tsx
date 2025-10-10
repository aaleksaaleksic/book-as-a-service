import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
                <div className="text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Customize rendering of elements
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-slate-100">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="ml-2">{children}</li>,
                            code: ({ className, children, ...props }) => {
                                const isInline = !className;
                                return isInline ? (
                                    <code className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                        {children}
                                    </code>
                                ) : (
                                    <code className={cn('block bg-slate-800 text-slate-200 p-2 rounded text-xs font-mono overflow-x-auto', className)} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-slate-600 pl-3 italic text-slate-400 mb-2">
                                    {children}
                                </blockquote>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};
