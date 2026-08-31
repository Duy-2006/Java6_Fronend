'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslationStore } from '@/store/useTranslationStore';
import { getChapters, Chapter } from '@/services/audiobooksService';
import { CheckCircle, X } from 'lucide-react';
import { getBookById } from '@/services/booksService';

export default function GlobalAudioTracker() {
    const { activeBookIds, removeBook, triggerCompletion } = useTranslationStore();
    
    // Luu trang thai chapters cua cac book dang theo doi
    const chaptersRef = useRef<Record<number, Chapter[]>>({});
    
    const [toastMessage, setToastMessage] = useState<{ bookId: number; message: string } | null>(null);

    // Tu dong an toast sau 6 giay
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        if (activeBookIds.length === 0) return;

        const interval = setInterval(() => {
            activeBookIds.forEach(async (bookId) => {
                try {
                    const chapterList = await getChapters(bookId);
                    
                    const oldChapters = chaptersRef.current[bookId] || [];
                    
                    // Tim xem co chapter nao vua moi chuyen sang PENDING_REVIEW khong
                    let newlyCompleted = false;
                    
                    if (oldChapters.length > 0) {
                        oldChapters.forEach((oldCh) => {
                            const newCh = chapterList.find((c) => c.id === oldCh.id);
                            if (oldCh && newCh) {
                                newCh.audioSegments.forEach((newSeg) => {
                                    const oldSeg = oldCh.audioSegments.find(s => s.languageCode === newSeg.languageCode && s.sequenceOrder === newSeg.sequenceOrder);
                                    if (oldSeg && (oldSeg.ttsStatus === "PROCESSING" || oldSeg.ttsStatus === "pending") && newSeg.ttsStatus === "PENDING_REVIEW") {
                                        newlyCompleted = true;
                                    }
                                });
                            }
                        });
                    }

                    // Cap nhat ref
                    chaptersRef.current[bookId] = chapterList;

                    if (newlyCompleted) {
                        // Kich hoat su kien cho cac trang khac biet (neu dang mo)
                        triggerCompletion(bookId);
                        
                        // Chi show toast Global neu KHONG O TRANG book hien tai
                        if (!window.location.pathname.includes(`/admin/books/${bookId}`)) {
                            let bookTitle = `ID: ${bookId}`;
                            try {
                                const bookInfo = await getBookById(bookId);
                                if (bookInfo && bookInfo.title) {
                                    bookTitle = `"${bookInfo.title}"`;
                                }
                            } catch (err) {
                                console.error("Khong the lay ten sach cho toast", err);
                            }
                            
                            setToastMessage({
                                bookId,
                                message: `Sách ${bookTitle} đã có bản dịch mới cần phê duyệt!`
                            });
                        }
                    }
                    
                    // Neu tat ca deu da SUCCESS hoac PENDING_REVIEW hoac DELETED thi xoa luon khoi queue de bot quet
                    const isStillProcessing = chapterList.some(ch => 
                        ch.status === "processing" || 
                        ch.audioSegments?.some(seg => seg.ttsStatus === "PROCESSING" || seg.ttsStatus === "pending")
                    );
                    
                    if (!isStillProcessing && oldChapters.length > 0) {
                        removeBook(bookId);
                    }

                } catch (e) {
                    console.error("Loi khi quet trang thai dich sach: ", e);
                }
            });
        }, 10000); // Quet 10s/lan de giam tai server va chong lag

        return () => clearInterval(interval);
    }, [activeBookIds, removeBook, triggerCompletion]);

    // Hien thi Toast (Neu co)
    if (!toastMessage) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] bg-white border-l-4 border-emerald-500 shadow-xl rounded-lg p-4 w-80 animate-fade-in flex flex-col gap-2">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle size={20} />
                    <span>Hoàn thành dịch!</span>
                </div>
                <button onClick={() => setToastMessage(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
            <p className="text-sm text-gray-600 font-medium">{toastMessage.message}</p>
            <Link 
                href={`/admin/books/${toastMessage.bookId}?tab=audio`}
                onClick={() => setToastMessage(null)}
                className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded text-center transition-colors mt-1"
            >
                Nhấp để Nghe thử & Phê duyệt
            </Link>
        </div>
    );
}
