import { authFetch, isLoggedIn } from "@/lib/authFetch";;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

/** Một đoạn audio (segment) trong một chương — tương ứng với AudioSegmentDTO từ backend */
export interface AudioSegment {
  audioUrl: string;
  sequenceOrder: number;
  durationSeconds: number;
}

/**
 * Một chương sách với quan hệ 1-N tới các đoạn audio.
 * Trường `audioSegments` đã được sort theo `sequenceOrder` ASC bởi backend.
 */
export interface Chapter {
  id: number;
  number: string;
  title: string;
  status: 'completed' | 'processing' | 'pending' | 'failed';
  progress?: number;
  /** Mảng các segments, sắp xếp theo sequenceOrder ASC — dùng cho gapless playback */
  audioSegments: AudioSegment[];
  /** Tổng thời lượng định dạng mm:ss (do backend tính) */
  duration?: string;
  voiceModel?: string;
  speed?: string;
  textContent?: string;
  isLocked?: boolean;
  locked?: boolean;
}



function getAuthHeaders(isMultipart = false): HeadersInit {
  const headers: HeadersInit = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

// Get all chapters for a book from backend with authentication
export async function getChapters(bookId: number): Promise<Chapter[]> {
    if (!isLoggedIn()) {
    throw new Error("401: Người dùng chưa đăng nhập hoặc token đã hết hạn");
  }

  try {
    const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters?t=${Date.now()}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });
    
    if (res.status === 401) {
      throw new Error("401: Phiên làm việc hết hạn");
    }
    
    if (!res.ok) {
      throw new Error(`Lỗi kết nối backend (Status: ${res.status})`);
    }
    
    return await res.json();
  } catch (err: any) {
    // "Failed to fetch" is a network/CORS error, NOT an auth error.
    // Re-throwing it as-is lets the caller decide whether to retry or alert.
    if (err.message && err.message.includes("401")) throw err; // real 401 from server
    if (err.message && err.message.includes("Failed to fetch")) {
      throw new Error("NETWORK_ERROR: Không thể kết nối tới backend. Vui lòng kiểm tra server.");
    }
    throw err;
  }
}

// Upload a new chapter with a text file or manual text content with authentication
export async function createChapter(
  bookId: number,
  number: string,
  title: string,
  textContent: string,
  textFile: File | null
): Promise<Chapter> {
    if (!isLoggedIn()) {
    throw new Error("401: Chưa đăng nhập");
  }

  const formData = new FormData();
  formData.append('number', number);
  formData.append('title', title);
  if (textContent) {
    formData.append('textContent', textContent);
  }
  if (textFile) {
    formData.append('textFile', textFile);
  }

  const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters`, {
    method: 'POST',
    headers: getAuthHeaders(true),
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401) {
    throw new Error("401: Hết hạn phiên làm việc");
  }

  if (!res.ok) {
    throw new Error(`Tạo chương mới thất bại (Status: ${res.status})`);
  }
  return await res.json();
}

// Update an existing chapter with text content, title, and number
export async function updateChapter(
  bookId: number,
  chapterId: number,
  number: string,
  title: string,
  textContent: string
): Promise<Chapter> {
    if (!isLoggedIn()) {
    throw new Error("401: Chưa đăng nhập");
  }

  const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters/${chapterId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ number, title, textContent }),
  });

  if (res.status === 401) {
    throw new Error("401: Hết hạn phiên làm việc");
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Cập nhật chương thất bại (Status: ${res.status})`);
  }
  return await res.json();
}

// Delete a chapter from the backend with authentication
export async function deleteChapter(bookId: number, chapterId: number): Promise<void> {
    if (!isLoggedIn()) {
    throw new Error("401: Chưa đăng nhập");
  }

  const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters/${chapterId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (res.status === 401) {
    throw new Error("401: Hết hạn phiên làm việc");
  }

  if (!res.ok) {
    throw new Error(`Xóa chương thất bại (Status: ${res.status})`);
  }
}

// Trigger TTS conversion on backend with authentication
export async function generateTTS(
  bookId: number,
  chapterId: number,
  voice: string,
  speed: string
): Promise<Chapter> {
    if (!isLoggedIn()) {
    throw new Error("401: Chưa đăng nhập");
  }

  const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters/${chapterId}/tts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ voice, speed })
  });

  if (res.status === 401) {
    throw new Error("401: Hết hạn phiên làm việc");
  }

  if (!res.ok) {
    throw new Error(`Khởi chạy TTS thất bại (Status: ${res.status})`);
  }
  return await res.json();
}

// Trigger TTS conversion on backend for all pending chapters with authentication
export async function generateTTSBulk(
  bookId: number,
  voice: string,
  speed: string
): Promise<Chapter[]> {
    if (!isLoggedIn()) {
    throw new Error("401: Chưa đăng nhập");
  }

  const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters/tts-bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ voice, speed })
  });

  if (res.status === 401) {
    throw new Error("401: Hết hạn phiên làm việc");
  }

  if (!res.ok) {
    throw new Error(`Khởi chạy chuyển đổi hàng loạt thất bại (Status: ${res.status})`);
  }
  return await res.json();
}

// Stop TTS conversion on backend with authentication
export async function stopTTS(
  bookId: number,
  chapterId: number
): Promise<Chapter> {
    if (!isLoggedIn()) {
    throw new Error("401: Chưa đăng nhập");
  }

  const res = await authFetch(`${BASE_URL}/api/admin/books/${bookId}/chapters/${chapterId}/tts/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (res.status === 401) {
    throw new Error("401: Hết hạn phiên làm việc");
  }

  if (!res.ok) {
    throw new Error(`Dừng chuyển đổi thất bại (Status: ${res.status})`);
  }
  return await res.json();
}

// Get chapters for user storefront (includes lock status)
// Guests (no token) are allowed: Chapter 1 is always free, others will be locked
export async function getUserChapters(bookId: number): Promise<Chapter[]> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (isLoggedIn()) {
      }

  try {
    const res = await authFetch(`${BASE_URL}/api/user/books/${bookId}/chapters`, {
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Lỗi tải danh sách chương (Status: ${res.status}): ${text}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch')) {
      throw new Error('NETWORK_ERROR: Không thể kết nối tới backend. Vui lòng kiểm tra server.');
    }
    throw err;
  }
}

// Get audiobooks for user storefront (where audioPrice > 0)
export async function getStorefrontAudiobooks(page = 0, size = 10): Promise<{ content: Chapter[]; totalPages: number }> {
  try {
    const res = await authFetch(`${BASE_URL}/api/books/audiobooks?page=${page}&size=${size}&t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return {
      content: data.content || (Array.isArray(data) ? data : []),
      totalPages: data.totalPages || 1,
    };
  } catch (err) {
    console.error("Fetch storefront audiobooks error:", err);
    return { content: [], totalPages: 1 };
  }
}

