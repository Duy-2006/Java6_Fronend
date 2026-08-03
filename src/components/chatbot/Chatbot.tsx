"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Book, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BookImage from '@/app/user/books/[id]/_components/BookImage';

interface ChatSource {
    bookId: number;
    title: string;
    reason: string;
    relevanceScore: number;
    imageUrl?: string;
    price?: number;
    stockQuantity?: number;
}

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    intent?: string;
    sources?: ChatSource[];
    fallback?: boolean;
}

export default function Chatbot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Hide chatbot on admin views
    if (pathname?.startsWith('/admin')) {
        return null;
    }
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: '1',
                text: 'Xin chào! Tôi là trợ lý AI của nhà sách. Tôi có thể giúp bạn tìm sách, tra cứu đơn hàng, giá cả hoặc giải đáp các thắc mắc khác. Bạn cần tôi giúp gì?',
                sender: 'bot'
            }]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const { authFetch } = await import('@/lib/authFetch');
            const response = await authFetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMsg.text,
                    conversationId: conversationId
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                text: data.answer,
                sender: 'bot',
                intent: data.intent,
                sources: data.sources,
                fallback: data.fallback
            };
            
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: 'Hệ thống đang bận hoặc mất kết nối. Vui lòng thử lại sau.',
                sender: 'bot',
                fallback: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Chatbot Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* Chatbot Window */}
            {isOpen && (
                <div className="bg-white rounded-xl shadow-2xl w-80 md:w-96 h-[500px] flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} />
                            <h3 className="font-semibold text-lg">Trợ lý sách AI</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}>
                                <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                                    {msg.text}
                                </div>
                                
                                {/* Sources display if any */}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-3">
                                        {(() => {
                                            const mainBook = msg.sources.find(s => s.reason === 'Sách bạn đang quan tâm');
                                            const otherBooks = msg.sources.filter(s => s.reason !== 'Sách bạn đang quan tâm');
                                            
                                            return (
                                                <>
                                                    {mainBook && (
                                                        <div className="flex flex-col gap-1.5">
                                                            <p className="text-[13px] text-gray-700 font-semibold flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                                Kết quả phù hợp nhất
                                                            </p>
                                                            <Link href={`/user/books/${mainBook.bookId}`} className="bg-white border border-blue-200 p-2.5 rounded-lg shadow-sm flex items-start gap-3 hover:bg-blue-50 transition-colors text-sm group">
                                                                <div className="w-14 h-20 shrink-0 relative overflow-hidden rounded-md shadow-sm border border-gray-100">
                                                                    {mainBook.imageUrl ? (
                                                                        <BookImage imageUrl={mainBook.imageUrl} title={mainBook.title} />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                                            <Book size={20} className="text-blue-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 flex flex-col justify-center h-full">
                                                                    <p className="font-bold text-blue-800 line-clamp-2 group-hover:text-blue-600 transition-colors">{mainBook.title}</p>
                                                                    {mainBook.price !== undefined && (
                                                                        <p className="text-[14px] font-bold text-red-600 mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(mainBook.price)}</p>
                                                                    )}
                                                                    {mainBook.stockQuantity !== undefined && (
                                                                        <p className="text-[13px] text-gray-500 mt-0.5">Tồn kho: <span className="font-medium text-gray-700">{mainBook.stockQuantity}</span></p>
                                                                    )}
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    )}
                                                    
                                                    {otherBooks.length > 0 && (
                                                        <div className="flex flex-col gap-1.5 mt-1">
                                                            <p className="text-[13px] text-gray-700 font-semibold flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                                {mainBook ? "Sách tương tự" : "Sách gợi ý"}
                                                            </p>
                                                            <div className="flex flex-col gap-2">
                                                                {otherBooks.map((src, idx) => (
                                                                    <Link key={idx} href={`/user/books/${src.bookId}`} className="bg-white border border-gray-100 p-2 rounded-md shadow-sm flex items-start gap-2.5 hover:bg-gray-50 transition-colors text-sm group">
                                                                        <div className="w-10 h-14 shrink-0 relative overflow-hidden rounded shadow-sm border border-gray-50">
                                                                            {src.imageUrl ? (
                                                                                <BookImage imageUrl={src.imageUrl} title={src.title} />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                                                                    <Book size={16} className="text-gray-400" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 flex flex-col justify-center h-full">
                                                                            <p className="font-medium text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{src.title}</p>
                                                                            {src.price !== undefined && (
                                                                                <p className="text-[12px] font-medium text-gray-600 mt-0.5">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(src.price)}</p>
                                                                            )}
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="self-start bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full p-2 flex items-center justify-center transition-colors"
                        >
                            <Send size={18} className={input.trim() ? "ml-1" : ""} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
