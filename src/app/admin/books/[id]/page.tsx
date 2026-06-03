'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { getBookById, Book } from "@/services/booksService";
import {
    getChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    generateTTS,
    generateTTSBulk,
    stopTTS,
    Chapter,
    AudioSegment,
} from "@/services/audiobooksService";
import {
    ArrowLeft,
    BookOpen,
    Edit,
    Play,
    Pause,
    RotateCw,
    Volume2,
    Cpu,
    ChevronRight,
    Sparkles,
    FileText,
    Trash2,
    UploadCloud,
    CheckCircle,
    Clock,
    AlertCircle,
    Barcode,
    Settings2,
    Music4,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastState {
    message: string;
    type: "success" | "error" | "info";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCorrectImageUrl(imageUrl?: string): string {
    if (!imageUrl)
        return "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60";
    if (imageUrl.startsWith("http")) return imageUrl;
    let clean = imageUrl;
    if (clean.startsWith("books/")) clean = clean.slice(6);
    else if (clean.startsWith("book/")) clean = clean.slice(5);
    return `${API_URL}/uploads/books/${clean}`;
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const bookId = typeof id === "string" ? parseInt(id, 10) : null;

    // ── Core data ──
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [chaptersError, setChaptersError] = useState<string | null>(null);

    // ── UI state ──
    const [activeTab, setActiveTab] = useState<"info" | "audio">("info");
    const [selectedVoice, setSelectedVoice] = useState("banmai");
    const [selectedSpeed, setSelectedSpeed] = useState("1.0x");
    const [toast, setToast] = useState<ToastState | null>(null);

    // ── Upload modal ──
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [newChapterNumber, setNewChapterNumber] = useState("");
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [newChapterTextContent, setNewChapterTextContent] = useState("");
    const [newChapterFile, setNewChapterFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // ── Edit modal ──
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [editChapterNumber, setEditChapterNumber] = useState("");
    const [editChapterTitle, setEditChapterTitle] = useState("");
    const [editChapterTextContent, setEditChapterTextContent] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    // ── Playback (Playlist engine) ──
    /** Danh sách segments đã sort theo sequenceOrder của chương đang phát */
    const [playlist, setPlaylist] = useState<AudioSegment[]>([]);
    /** Index segment hiện tại trong playlist (0-indexed) */
    const [currentIndex, setCurrentIndex] = useState(0);
    /** Đang phát hay đang dừng */
    const [isPlaying, setIsPlaying] = useState(false);
    /** Chương đang được phát (dùng cho player UI) */
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    /** Thời gian hiện tại của segment đang phát (giây) */
    const [currentTime, setCurrentTime] = useState(0);
    /** Thời lượng của segment đang phát (giây) */
    const [segmentDuration, setSegmentDuration] = useState(0);
    /** Ref đến thẻ Audio duy nhất — centralized, không bao giờ tạo thêm thẻ khác song song */
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Ref to always read latest chapters inside interval without re-creating it
    const chaptersRef = useRef<Chapter[]>(chapters);
    useEffect(() => {
        chaptersRef.current = chapters;
    }, [chapters]);

    // ─── Auth error helper ───────────────────────────────────────────────────

    const handleAuthError = useCallback((err: any) => {
        if (err?.message?.includes("401")) {
            localStorage.removeItem("token");
            window.location.replace("/");
        }
    }, []);

    // ─── Toast ───────────────────────────────────────────────────────────────

    const showToast = useCallback((message: string, type: ToastState["type"]) => {
        setToast({ message, type });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    // ─── Data loading ────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        if (!bookId) return;
        try {
            setLoading(true);
            setError(null);
            setChaptersError(null);

            const bookData = await getBookById(bookId);
            setBook(bookData);

            try {
                const chapterList = await getChapters(bookId);
                setChapters(chapterList);
            } catch (chapterErr: any) {
                console.error("Chapters API failed:", chapterErr);
                setChaptersError(
                    chapterErr.message || "Không thể tải danh sách chương sách từ backend."
                );
                handleAuthError(chapterErr);
            }
        } catch (err: any) {
            console.error("Error loading book detail data:", err);
            setError("Không thể kết nối đến hệ thống backend. Vui lòng kiểm tra lại server.");
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    }, [bookId, handleAuthError]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ─── Polling (FIX: only recreate when bookId changes, read chapters via ref) ──

    useEffect(() => {
        if (!bookId) return;

        const interval = setInterval(async () => {
            const hasWorking = chaptersRef.current.some((c) => c.status === "processing" || c.status === "pending");
            if (!hasWorking) return;

            try {
                const chapterList = await getChapters(bookId);

                // Notify when a chapter finishes
                chaptersRef.current.forEach((oldCh) => {
                    const newCh = chapterList.find((c) => c.id === oldCh.id);
                    if (oldCh.status === "processing" && newCh?.status === "completed") {
                        showToast(
                            `Chương ${newCh.number}: "${newCh.title}" đã hoàn thành chuyển giọng nói AI!`,
                            "success"
                        );
                    }
                });

                setChapters(chapterList);
            } catch (e: any) {
                const msg: string = e?.message ?? '';
                if (msg.includes('401')) {
                    handleAuthError(e); // Real token expiry → redirect
                } else {
                    // Network blip / backend restarting → skip silently, don't log out
                    console.warn('Polling skipped (transient):', msg);
                }
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [bookId, showToast, handleAuthError]); // ✅ NOT chapters

    // ─── Audio cleanup on unmount (FIX: was missing) ─────────────────────────


    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                audioRef.current = null;
            }
        };
    }, []);

    // ─── Playlist Engine (Gapless Playback) ──────────────────────────────────
    //
    // Tại sao dùng useEffect thay vì xử lý trong event handler?
    // - Tránh stale closure: handler chạy trong addEventListener không thấy state mới
    // - Mỗi khi currentIndex thay đổi (do onended), effect này chạy để phát segment tiếp theo
    // - audioRef luôn là instance duy nhất → không bao giờ có 2 audio phát song song

    useEffect(() => {
        // Chỉ chạy khi có playlist và đang cần phát
        if (playlist.length === 0 || !isPlaying) return;

        const segment = playlist[currentIndex];
        if (!segment?.audioUrl) return;

        const url = segment.audioUrl.startsWith("http")
            ? segment.audioUrl
            : `${API_URL}${segment.audioUrl.startsWith('/') ? '' : '/'}${segment.audioUrl}`;

        // ① Dừng và hủy bỏ instance audio cũ (centralized teardown)
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }

        // ② Tạo instance audio mới duy nhất
        const audio = new Audio(url);
        audioRef.current = audio;

        // Reset UI time
        setCurrentTime(0);
        setSegmentDuration(segment.durationSeconds ?? 0);

        // ③ Phát với retry tối đa 5 lần
        let retryCount = 0;
        const tryPlay = () => {
            audio.play().catch((err) => {
                console.error(`[Playlist] Segment ${currentIndex + 1} attempt ${retryCount + 1}:`, err);
                if (retryCount < 5) {
                    retryCount++;
                    setTimeout(tryPlay, 3000);
                } else {
                    showToast(`Lỗi phát đoạn ${currentIndex + 1}/${playlist.length} sau 5 lần thử.`, "error");
                    setIsPlaying(false);
                }
            });
        };
        tryPlay();

        // ④ Cập nhật thời gian thực tế
        audio.addEventListener("loadedmetadata", () => setSegmentDuration(audio.duration));
        audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));

        // ⑤ Gapless: khi đoạn này xong → tăng index (React sẽ re-run effect này)
        audio.addEventListener("ended", () => {
            if (currentIndex < playlist.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                // Hết toàn bộ playlist
                setIsPlaying(false);
                setCurrentTime(0);
                showToast(
                    ` Đã phát xong toàn bộ ${playlist.length} đoạn của chương "${currentChapter?.title}".`,
                    "success"
                );
            }
        });

        // Cleanup khi effect chạy lại (segment thay đổi) hoặc component unmount
        return () => {
            audio.pause();
            audio.src = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlist, currentIndex, isPlaying]); // showToast & currentChapter intentionally omitted (stable)

    // ─── Playback Controls ────────────────────────────────────────────────────


    const handlePlaySample = useCallback(
        (chapter: Chapter) => {
            // Toggle play/pause nếu đang phát cùng chương
            if (currentChapter?.id === chapter.id) {
                if (isPlaying) {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                } else {
                    // Resume: effect sẽ phát lại từ currentIndex
                    setIsPlaying(true);
                }
                return;
            }

            // Lấy và sort audioSegments theo sequenceOrder tăng dần
            const segments = chapter.audioSegments ?? [];
            const readySegments = segments
                .filter(s => s.audioUrl && s.audioUrl !== "null" && s.audioUrl !== "undefined")
                .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

            if (readySegments.length === 0) {
                showToast("Chương này chưa có đoạn audio nào sẵn sàng để phát.", "error");
                return;
            }

            // Cập nhật state → playlist engine (useEffect) sẽ tự động phát
            setCurrentChapter(chapter);
            setPlaylist(readySegments);
            setCurrentIndex(0);
            setCurrentTime(0);
            setIsPlaying(true);
        },
        [currentChapter, isPlaying, showToast]
    );

    const handleClosePlayback = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
        setPlaylist([]);
        setCurrentIndex(0);
        setIsPlaying(false);
        setCurrentChapter(null);
        setCurrentTime(0);
        setSegmentDuration(0);
    }, []);

    /** Phát/Dừng từ thanh player (không load lại segment) */
    const handleTogglePlayPause = useCallback(() => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            // setIsPlaying(true) sẽ trigger effect → play lại segment hiện tại
            setIsPlaying(true);
        }
    }, [isPlaying]);


    // ─── TTS actions ─────────────────────────────────────────────────────────

    const handleStartSingleTTS = useCallback(
        async (chapterId: number) => {
            if (!bookId) return;
            try {
                showToast("Đang gửi yêu cầu dịch chương...", "info");
                const updatedChapter = await generateTTS(bookId, chapterId, selectedVoice, selectedSpeed);
                setChapters((prev) =>
                    prev.map((ch) => (ch.id === chapterId ? { ...ch, ...updatedChapter } : ch))
                );
                showToast(`✅ Đã gửi yêu cầu chuyển đổi chương ${updatedChapter.number || ""}. Đang chờ AI xử lý...`, "success");
            } catch (e: any) {
                console.error("Backend TTS failed:", e);
                const msg: string = e?.message ?? "";
                // Phân loại và hiển thị thông báo lỗi chi tiết
                if (msg.includes("API key") || msg.includes("api-key") || msg.includes("code=1")) {
                    showToast("❌ Lỗi: API key không hợp lệ. Kiểm tra cấu hình hệ thống.", "error");
                } else if (msg.includes("quota") || msg.includes("code=2")) {
                    showToast("❌ Lỗi: Tài khoản TTS đã hết giới hạn sử dụng.", "error");
                } else if (msg.includes("quá dài") || msg.includes("code=5")) {
                    showToast("❌ Lỗi: Văn bản chương quá dài. Backend đã tự cắt — thử lại.", "error");
                } else if (msg.includes("trống") || msg.includes("blank")) {
                    showToast("❌ Lỗi: Chương này không có nội dung văn bản để dịch.", "error");
                } else if (msg.includes("bảo trì") || msg.includes("code=10") || msg.includes("timeout")) {
                    showToast("❌ Dịch vụ AI đang bận hoặc bảo trì. Vui lòng thử lại sau ít phút.", "error");
                } else {
                    showToast(msg || "Không thể thực hiện chuyển đổi TTS. Kiểm tra console backend để biết chi tiết.", "error");
                }
                handleAuthError(e);
            }
        },
        [bookId, selectedVoice, selectedSpeed, showToast, handleAuthError]
    );

    const handleStopTTS = useCallback(
        async (chapterId: number) => {
            if (!bookId) return;
            try {
                showToast("Đang gửi yêu cầu dừng...", "info");
                const updatedChapter = await stopTTS(bookId, chapterId);
                setChapters((prev) =>
                    prev.map((ch) => (ch.id === chapterId ? { ...ch, ...updatedChapter } : ch))
                );
                showToast("Đã dừng quá trình chuyển đổi TTS.", "success");
            } catch (e: any) {
                console.error("Stop TTS failed:", e);
                showToast("Không thể dừng tiến trình. Thử tải lại trang.", "error");
                handleAuthError(e);
            }
        },
        [bookId, showToast, handleAuthError]
    );

    const handleBulkTTS = useCallback(async () => {
        if (!bookId) return;
        const toProcess = chapters.filter((c) => c.status === "pending" || c.status === "failed").length;
        if (toProcess === 0) {
            showToast("Tất cả các chương đã hoàn thành chuyển đổi âm thanh.", "info");
            return;
        }
        try {
            showToast(
                `⏳ Đang gửi ${toProcess} chương lên hệ thống AI... Quá trình có thể mất vài phút.`,
                "info"
            );
            const updatedList = await generateTTSBulk(bookId, selectedVoice, selectedSpeed);
            setChapters(updatedList);
            showToast(`✅ Đã gửi ${toProcess} chương. Theo dõi tiến trình trong bảng bên dưới.`, "success");
        } catch (e: any) {
            console.error("Backend bulk TTS failed:", e);
            const msg: string = e?.message ?? "";
            if (msg.includes("API key") || msg.includes("code=1")) {
                showToast("❌ API key không hợp lệ. Kiểm tra cấu hình hệ thống.", "error");
            } else if (msg.includes("quota") || msg.includes("code=2")) {
                showToast("❌ Tài khoản TTS hết giới hạn sử dụng.", "error");
            } else if (msg.includes("timeout")) {
                showToast("❌ Dịch vụ AI phản hồi chậm. Vui lòng thử lại sau ít phút.", "error");
            } else {
                showToast(msg || "Chuyển đổi hàng loạt thất bại. Xem console backend để biết lỗi chi tiết.", "error");
            }
            handleAuthError(e);
        }
    }, [bookId, chapters, selectedVoice, selectedSpeed, showToast, handleAuthError]);

    const handleDeleteChapter = useCallback(
        async (chapterId: number) => {
            if (!bookId) return;
            // Replace native confirm with inline confirmation via toast pattern — avoids SSR issues
            const confirmed = window.confirm("Bạn có chắc chắn muốn xóa chương sách này?");
            if (!confirmed) return;
            try {
                await deleteChapter(bookId, chapterId);
                setChapters((prev) => prev.filter((c) => c.id !== chapterId));
                showToast("Đã xóa chương sách thành công.", "success");
            } catch (e: any) {
                console.error("Backend delete failed:", e);
                showToast(e.message || "Xóa chương sách thất bại.", "error");
                handleAuthError(e);
            }
        },
        [bookId, showToast, handleAuthError]
    );

    // ─── Upload modal ─────────────────────────────────────────────────────────

    const resetUploadModal = useCallback(() => {
        setIsUploadModalOpen(false);
        setNewChapterTitle("");
        setNewChapterNumber("");
        setNewChapterTextContent("");
        setNewChapterFile(null);
    }, []);

    const handleUploadSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!bookId) return;

            if (!newChapterNumber.trim()) {
                showToast("Vui lòng điền số chương.", "error");
                return;
            }
            if (!newChapterTitle.trim()) {
                showToast("Vui lòng điền tiêu đề chương sách.", "error");
                return;
            }
            if (!newChapterTextContent.trim() && !newChapterFile) {
                showToast("Vui lòng tải lên file văn bản hoặc nhập văn bản trực tiếp.", "error");
                return;
            }

            setIsUploading(true);
            showToast("Đang gửi văn bản lên backend...", "info");

            const chapterNum = newChapterNumber.trim();

            try {
                const created = await createChapter(
                    bookId,
                    chapterNum,
                    newChapterTitle.trim(),
                    newChapterTextContent,
                    newChapterFile
                );
                setChapters((prev) =>
                    [...prev, created].sort((a, b) => a.number.localeCompare(b.number))
                );
                showToast(`Đã thêm thành công Chương ${created.number}! Sẵn sàng chạy TTS.`, "success");
                resetUploadModal();
            } catch (err: any) {
                console.error("Backend upload failed:", err);
                showToast(err.message || "Tải lên văn bản chương thất bại.", "error");
                handleAuthError(err);
            } finally {
                setIsUploading(false);
            }
        },
        [
            bookId,
            chapters.length,
            newChapterTitle,
            newChapterNumber,
            newChapterTextContent,
            newChapterFile,
            showToast,
            resetUploadModal,
            handleAuthError,
        ]
    );

    // ─── Edit modal ───────────────────────────────────────────────────────────

    const handleOpenEditModal = useCallback((chapter: Chapter) => {
        setEditingChapter(chapter);
        setEditChapterNumber(chapter.number);
        setEditChapterTitle(chapter.title);
        setEditChapterTextContent(chapter.textContent || "");
        setIsEditModalOpen(true);
    }, []);

    const resetEditModal = useCallback(() => {
        setIsEditModalOpen(false);
        setEditingChapter(null);
        setEditChapterNumber("");
        setEditChapterTitle("");
        setEditChapterTextContent("");
    }, []);

    const handleEditSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!bookId || !editingChapter) return;

            if (!editChapterNumber.trim()) {
                showToast("Vui lòng điền số chương.", "error");
                return;
            }
            if (!editChapterTitle.trim()) {
                showToast("Vui lòng điền tiêu đề chương sách.", "error");
                return;
            }

            setIsUpdating(true);
            showToast("Đang cập nhật văn bản lên backend...", "info");

            try {
                const updated = await updateChapter(
                    bookId,
                    editingChapter.id,
                    editChapterNumber.trim(),
                    editChapterTitle.trim(),
                    editChapterTextContent
                );
                setChapters((prev) =>
                    prev.map((ch) => (ch.id === editingChapter.id ? { ...ch, ...updated } : ch))
                        .sort((a, b) => a.number.localeCompare(b.number))
                );
                showToast(`Đã cập nhật thành công Chương ${updated.number}!`, "success");
                resetEditModal();
            } catch (err: any) {
                console.error("Backend update failed:", err);
                showToast(err.message || "Cập nhật văn bản chương thất bại.", "error");
                handleAuthError(err);
            } finally {
                setIsUpdating(false);
            }
        },
        [
            bookId,
            editingChapter,
            editChapterTitle,
            editChapterNumber,
            editChapterTextContent,
            showToast,
            resetEditModal,
            handleAuthError,
        ]
    );

    // ─── Derived values ───────────────────────────────────────────────────────

    const totalCh = chapters.length;
    const completedCh = chapters.filter((c) => c.status === "completed").length;
    const pendingCh = chapters.filter((c) => c.status === "pending").length;
    const processingCh = chapters.filter((c) => c.status === "processing").length;
    const failedCh = chapters.filter((c) => c.status === "failed").length;
    const toProcessCh = pendingCh + failedCh; // Chờ + Lỗi = cần dịch lại

    // ─── Render guards ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
                <div
                    className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-[#b70011]"
                    role="status"
                />
                <p className="mt-4 text-slate-500 font-semibold text-sm">
                    Đang tải dữ liệu từ backend...
                </p>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Không tìm thấy dữ liệu</h3>
                <p className="text-slate-500 text-sm mt-1">
                    {error || "Sách này không tồn tại hoặc đã bị xóa."}
                </p>
                <button
                    onClick={() => router.push("/admin/books")}
                    className="mt-6 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const priceFormatted = new Intl.NumberFormat("vi-VN").format(book.price);

    // ─── JSX ─────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6 max-w-[1400px] w-full mx-auto font-sans pb-24">
            {/* ── Toast ── */}
            {toast && (
                <div
                    className={`fixed top-24 right-6 z-[9999] p-4 rounded-xl border flex items-center gap-3 shadow-lg max-w-md transition-all ${toast.type === "success"
                        ? "bg-green-50 text-green-900 border-green-200 shadow-green-100"
                        : toast.type === "error"
                            ? "bg-red-50 text-red-900 border-red-200 shadow-red-100"
                            : "bg-blue-50 text-blue-900 border-blue-200 shadow-blue-100"
                        }`}
                >
                    <span
                        className={`w-3 h-3 rounded-full shrink-0 animate-pulse ${toast.type === "success"
                            ? "bg-green-500"
                            : toast.type === "error"
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                    />
                    <p className="text-xs font-bold leading-tight">{toast.message}</p>
                    <button
                        onClick={() => setToast(null)}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none shrink-0 ml-auto"
                    >
                        &times;
                    </button>
                </div>
            )}

            {/* ── Breadcrumb ── */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <nav className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <Link href="/admin/dashboard" className="hover:text-[#b70011] transition-colors">
                            Dashboard
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/admin/books" className="hover:text-[#b70011] transition-colors">
                            Kho sách
                        </Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[#b70011]">Chi tiết sách</span>
                    </nav>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                        Chi tiết &amp; Sách nói
                    </h2>
                </div>
                <button
                    onClick={() => router.push("/admin/books")}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:text-[#b70011] hover:border-[#b70011] rounded-lg font-semibold text-xs transition-all duration-200 bg-white"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại kho sách</span>
                </button>
            </section>

            {/* ── Main Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Tabs */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 sm:px-8 flex items-center gap-6 sm:gap-10">
                    {(["info", "audio"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 px-1 font-bold text-xs sm:text-sm transition-all border-b-2 ${activeTab === tab
                                ? "border-[#b70011] text-[#b70011]"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            {tab === "info" ? "Thông tin chung" : "Quản lý Sách nói"}
                        </button>
                    ))}
                </div>

                {/* ── Tab: Info ── */}
                {activeTab === "info" && (
                    <div className="p-6 sm:p-8 md:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                            {/* Cover */}
                            <div className="lg:col-span-4 xl:col-span-3 flex flex-col items-center">
                                <div className="sticky top-6 w-full max-w-[240px]">
                                    <div className="rounded-2xl bg-white p-2.5 shadow-md border border-slate-200/60 group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#b70011]/30">
                                        <img
                                            src={getCorrectImageUrl(book.imageUrl)}
                                            alt={book.title}
                                            className="w-full h-auto aspect-[3/4.2] object-cover rounded-xl shadow-sm transition-transform duration-700 group-hover:scale-105"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=60";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px] rounded-xl">
                                            <Link
                                                href={`/admin/books/${book.id}/edit`}
                                                className="bg-white text-[#b70011] p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-col items-center gap-3">
                                        <div className="px-3.5 py-1 bg-slate-100 border border-slate-200 rounded-full flex items-center gap-1.5">
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${book.active ? "bg-green-500 animate-pulse" : "bg-slate-400"
                                                    }`}
                                            />
                                            <span className="font-mono text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                                                ID: LBR-00{book.id}
                                            </span>
                                        </div>
                                        {book.active ? (
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1 shadow-sm">
                                                <CheckCircle className="w-3.5 h-3.5" /> KINH DOANH
                                            </span>
                                        ) : (
                                            <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1 shadow-sm">
                                                <AlertCircle className="w-3.5 h-3.5" /> TẠM ẨN
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                                <div className="border-b border-slate-100 pb-5">
                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                        {book.title}
                                    </h3>
                                    <p className="text-sm font-semibold text-slate-400 mt-1.5 italic">
                                        Tác giả:{" "}
                                        <span className="text-[#b70011] font-bold uppercase tracking-wider not-italic">
                                            {book.publisher || "Đang cập nhật"}
                                        </span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#b70011] uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-[#b70011] rounded-full" />
                                            Thông tin chung
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                    Mã ISBN-13
                                                </label>
                                                <p className="font-mono text-sm font-bold text-slate-800">
                                                    {book.isbn || "—"}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                    Nhà xuất bản
                                                </label>
                                                <p className="font-bold text-slate-800 text-sm">
                                                    {book.publisher || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#b70011] uppercase tracking-[0.2em] flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-[#b70011] rounded-full" />
                                            Thương mại &amp; Kho
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                    Giá niêm yết
                                                </label>
                                                <p className="font-black text-[#b70011] text-base">
                                                    {priceFormatted} VNĐ
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                                    Tồn kho hiện tại
                                                </label>
                                                <p className="font-bold text-slate-800 text-sm">
                                                    {book.quantity}{" "}
                                                    <span className="text-xs font-normal text-slate-400">cuốn</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-[#b70011] uppercase tracking-[0.2em] flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-[#b70011] rounded-full" />
                                        Mô tả nội dung
                                    </h4>
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                        <p className="text-xs sm:text-sm leading-relaxed text-slate-600 text-justify whitespace-pre-line">
                                            {book.description || "Chưa có thông tin mô tả chi tiết của sách này."}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                                    <Link
                                        href={`/admin/books/${book.id}/edit`}
                                        className="bg-[#b70011] hover:bg-[#b70011]/90 text-white font-bold text-xs px-5 py-3 rounded-lg flex items-center gap-1.5 shadow-md shadow-[#b70011]/15 active:scale-95 transition-all"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Chỉnh sửa thông tin</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            showToast("Đang chuẩn bị dữ liệu mã vạch sách...", "info");
                                            setTimeout(() => window.print(), 800);
                                        }}
                                        className="bg-white border border-slate-200 text-slate-700 hover:text-[#b70011] hover:border-[#b70011] font-bold text-xs px-5 py-3 rounded-lg transition-all flex items-center gap-1.5"
                                    >
                                        <Barcode className="w-4 h-4" />
                                        <span>In tem mã vạch</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab: Audio ── */}
                {activeTab === "audio" && (
                    <div className="p-6 sm:p-8 md:p-10 space-y-8">
                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                {
                                    bg: "bg-slate-50 border-slate-200/60",
                                    iconBg: "bg-slate-200/50 text-slate-700",
                                    icon: <BookOpen className="w-5 h-5" />,
                                    label: "Tổng số chương",
                                    value: `${totalCh} chương`,
                                    labelColor: "text-slate-400",
                                    valueColor: "text-slate-800",
                                },
                                {
                                    bg: "bg-green-50/40 border-green-100",
                                    iconBg: "bg-green-100/50 text-green-700",
                                    icon: <CheckCircle className="w-5 h-5" />,
                                    label: "Đã hoàn thành",
                                    value: `${completedCh} / ${totalCh}`,
                                    labelColor: "text-green-600/70",
                                    valueColor: "text-green-800",
                                },
                                {
                                    bg: "bg-amber-50/40 border-amber-100",
                                    iconBg: "bg-amber-100/50 text-amber-700",
                                    icon: <Clock className="w-5 h-5" />,
                                    label: "Chờ chuyển đổi AI",
                                    value: `${pendingCh} chương`,
                                    labelColor: "text-amber-600/70",
                                    valueColor: "text-amber-800",
                                },
                                {
                                    bg: "bg-blue-50/40 border-blue-100",
                                    iconBg: "bg-blue-100/50 text-blue-700",
                                    icon: <RotateCw className="w-5 h-5 animate-spin" />,
                                    label: "Đang chuyển đổi",
                                    value: `${processingCh} chương`,
                                    labelColor: "text-blue-600/70",
                                    valueColor: "text-blue-800",
                                },
                            ].map((stat) => (
                                <div
                                    key={stat.label}
                                    className={`${stat.bg} border p-5 rounded-xl flex items-center gap-4`}
                                >
                                    <div
                                        className={`w-12 h-12 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0`}
                                    >
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-bold ${stat.labelColor} uppercase tracking-wider`}>
                                            {stat.label}
                                        </p>
                                        <h4 className={`text-xl font-black ${stat.valueColor}`}>{stat.value}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            {/* AI Config */}
                            <div className="lg:col-span-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-6">
                                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                                    <Settings2 className="w-5 h-5 text-[#b70011]" />
                                    <h3 className="text-sm font-bold text-slate-800">Cấu hình hệ thống AI TTS</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Giọng đọc (AI Voice Model)
                                        </label>
                                        <select
                                            value={selectedVoice}
                                            onChange={(e) => setSelectedVoice(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] transition-all font-medium text-slate-700"
                                        >
                                            <option value="banmai">Ban Mai (Nữ miền Bắc)</option>
                                            <option value="leminh">Lê Minh (Nam miền Bắc)</option>
                                            <option value="giahuy">Gia Huy (Nam miền Nam)</option>
                                            <option value="thuminh">Thu Minh (Nữ miền Nam)</option>
                                            <option value="ngoclam">Ngọc Lâm (Nữ giọng chuẩn)</option>
                                            <option value="baotin">Bảo Tín (Nam năng động)</option>
                                            <option value="vyvy">Vy Vy (Nữ nhẹ nhàng)</option>
                                            <option value="phuocloc">Phước Lộc (Nam vui vẻ)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Tốc độ đọc (Rate speed)
                                        </label>
                                        <select
                                            value={selectedSpeed}
                                            onChange={(e) => setSelectedSpeed(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] transition-all font-medium text-slate-700"
                                        >
                                            <option value="0.8x">0.8x (Chậm)</option>
                                            <option value="1.0x">1.0x (Mặc định)</option>
                                            <option value="1.2x">1.2x (Nhanh)</option>
                                            <option value="1.5x">1.5x (Rất nhanh)</option>
                                        </select>
                                    </div>

                                    <div className="p-3 bg-red-50/50 border border-red-100 rounded-xl">
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            Giọng đọc AI được tích hợp qua dịch vụ TTS, tự động làm sạch văn bản và
                                            chuyển ngữ âm thanh chất lượng cao.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleBulkTTS}
                                    className="w-full flex items-center justify-center gap-1.5 bg-[#b70011] hover:bg-[#b70011]/90 text-white font-bold py-3 rounded-lg text-xs shadow-md shadow-[#b70011]/15 transition-all"
                                >
                                    <Cpu className="w-4 h-4" />
                                    <span>Dịch hàng loạt ({toProcessCh} chương)</span>
                                </button>
                            </div>

                            {/* Chapter table */}
                            <div className="lg:col-span-8 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                        <Music4 className="w-4 h-4 text-[#b70011]" />
                                        Danh sách Audio chương sách
                                    </h3>
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 hover:text-[#b70011] hover:border-[#b70011] font-bold px-3.5 py-2 rounded-lg text-[11px] transition-all shadow-sm"
                                    >
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        <span>Nhập Văn bản Chương</span>
                                    </button>
                                </div>

                                {chaptersError ? (
                                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold">{chaptersError}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-24">
                                                            Chương
                                                        </th>
                                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            Tiêu đề
                                                        </th>
                                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            Giọng / Thời lượng
                                                        </th>
                                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-36">
                                                            Trạng thái
                                                        </th>
                                                        <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-44">
                                                            Thao tác
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {chapters.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={5}
                                                                className="py-10 text-center text-slate-400 text-xs"
                                                            >
                                                                Chưa có chương sách nào. Hãy bấm "Nhập Văn bản Chương" để tải
                                                                lên.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        chapters.map((chapter) => (
                                                            <tr
                                                                key={chapter.id}
                                                                className="hover:bg-[#b70011]/5 transition-colors"
                                                            >
                                                                <td className="py-3 px-5">
                                                                    <span className="font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                                                        {chapter.number}
                                                                    </span>
                                                                </td>

                                                                <td className="py-3 px-5 font-bold text-slate-800 text-xs">
                                                                    {chapter.title}
                                                                </td>

                                                                <td className="py-3 px-5">
                                                                    {chapter.status === "completed" ? (
                                                                        <div className="space-y-0.5">
                                                                            <p className="text-[10px] font-semibold text-slate-600">
                                                                                {chapter.voiceModel || "Mặc định"}
                                                                            </p>
                                                                            <p className="text-[9px] font-mono text-slate-400">
                                                                                {chapter.duration || "—"}
                                                                            </p>
                                                                            {/* Hiển thị số đoạn audio và cảnh báo nếu trống */}
                                                                            {(() => {
                                                                                const segs = chapter.audioSegments ?? [];
                                                                                const ready = segs.filter((s: AudioSegment) => s.audioUrl && s.audioUrl !== 'null');
                                                                                if (segs.length === 0) {
                                                                                    return (
                                                                                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mt-0.5">
                                                                                            <AlertCircle className="w-2.5 h-2.5" />
                                                                                            Chưa có audio
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                return (
                                                                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full mt-0.5">
                                                                                        <Music4 className="w-2.5 h-2.5" />
                                                                                        {`${ready.length}/${segs.length} đoạn`}
                                                                                    </span>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] text-slate-400">—</span>
                                                                    )}
                                                                </td>

                                                                <td className="py-3 px-5 text-center">
                                                                    {chapter.status === "completed" && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[9px] font-bold">
                                                                            <CheckCircle className="w-2.5 h-2.5" /> Hoàn thành
                                                                        </span>
                                                                    )}
                                                                    {chapter.status === "processing" && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-bold">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                                                            AI xử lý...
                                                                            {chapter.progress !== undefined
                                                                                ? ` (${chapter.progress}%)`
                                                                                : ""}
                                                                        </span>
                                                                    )}
                                                                    {chapter.status === "pending" && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[9px] font-bold">
                                                                            <Clock className="w-2.5 h-2.5" /> Chờ chạy AI
                                                                        </span>
                                                                    )}
                                                                    {chapter.status === "failed" && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[9px] font-bold">
                                                                            <AlertCircle className="w-2.5 h-2.5" /> Lỗi AI
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                <td className="py-3 px-5 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {chapter.status === "completed" && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handlePlaySample(chapter)}
                                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9px] font-bold transition-all"
                                                                                >
                                                                                    {currentChapter?.id === chapter.id && isPlaying ? (
                                                                                        <Pause className="w-3 h-3 text-[#b70011]" />
                                                                                    ) : (
                                                                                        <Play className="w-3 h-3 text-[#b70011]" />
                                                                                    )}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleStartSingleTTS(chapter.id)}
                                                                                    className="inline-flex items-center px-2 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-all"
                                                                                    title="Chuyển đổi lại TTS"
                                                                                >
                                                                                    <RotateCw className="w-3 h-3" />
                                                                                </button>
                                                                            </>
                                                                        )}

                                                                        {chapter.status === "processing" && (
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-[9px] font-bold text-slate-400 italic">
                                                                                    Đang chạy...
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => handleStopTTS(chapter.id)}
                                                                                    className="p-1 hover:bg-slate-100 hover:text-red-600 rounded text-slate-400 transition-colors"
                                                                                    title="Dừng chuyển đổi"
                                                                                >
                                                                                    <AlertCircle className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        )}

                                                                        {chapter.status === "failed" && (
                                                                            <button
                                                                                onClick={() => handleStartSingleTTS(chapter.id)}
                                                                                className="bg-red-50 text-red-600 hover:bg-[#b70011] hover:text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 border border-red-100"
                                                                            >
                                                                                <RotateCw className="w-3 h-3" />
                                                                                <span>Dịch lại</span>
                                                                            </button>
                                                                        )}

                                                                        {chapter.status === "pending" && (
                                                                            <button
                                                                                onClick={() => handleStartSingleTTS(chapter.id)}
                                                                                className="bg-[#b70011]/15 text-[#b70011] hover:bg-[#b70011] hover:text-white font-bold text-[9px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                                                            >
                                                                                <Cpu className="w-3 h-3" />
                                                                                <span>TTS</span>
                                                                            </button>
                                                                        )}

                                                                        <button
                                                                            onClick={() => handleOpenEditModal(chapter)}
                                                                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                                                                            title="Sửa văn bản chương"
                                                                        >
                                                                            <Edit className="w-3.5 h-3.5" />
                                                                        </button>

                                                                        <button
                                                                            onClick={() => handleDeleteChapter(chapter.id)}
                                                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                                                                            title="Xóa chương này"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Floating Audio Player ── */}
            {currentChapter && playlist.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-700/60 w-[92%] max-w-2xl z-50 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#b70011] flex items-center justify-center shrink-0">
                        <Volume2 className={`w-5 h-5 text-white ${isPlaying ? "animate-bounce" : ""}`} />
                    </div>

                    <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-[#b70011] uppercase tracking-wider leading-none">
                                Chương {currentChapter.number}
                            </p>
                            {/* Badge: Đang phát đoạn X/Y */}
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                {isPlaying
                                    ? `▶ Đang phát đoạn ${currentIndex + 1}/${playlist.length}`
                                    : `⏸ Đoạn ${currentIndex + 1}/${playlist.length}`}
                            </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1 leading-none">
                            {currentChapter.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-mono text-slate-400">
                                {formatTime(currentTime)}
                            </span>
                            <div className="flex-grow h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="bg-[#b70011] h-full rounded-full transition-all duration-100"
                                    style={{
                                        width: `${segmentDuration
                                            ? (currentTime / segmentDuration) * 100
                                            : 0}%`,
                                    }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">
                                {segmentDuration ? formatTime(segmentDuration) : "0:00"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleTogglePlayPause}
                            className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 transition-all"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 fill-slate-900" />
                            ) : (
                                <Play className="w-4 h-4 fill-slate-900 translate-x-[1px]" />
                            )}
                        </button>
                        <button
                            onClick={handleClosePlayback}
                            className="text-xs text-slate-400 hover:text-white underline"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}


            {/* ── Floating Help Button ── */}
            <button
                onClick={() =>
                    showToast("Hệ thống trợ lý AI luôn sẵn sàng hỗ trợ bạn chuyển đổi văn bản.", "info")
                }
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#b70011] text-white rounded-2xl shadow-xl shadow-[#b70011]/30 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center z-40 group"
            >
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            {/* ── Upload Modal ── */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#b70011]" />
                                Nhập Văn bản Chương Sách
                            </h3>
                            <button
                                onClick={resetUploadModal}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        {/* NOTE: using onSubmit on <form> — do NOT change submit button to type="button" */}
                        <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Số chương
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: 05"
                                        value={newChapterNumber}
                                        onChange={(e) => setNewChapterNumber(e.target.value)}
                                        className="w-full bg-[#fafbfc] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Tên Chương sách nói
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Lời khuyên cuối cùng"
                                        value={newChapterTitle}
                                        onChange={(e) => setNewChapterTitle(e.target.value)}
                                        className="w-full bg-[#fafbfc] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    File văn bản nguồn (.txt, .docx, .pdf)
                                </label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-100/50 transition-colors relative">
                                    <input
                                        type="file"
                                        accept=".txt,.docx,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setNewChapterFile(file);
                                                showToast(`Đã chọn file: ${file.name}`, "info");
                                            }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <FileText className="w-7 h-7 text-slate-400 mb-1" />
                                    <p className="text-[10px] font-bold text-slate-600 text-center">
                                        {newChapterFile
                                            ? newChapterFile.name
                                            : "Kéo & thả file văn bản hoặc click chọn"}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Hoặc nhập nội dung văn bản trực tiếp
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Nhập hoặc dán nội dung chữ của chương sách vào đây..."
                                    value={newChapterTextContent}
                                    onChange={(e) => setNewChapterTextContent(e.target.value)}
                                    className="w-full bg-[#fafbfc] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all resize-y"
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={resetUploadModal}
                                    disabled={isUploading}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="px-4 py-2 bg-[#b70011] hover:bg-[#b70011]/90 text-white font-bold rounded-lg text-xs shadow-md shadow-[#b70011]/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" />
                                            <span>Đang tải lên...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-3.5 h-3.5" />
                                            <span>Xác nhận nhập</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ── */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#b70011]" />
                                Sửa Văn bản Chương Sách
                            </h3>
                            <button
                                onClick={resetEditModal}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Số chương
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: 05"
                                        value={editChapterNumber}
                                        onChange={(e) => setEditChapterNumber(e.target.value)}
                                        className="w-full bg-[#fafbfc] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Tên Chương sách nói
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Lời khuyên cuối cùng"
                                        value={editChapterTitle}
                                        onChange={(e) => setEditChapterTitle(e.target.value)}
                                        className="w-full bg-[#fafbfc] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Nội dung văn bản chương sách
                                </label>
                                <textarea
                                    rows={8}
                                    placeholder="Nhập hoặc dán nội dung chữ của chương sách vào đây..."
                                    value={editChapterTextContent}
                                    onChange={(e) => setEditChapterTextContent(e.target.value)}
                                    className="w-full bg-[#fafbfc] border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#b70011] focus:ring-1 focus:ring-[#b70011] transition-all resize-y font-normal"
                                />
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                                    Lưu ý: Nếu thay đổi nội dung văn bản, các file âm thanh cũ đã chuyển đổi (TTS) của chương này sẽ bị xóa tự động. Bạn cần thực hiện dịch lại để cập nhật giọng đọc mới.
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={resetEditModal}
                                    disabled={isUpdating}
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-[#b70011] hover:bg-[#b70011]/90 text-white font-bold rounded-lg text-xs shadow-md shadow-[#b70011]/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" />
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            <span>Lưu thay đổi</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}