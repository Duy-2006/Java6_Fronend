// services/inventoryService.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface BookInventory {
  id: number;
  title: string;
  isbn: string;
  publisher: string;
  price: number;
  quantity: number;
  active: boolean;
  description?: string;
  imageUrl?: string;
  authorId?: number;
  authorName?: string;
  categoryId?: number;
  categoryName?: string;
}

export interface InventoryLog {
  id: number;
  bookId: number;
  bookTitle: string;
  changeAmount: number;
  type: 'IMPORT' | 'EXPORT';
  note: string;
  logDate: string; // ISO date
}

export interface ImportRequest {
  bookId: number;
  quantity: number;
  note?: string;
}

export interface ImportResponse {
  message: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response: Response) {
  const text = await response.text();
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
  }
  if (!response.ok) {
    throw new Error(`Lỗi ${response.status}: ${text || response.statusText}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Dữ liệu từ server không đúng định dạng JSON');
  }
}

// Lấy danh sách sách tồn kho
export async function getAllInventoryBooks(): Promise<BookInventory[]> {
  const res = await fetch(`${BASE_URL}/api/admin/inventory/books`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

// Lấy lịch sử giao dịch kho
export async function getInventoryLogs(): Promise<InventoryLog[]> {
  const res = await fetch(`${BASE_URL}/api/admin/inventory/logs`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

// Lấy sách tồn kho thấp (dưới threshold, mặc định 10)
export async function getLowStockBooks(threshold: number = 10): Promise<BookInventory[]> {
  const res = await fetch(`${BASE_URL}/api/admin/inventory/low-stock`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

// Nhập kho
export async function importStock(request: ImportRequest): Promise<ImportResponse> {
  const res = await fetch(`${BASE_URL}/api/admin/inventory/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse(res);
}