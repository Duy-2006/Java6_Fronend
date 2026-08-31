"use client";
import { authFetch } from "@/lib/authFetch";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getMediaPlayerChapters, Chapter } from "@/services/audiobooksService";

const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

// Sửa lỗi text extractor tách rời dấu ở các nguyên âm kép (ê, ô, ă, â, ơ, ư)
const fixVietnameseText = (text: string) => {
  if (!text) return "";
  let n = text.normalize("NFC");

  // 1. Xóa khoảng trắng vô lý giữa chữ cái và các dấu rời rạc (nếu có)
  n = n.replace(/([a-zA-ZÀ-ỹĐđ])\s+([´`~'’\u00B4\u0060\u02CA\u02CB\u02DC])/g, '$1$2');

  // 2. Dùng regex để ghép nguyên âm với dấu tách rời (acute, grave, tilde)
  n = n.replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[´\u00B4\u02CA\u2019']/g, '$1\u0301')
    .replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[`\u0060\u02CB]/g, '$1\u0300')
    .replace(/([aAăĂâÂeEêÊiIoOôÔơƠuUưƯyY])[~\u007E\u02DC]/g, '$1\u0303');

  // 3. Fallback: Thay thế cứng (hardcode) siêu chi tiết
  const map: Record<string, string> = {
    "ê´": "ế", "ê`": "ề", "ê~": "ễ", "ê'": "ế", "ê’": "ế",
    "ô´": "ố", "ô`": "ồ", "ô~": "ỗ", "ô'": "ố", "ô’": "ố",
    "ă´": "ắ", "ă`": "ằ", "ă~": "ẵ", "ă'": "ắ", "ă’": "ắ",
    "â´": "ấ", "â`": "ầ", "â~": "ẫ", "â'": "ấ", "â’": "ấ",
    "ơ´": "ớ", "ơ`": "ờ", "ơ~": "ỡ", "ơ'": "ớ", "ơ’": "ớ",
    "ư´": "ứ", "ư`": "ừ", "ư~": "ữ", "ư'": "ứ", "ư’": "ứ",
    "Ê´": "Ế", "Ê`": "Ề", "Ê~": "Ễ", "Ê'": "Ế", "Ê’": "Ế",
    "Ô´": "Ố", "Ô`": "Ồ", "Ô~": "Ỗ", "Ô'": "Ố", "Ô’": "Ố",
    "Ă´": "Ắ", "Ă`": "Ằ", "Ă~": "Ẵ", "Ă'": "Ắ", "Ă’": "Ắ",
    "Â´": "Ấ", "Â`": "Ầ", "Â~": "Ẫ", "Â'": "Ấ", "Â’": "Ấ",
    "Ơ´": "Ớ", "Ơ`": "Ờ", "Ơ~": "Ỡ", "Ơ'": "Ớ", "Ơ’": "Ớ",
    "Ư´": "Ứ", "Ư`": "Ừ", "Ư~": "Ữ", "Ư'": "Ứ", "Ư’": "Ứ",
    "a´": "á", "a`": "à", "a~": "ã", "a'": "á", "a’": "á",
    "e´": "é", "e`": "è", "e~": "ẽ", "e'": "é", "e’": "é",
    "i´": "í", "i`": "ì", "i~": "ĩ", "i'": "í", "i’": "í",
    "o´": "ó", "o`": "ò", "o~": "õ", "o'": "ó", "o’": "ó",
    "u´": "ú", "u`": "ù", "u~": "ũ", "u'": "ú", "u’": "ú",
    "y´": "ý", "y`": "ỳ", "y~": "ỹ", "y'": "ý", "y’": "ý"
  };
  for (const k in map) {
    n = n.replace(new RegExp(k, 'g'), map[k]);
  }

  // 4. Chuẩn hóa lại lần cuối
  return n.normalize("NFC");
};

export default function UserAudiobookPlayer() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = Number(params.id);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bookTitle, setBookTitle] = useState("");
  const [bookPrice, setBookPrice] = useState(0);
  const [physicalPrice, setPhysicalPrice] = useState(0);
  const [bookImage, setBookImage] = useState("");
  // Auth state — checked client-side from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Audio segments state
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressLoadedRef = useRef(false);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Countdown Modal State
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownTimer, setCountdownTimer] = useState(5);
  const [pendingNextChapter, setPendingNextChapter] = useState<Chapter | null>(null);

  // Player controls state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [viewMode, setViewMode] = useState<"player" | "text">("player");
  // Ngôn ngữ người dùng đang chọn để nghe
  const [selectedLanguage, setSelectedLanguage] = useState<string>("vi");

  // Detect login state once on mount
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("user"));
  }, []);

  useEffect(() => {
    if (!bookId || isNaN(bookId)) return;

    // Lấy thông tin sách
    authFetch(`${API_URL}/api/admin/books/${bookId}`)
      .then((res) => {
        if (!res.ok) {
          return authFetch(`${API_URL}/api/books/${bookId}`).then(r => r.json());
        }
        return res.json();
      })
      .then((data) => {
        setBookTitle(data.title);
        // Extract exact AUDIO format price if available, otherwise 0
        setBookPrice(data.audioPrice ?? 0);
        setPhysicalPrice(data.price ?? 0);

        // Fix for "lỗi lấy ảnh sách"
        let cleanUrl = data.imageUrl;
        if (cleanUrl?.startsWith("books/")) {
          cleanUrl = cleanUrl.substring(6);
        }
        if (cleanUrl) {
          setBookImage(`${API_URL}/uploads/books/${cleanUrl}`);
        } else {
          setBookImage("/images/book-default.jpg");
        }
      })
      .catch(console.error);

    // Lấy danh sách chapters của user (có chứa isLocked)
    setChapterError(null);
    progressLoadedRef.current = false;
    getMediaPlayerChapters(bookId)
      .then(async (data) => {
        setChapters(data);
        if (data.length === 0) return;

        // --- Restore progress ---
        let restored = false;

        // 1) Try backend progress (logged-in users, cross-device)
        const isUserLoggedIn = isLoggedIn || (typeof window !== 'undefined' && !!localStorage.getItem("user"));
        if (isUserLoggedIn) {
          try {
            const pRes = await authFetch(`${API_URL}/api/user/books/${bookId}/progress`, {
              headers: { "Content-Type": "application/json" },
              cache: "no-store",
            });
            if (pRes.ok) {
              const p = await pRes.json();
              if (p.chapterId) {
                const ch = data.find((c: Chapter) => c.id === p.chapterId);
                if (ch && !(ch.isLocked || ch.locked)) {
                  setCurrentChapter(ch);
                  setCurrentSegmentIndex(p.segmentIndex || 0);
                  if (p.playbackRate) setPlaybackRate(p.playbackRate);
                  if (p.languageCode) setSelectedLanguage(p.languageCode);
                  // We'll seek to currentTimeSeconds after audio loads
                  (window as any).__pendingSeek = p.currentTimeSeconds || 0;
                  restored = true;
                }
              }
            }
          } catch { /* ignore */ }
        }

        // 2) Fallback: localStorage progress (guests & same-device)
        if (!restored) {
          try {
            const local = localStorage.getItem(`audiobook_progress_${bookId}`);
            if (local) {
              const p = JSON.parse(local);
              if (p.chapterId) {
                const ch = data.find((c: Chapter) => c.id === p.chapterId);
                if (ch && !(ch.isLocked || ch.locked)) {
                  setCurrentChapter(ch);
                  setCurrentSegmentIndex(p.segmentIndex || 0);
                  if (p.playbackRate) setPlaybackRate(p.playbackRate);
                  if (p.languageCode) setSelectedLanguage(p.languageCode);
                  (window as any).__pendingSeek = p.currentTimeSeconds || 0;
                  restored = true;
                }
              }
            }
          } catch { /* ignore */ }
        }

        // 3) Default: Chapter 1
        if (!restored) {
          setCurrentChapter(data[0]);
        }
        progressLoadedRef.current = true;
      })
      .catch((err: Error) => {
        console.error("[AudiobookPlayer] Lỗi tải chương:", err.message);
        setChapterError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    // Handle payment redirect
    if (searchParams.get("payment") === "success") {
      alert("Thanh toán sách nói thành công! Toàn bộ chương đã được mở khóa.");
      router.replace(`/user/books/${bookId}/audiobook`); // Clean up URL
    } else if (searchParams.get("payment") === "failure" || searchParams.get("payment") === "cancelled") {
      alert("Thanh toán sách nói không thành công hoặc đã bị hủy.");
      router.replace(`/user/books/${bookId}/audiobook`); // Clean up URL
    }
  }, [bookId, searchParams, router]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = volume;
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name !== 'AbortError') {
              console.error("Audio play error:", err);
              setIsPlaying(false);
            }
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentSegmentIndex, currentChapter, isPlaying, playbackRate, volume]);

  // === SAVE PROGRESS (every 10s + on beforeunload) ===
  const saveProgressNow = useCallback(() => {
    if (!currentChapter || !progressLoadedRef.current) return;
    const progressData = {
      chapterId: currentChapter.id,
      segmentIndex: currentSegmentIndex,
      currentTimeSeconds: audioRef.current?.currentTime || 0,
      playbackRate,
      languageCode: selectedLanguage,
    };

    // Always save to localStorage (works for guests + same-device)
    try {
      localStorage.setItem(`audiobook_progress_${bookId}`, JSON.stringify(progressData));
    } catch { /* quota exceeded — ignore */ }

    // Also save to backend if logged in (cross-device)
    const isUserLoggedIn = isLoggedIn || (typeof window !== 'undefined' && !!localStorage.getItem("user"));
    if (isUserLoggedIn) {
      authFetch(`${API_URL}/api/user/books/${bookId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progressData),
        keepalive: true, // ensures the request completes even during page unload
      }).catch(() => { });
    }
  }, [currentChapter, currentSegmentIndex, playbackRate, bookId, selectedLanguage, isLoggedIn]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdown && countdownTimer > 0) {
      timer = setTimeout(() => {
        setCountdownTimer((prev) => prev - 1);
      }, 1000);
    } else if (showCountdown && countdownTimer <= 0) {
      setShowCountdown(false);
      if (pendingNextChapter) {
        handleChapterClick(pendingNextChapter);
      }
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdownTimer, pendingNextChapter]);

  useEffect(() => {
    // Auto-save every 10 seconds while playing
    if (isPlaying) {
      saveIntervalRef.current = setInterval(saveProgressNow, 10000);
    }
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [isPlaying, saveProgressNow]);
  // lưu tiến trình khi người dùng đóng tab, tắt màn hình, hoặc chuyển ứng dụng (đặc biệt cho iOS/Mobile)
  useEffect(() => {
    const onUnloadOrHide = () => saveProgressNow();

    // Desktop: beforeunload
    window.addEventListener("beforeunload", onUnloadOrHide);
    // Mobile Safari / iOS: pagehide là chuẩn thay cho beforeunload
    window.addEventListener("pagehide", onUnloadOrHide);

    // Khi tắt màn hình hoặc chuyển app (background)
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveProgressNow();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", onUnloadOrHide);
      window.removeEventListener("pagehide", onUnloadOrHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [saveProgressNow]);
  // khai báo thông tin hiển thị như bản tên sách , tên tác giả và ảnh bìa sách
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentChapter) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentChapter.title || `Chương ${currentChapter.number}`,
      artist: bookTitle || "Libris Audiobook",
      album: bookTitle,
      artwork: bookImage ? [
        { src: bookImage, sizes: "512x512", type: "image/jpeg" },
      ] : [],
    });
    // xử lý khi người dùng bấm play trên lock screen
    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });
    // xử lý khi người dùng bấm pause trên lock screen
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      playPreviousChapter();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      playNextChapter();
    });
  }, [currentChapter, bookTitle, bookImage]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // Update media session position state
      if ('mediaSession' in navigator && audioRef.current.duration) {
        navigator.mediaSession.setPositionState({
          duration: audioRef.current.duration,
          playbackRate: audioRef.current.playbackRate,
          position: audioRef.current.currentTime,
        });
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleCanPlay = () => {
    if (audioRef.current) {
      const pendingSeek = (window as any).__pendingSeek;
      // Không check `pendingSeek < duration` vì iOS thỉnh thoảng báo duration = Infinity lúc mới load
      if (pendingSeek && pendingSeek > 0) {
        audioRef.current.currentTime = pendingSeek;
        setCurrentTime(pendingSeek);
        (window as any).__pendingSeek = 0;
      }
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, clickX / width));
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    let nextRate = 1;
    if (playbackRate === 1) nextRate = 1.25;
    else if (playbackRate === 1.25) nextRate = 1.5;
    else if (playbackRate === 1.5) nextRate = 2;
    else nextRate = 1;

    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const skipTime = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + amount));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChapterClick = (chapter: Chapter) => {
    const isLocked = chapter.isLocked || chapter.locked;
    if (isLocked) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setShowModal(true);
    } else {
      saveProgressNow(); // Save current position before switching
      setCurrentChapter(chapter);
      setCurrentSegmentIndex(0);
      (window as any).__pendingSeek = 0; // Reset pending seek for new chapter
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    if (!currentChapter) return;
    // Dùng số đoạn đã lọc theo ngôn ngữ (computed bên dưới)
    // Vì handleAudioEnded được gọi từ JSX sau khi activeSegments tính xong,
    // chúng ta tính lại inline để tránh stale closure.
    const langSegments = (currentChapter.audioSegments || [])
      .filter(s => s.audioUrl && s.audioUrl !== "null" && s.audioUrl !== "undefined")
      .filter(s => ((s as any).languageCode || "vi") === selectedLanguage)
      .sort((a, b) => ((a as any).sequenceOrder ?? 0) - ((b as any).sequenceOrder ?? 0));

    if (langSegments.length > 0 && currentSegmentIndex < langSegments.length - 1) {
      setCurrentSegmentIndex((prev) => prev + 1);
    } else {
      // Tự động nhảy sang chương tiếp theo
      playNextChapter(true);
    }
  };

  const playNextChapter = (auto: boolean = false) => {
    if (!currentChapter) return;
    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex !== -1 && currentIndex + 1 < chapters.length) {
      const nextChapter = chapters[currentIndex + 1];
      if (auto) {
        setPendingNextChapter(nextChapter);
        setCountdownTimer(5);
        setShowCountdown(true);
      } else {
        handleChapterClick(nextChapter);
      }
    }
  };

  const playPreviousChapter = () => {
    if (!currentChapter) return;
    const currentIndex = chapters.findIndex((c) => c.id === currentChapter.id);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      handleChapterClick(prevChapter);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  // Cookie-Only: Không cần getToken() — xác thực qua HTTP-Only cookie

  const buyAudiobookDirectly = async () => {
    setProcessingPayment(true);
    // Cookie tự động gửi kèm request qua authFetch
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để tiếp tục.");
      router.push("/auth/login");
      return;
    }

    try {
      // 1. Fetch user info to create a fake order profile
      const meRes = await authFetch(`${API_URL}/api/profile`, {
        headers: {},
      });
      const me = meRes.ok ? await meRes.json() : {};

      const payload = {
        customerName: me.name || "Khách Hàng Sách Nói",
        customerPhone: me.phone || "0999999999",
        customerAddress: me.address || "Digital Delivery, VN",
        paymentMethod: "PAYOS",
        // Now passing formatType so backend links it to Book_Format
        items: [{ bookId, formatType: "AUDIO", quantity: 1, price: bookPrice }],
      };

      // 2. Checkout (Direct, without cart validation)
      const checkoutRes = await authFetch(`${API_URL}/api/checkout/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify(payload),
      });

      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.message || checkoutData.error || "Tạo đơn hàng thất bại");

      // 3. Create PayOS Payment
      const paymentRes = await authFetch(`${API_URL}/api/pay-os/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({
          amount: checkoutData.finalAmount,
          orderId: checkoutData.orderId,
          description: `Thanh toan don ${checkoutData.orderId}`.substring(0, 25),
        }),
      });

      const paymentData = await paymentRes.json();
      if (paymentData.checkoutUrl) {
        window.location.href = paymentData.checkoutUrl;
      } else {
        throw new Error(paymentData.error || "Không tạo được cổng thanh toán PayOS");
      }
    } catch (err: any) {
      alert("Lỗi thanh toán: " + err.message);
      setProcessingPayment(false);
    }
  };

  const buyPhysicalBook = async () => {
    setProcessingPayment(true);
    // Cookie tự động gửi kèm request qua authFetch
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({ bookId, quantity: 1 }),
      });
      if (res.ok) {
        router.push("/user/checkout");
      } else {
        throw new Error("Không thể thêm vào giỏ hàng");
      }
    } catch (err: any) {
      alert(err.message);
      setProcessingPayment(false);
    }
  };

  // Tập hợp tất cả ngôn ngữ có sẵn trong toàn bộ sách
  const availableLanguages = Array.from(
    new Set(
      chapters.flatMap(ch => ch.audioSegments || [])
        .filter(s => s.audioUrl && s.audioUrl !== "null" && s.audioUrl !== "undefined")
        .map(s => (s as any).languageCode || "vi")
    )
  ) as string[];

  useEffect(() => {
    if (availableLanguages.length > 0 && !availableLanguages.includes(selectedLanguage)) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [availableLanguages, selectedLanguage]);

  // Lọc các segment của chapter hiện tại theo ngôn ngữ được chọn
  const activeSegments = (currentChapter?.audioSegments || [])
    .filter(s => s.audioUrl && s.audioUrl !== "null" && s.audioUrl !== "undefined")
    .filter(s => ((s as any).languageCode || "vi") === selectedLanguage)
    .sort((a, b) => ((a as any).sequenceOrder ?? 0) - ((b as any).sequenceOrder ?? 0));

  const currentSegment = activeSegments[currentSegmentIndex] ?? currentChapter?.audioSegments?.[currentSegmentIndex];

  const getChapterDurationForLang = (ch: Chapter, lang: string) => {
    const segs = (ch.audioSegments || []).filter(
      s => s.audioUrl && s.audioUrl !== "null" && s.audioUrl !== "undefined" && ((s as any).languageCode || "vi") === lang
    );
    if (segs.length === 0) return "Chưa có âm thanh";
    const totalSeconds = segs.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    if (totalSeconds === 0 && ch.duration && ch.duration !== "—") return ch.duration;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-panel {
          background: rgba(255, 255, 255, 0.03) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      ` }} />

      <div className="h-screen bg-[#0f0f12] text-gray-200 flex overflow-hidden font-sans relative">

        {/* Immersive Background Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[80px] brightness-[0.3] -z-10 transition-all duration-1000"
          ref={(node) => { if (node) node.style.backgroundImage = `url(${bookImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1074"})`; }}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative min-h-screen">

          {/* Topbar */}
          <header className="h-10 flex items-center justify-between px-8 z-10 flex-shrink-0 pt-2">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="cursor-pointer hover:text-white transition-colors" onClick={() => router.push(`/user/books/${bookId}`)}>Sách nói</span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="text-white font-medium truncate max-w-[200px] md:max-w-xs">{bookTitle}</span>
            </div>

            <div className="flex items-center gap-6">
              {/* Language Selector */}
              {availableLanguages.length > 0 && (
                <div className="flex items-center gap-2 bg-[#1c1c1e] rounded-full px-3 h-[32px] border border-white/10">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">translate</span>
                  <select
                    id="language-selector"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      setCurrentSegmentIndex(0); // Reset về segment đầu khi đổi ngôn ngữ
                    }}
                    className="!bg-transparent text-xs font-semibold !text-white cursor-pointer !border-none !ring-0 !outline-none focus:ring-0 focus:border-transparent focus:outline-none pr-2"
                    aria-label="Chọn ngôn ngữ phát"
                  >
                    {availableLanguages.map(lang => (
                      <option key={lang} value={lang} className="bg-[#1c1c1e] text-white">
                        {lang === "vi" ? "Tiếng Việt" : lang === "en" ? "English" : lang === "ja" ? "日本語" : lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5">
                <button
                  onClick={() => setViewMode("player")}
                  className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${viewMode === "player" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"}`}
                >
                  Trình phát
                </button>
                <button
                  onClick={() => setViewMode("text")}
                  className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${viewMode === "text" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"}`}
                >
                  Đọc văn bản
                </button>
              </div>

              <div className="relative hidden md:block">
                <input
                  className="!bg-[#1c1c1e] border border-white/10 rounded-full px-4 h-[32px] text-xs w-64 focus:ring-red-600 focus:border-red-600 transition-all placeholder-gray-500 !text-white outline-none"
                  placeholder="Tìm kiếm hệ thống..."
                  type="text"
                />
              </div>
            </div>
          </header>

          {/* Immersive Player Body */}
          <div className="flex-1 flex px-12 py-6 overflow-hidden z-10 max-w-7xl mx-auto w-full">

            {/* LEFT: Hero Content & Main Controls / Text Content */}
            <div className="flex-[3] flex flex-col items-center justify-start py-8 pr-8 h-full overflow-y-auto custom-scrollbar" data-purpose="audio-main-stage">
              {viewMode === "player" ? (
                // Cover Art Mode
                <div className="relative group my-auto flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <img
                      alt={bookTitle}
                      className="w-[280px] md:w-[350px] max-h-[60vh] object-contain rounded-xl shadow-2xl relative transition-transform duration-500 group-hover:scale-105 border border-white/10"
                      src={bookImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1074"}
                    />
                  </div>
                  <div className="text-center w-full max-w-2xl mt-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white leading-snug line-clamp-2">{bookTitle}</h2>
                  </div>
                </div>
              ) : (
                // Scrollable text content Mode
                <div className="w-full max-w-2xl bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl h-full overflow-hidden flex flex-col my-auto">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                    {fixVietnameseText(currentChapter?.title || (currentChapter ? `Chương ${currentChapter.number}` : "Không có nội dung"))}
                  </h2>
                  {currentChapter?.textContent ? (
                    <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed font-sans flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {fixVietnameseText(currentChapter.textContent).split("\n").map((para, i) => (
                        <p key={i} className="mb-4 text-justify text-base md:text-lg">{para}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                      <span className="material-symbols-outlined text-5xl mb-3 opacity-50">auto_stories</span>
                      <p className="text-sm">Không có nội dung văn bản cho chương này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Playlist & Recommendations */}
            <div className="flex-[2] flex flex-col space-y-8 overflow-y-auto custom-scrollbar pr-4 h-full" data-purpose="sidebar-panels">
              {/* Chapter List */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center justify-between text-white">
                  Danh sách chương
                  <span className="text-xs font-normal text-gray-400">({chapters.length} chương)</span>
                </h3>

                {/* Error Banner */}
                {chapterError && (
                  <div className="mb-4 p-4 bg-red-900/40 border border-red-500/50 rounded-2xl text-sm text-red-300 flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-200 mb-1">Không thể tải danh sách chương</p>
                      <p className="text-xs opacity-80">{chapterError}</p>
                      <button
                        onClick={() => { setChapterError(null); getMediaPlayerChapters(bookId).then(setChapters).catch((e: Error) => setChapterError(e.message)); }}
                        className="mt-2 text-xs underline hover:text-white transition-colors"
                      >
                        Thử lại
                      </button>
                    </div>
                  </div>
                )}

                {!chapterError && chapters.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                    <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-sm">Chưa có chương nào</p>
                  </div>
                )}

                {/* Guest mode banner */}
                {!isLoggedIn && !chapterError && chapters.length > 0 && (
                  <div className="mb-4 p-3 bg-green-900/30 border border-green-600/30 rounded-xl flex items-start gap-2.5 text-xs text-green-300">
                    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>
                      <span className="font-semibold text-green-200">Chương 1 miễn phí</span> — Không cần đăng nhập.
                      {" "}Đăng nhập để mua và nghe toàn bộ.
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  {chapters.map((chapter, index) => {
                    const isLocked = chapter.isLocked || chapter.locked;
                    const isActive = currentChapter?.id === chapter.id;

                    if (isActive && !isLocked) {
                      return (
                        <div
                          key={chapter.id}
                          onClick={() => handleChapterClick(chapter)}
                          className="glass-panel p-4 rounded-2xl flex items-center justify-between border-red-500/50 bg-white/10 cursor-pointer"
                        >
                          <div className="flex flex-col min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-bold truncate">{chapter.title || `Chương ${chapter.number}`}</span>
                              {index === 0 && (
                                <span className="shrink-0 text-[9px] font-bold bg-green-600/30 border border-green-500/40 text-green-400 px-1.5 py-0.5 rounded-full">MIỄN PHÍ</span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 mt-1">{getChapterDurationForLang(chapter, selectedLanguage)}</span>
                          </div>
                          <button className="w-10 h-10 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center shrink-0" aria-label={isPlaying ? "Tạm dừng" : "Phát"}>
                            <span className="material-symbols-outlined text-[18px]">
                              {isPlaying ? "pause" : "play_arrow"}
                            </span>
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={chapter.id}
                          onClick={() => handleChapterClick(chapter)}
                          className="p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer border border-transparent"
                        >
                          <div className="flex flex-col min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className={`group-hover:text-white truncate ${isLocked ? "text-gray-500" : "text-gray-300"}`}>
                                {chapter.title || `Chương ${chapter.number}`}
                              </span>
                              {index === 0 && (
                                <span className="shrink-0 text-[9px] font-bold bg-green-600/30 border border-green-500/40 text-green-400 px-1.5 py-0.5 rounded-full">MIỄN PHÍ</span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 mt-1">{getChapterDurationForLang(chapter, selectedLanguage)}</span>
                          </div>
                          <button className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all
                            ${isLocked
                              ? "border-red-500/20 text-red-400/80 bg-red-950/10"
                              : "border-white/20 text-white group-hover:bg-white group-hover:text-black"}`}
                            aria-label={isLocked ? "Đã khóa" : "Phát"}
                          >
                            {isLocked ? (
                              <span className="material-symbols-outlined text-[16px]">lock</span>
                            ) : (
                              <svg className="w-5 h-5 fill-currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    }
                  })}
                </div>
              </section>
            </div>

          </div>

          {/* Floating Bottom Player */}
          <footer className="h-24 bg-black/80 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between z-30 flex-shrink-0">
            {/* Mini Preview */}
            <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
              <img
                alt={bookTitle}
                className="w-12 h-12 rounded shadow-md border border-white/10 aspect-square object-cover"
                src={bookImage || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1074"}
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-[200px]">{bookTitle}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                  {currentChapter ? `${currentChapter.title || `Chương ${currentChapter.number}`}` : "Chưa chọn chương"}
                </p>
              </div>
              <button className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0" aria-label="Đóng">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>

            {/* Playback Control Center */}
            <div className="flex-1 max-w-2xl px-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-6">
                {/* Skip Prev */}
                <button
                  onClick={playPreviousChapter}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Chương trước"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>

                {/* Skip back 10s */}
                <button
                  onClick={() => skipTime(-10)}
                  disabled={!currentSegment}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                  aria-label="Lùi 10 giây"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  disabled={!currentSegment}
                  className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-30"
                  aria-label={isPlaying ? "Tạm dừng" : "Phát"}
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.333-5.89a1.5 1.5 0 000-2.538L6.3 2.841z"></path>
                    </svg>
                  )}
                </button>

                {/* Skip forward 10s */}
                <button
                  onClick={() => skipTime(10)}
                  disabled={!currentSegment}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30"
                  aria-label="Tiến 10 giây"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>

                {/* Skip Next */}
                <button
                  onClick={() => playNextChapter(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Chương tiếp"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M11.933 12.8a1 1 0 000-1.6L6.599 7.2A1 1 0 005 8v8a1 1 0 001.599.8l5.334-4zM19.933 12.8a1 1 0 000-1.6L14.599 7.2A1 1 0 0013 8v8a1 1 0 001.599.8l5.334-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </button>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-4 w-full">
                <span className="text-[10px] text-gray-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
                <div
                  onClick={handleProgressChange}
                  className="flex-1 h-1 bg-white/20 rounded-full relative group cursor-pointer"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-white rounded-full"
                    ref={(node) => { if (node) node.style.width = `${duration > 0 ? (currentTime / duration) * 100 : 0}%`; }}
                  />
                  <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    ref={(node) => { if (node) node.style.left = `${duration > 0 ? (currentTime / duration) * 100 : 0}%`; }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 font-mono w-10">
                  {duration > 0 ? `-${formatTime(duration - currentTime)}` : "00:00"}
                </span>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="flex items-center justify-end gap-6 w-1/4 min-w-[200px] text-gray-400">
              <button
                onClick={toggleSpeed}
                className="text-xs font-bold hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
              >
                {playbackRate}x
              </button>
              <button className="hover:text-white" aria-label="Hẹn giờ">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
              <button className="hover:text-white" aria-label="Mở rộng">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
              <div className="flex items-center gap-2 group max-w-[120px]">
                <span className="material-symbols-outlined text-[18px]">
                  {volume === 0 ? "volume_off" : volume < 0.5 ? "volume_down" : "volume_up"}
                </span>
                <div
                  onClick={handleVolumeChange}
                  className="w-20 h-1 bg-white/20 rounded-full relative cursor-pointer"
                >
                  <div
                    className="absolute top-0 left-0 h-full bg-white rounded-full"
                    ref={(node) => { if (node) node.style.width = `${volume * 100}%`; }}
                  />
                </div>
              </div>
              <button
                onClick={() => router.push(`/user/books/${bookId}`)}
                className="hover:text-white transition-colors"
                aria-label="Quay lại"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Hidden HTML Audio object */}
      {currentSegment && (
        <audio
          ref={audioRef}
          /*đường link trực tiếp dẫn tới Cloudinary*/
          src={currentSegment.audioUrl}
          onEnded={handleAudioEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onPause={() => saveProgressNow()}
          autoPlay={isPlaying}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          className="hidden"
        />
      )}

      {/* Auto-play Next Chapter Countdown Modal */}
      {showCountdown && pendingNextChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-white p-8 text-center">
            <div className="w-20 h-20 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold border border-red-500/30">
              {countdownTimer}
            </div>
            <h3 className="text-xl font-bold mb-2">Đang chuyển sang chương tiếp theo...</h3>
            <p className="text-red-400 font-semibold text-lg mb-8">
              {pendingNextChapter.title || `Chương ${pendingNextChapter.number}`}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCountdown(false);
                  setIsPlaying(false);
                }}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowCountdown(false);
                  handleChapterClick(pendingNextChapter);
                }}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-[0_4px_14px_0_rgba(220,38,38,0.3)] transition cursor-pointer"
              >
                Nghe ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-[#1c1c1e] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative text-white">

            {/* Modal Header */}
            <div className="h-32 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center relative">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <div className="w-16 h-16 bg-[#1c1c1e] border border-white/10 rounded-full flex items-center justify-center shadow-lg absolute -bottom-8 z-10">
                <span className="material-symbols-outlined text-[30px] text-red-500">
                  {isLoggedIn ? "lock" : "person"}
                </span>
              </div>
            </div>

            <div className="p-8 pt-12 text-center">
              {/* ── GUEST: not logged in ── */}
              {!isLoggedIn ? (
                <>
                  <h3 className="text-xl font-bold mb-2">Đăng nhập để tiếp tục</h3>
                  <p className="text-gray-400 text-sm mb-2 leading-relaxed">
                    Bạn đang nghe miễn phí <span className="text-white font-semibold">Chương 1</span>.
                  </p>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Để mở khóa toàn bộ sách nói, vui lòng <span className="text-red-400 font-semibold">đăng nhập</span> và mua sách.
                  </p>

                  {/* Free preview badge */}
                  <div className="mb-6 inline-flex items-center gap-2 bg-green-900/40 border border-green-600/40 text-green-400 text-xs px-4 py-2 rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    Chương 1 miễn phí — không cần tài khoản
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { setShowModal(false); router.push(`/auth/login?redirect=/user/books/${bookId}/audiobook`); }}
                      className="w-full flex items-center justify-center gap-2 px-5 bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition shadow-[0_4px_14px_0_rgba(220,38,38,0.3)] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">login</span>
                      Đăng nhập để mua
                    </button>
                    <button
                      onClick={() => { setShowModal(false); router.push(`/auth/register?redirect=/user/books/${bookId}/audiobook`); }}
                      className="w-full flex items-center justify-center gap-2 px-5 bg-white/5 border border-white/10 text-gray-200 py-3.5 rounded-xl font-bold hover:bg-white/10 transition cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Tạo tài khoản mới
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-xs text-gray-500 hover:text-gray-300 transition mt-1 cursor-pointer"
                    >
                      Tiếp tục nghe Chương 1 miễn phí
                    </button>
                  </div>
                </>
              ) : (
                /* ── LOGGED IN: show purchase options ── */
                <>
                  <h3 className="text-xl font-bold mb-2">Nội dung bị khóa</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Chương này chỉ dành cho độc giả đã sở hữu sách. Mua ngay để mở khóa toàn bộ nội dung âm thanh.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={buyAudiobookDirectly}
                      disabled={processingPayment || bookPrice === 0}
                      className="w-full flex items-center justify-between px-5 bg-red-600 text-white py-3.5 rounded-xl font-bold hover:bg-red-700 transition shadow-[0_4px_14px_0_rgba(220,38,38,0.3)] disabled:opacity-70 group cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">headphones</span>
                        {processingPayment ? "Đang xử lý..." : "Mua Sách Nói (Nghe ngay)"}
                      </span>
                      <span className="bg-white/20 px-2.5 py-0.5 rounded text-xs">
                        {bookPrice > 0 ? new Intl.NumberFormat("vi-VN").format(bookPrice) + " đ" : "Miễn phí"}
                      </span>
                    </button>

                    <button
                      onClick={buyPhysicalBook}
                      disabled={processingPayment || physicalPrice === 0}
                      className="w-full flex items-center justify-between px-5 bg-white/5 text-gray-200 border border-white/10 py-3.5 rounded-xl font-bold hover:bg-white/10 transition group cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-white transition-colors">local_shipping</span>
                        {processingPayment ? "Đang xử lý..." : "Mua Sách Giấy (Tặng Audio)"}
                      </span>
                      <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded text-xs border border-white/5">
                        {physicalPrice > 0 ? new Intl.NumberFormat("vi-VN").format(physicalPrice) + " đ" : "..."}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition cursor-pointer"
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
