"use client";

import { useState, useEffect } from "react";

interface Banner {
  id?: number;
  image_url: string; // Khớp chuẩn với biến phía Java Backend
  link: string;
  position: number;
  active: boolean;
}

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [formData, setFormData] = useState<Banner>({ image_url: "", link: "", position: 0, active: true });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  
  // Trạng thái cấu hình phương thức nhập ảnh (Mặc định chọn 'link')
  const [uploadMode, setUploadMode] = useState<"link" | "file">("link");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // 1. Tải danh sách banner từ API Backend
  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (error) {
      console.error("Lỗi kết nối API lấy danh sách banner:", error);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // 1.5. Xử lý tải tập tin ảnh trực tiếp lên Backend
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Đóng gói file vào đối tượng FormData để gửi qua Request HTTP Multipart
    const uploadData = new FormData();
    uploadData.append("file", file);

    setIsUploading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/banners/upload`, {
        method: "POST",
        body: uploadData, // Trình duyệt sẽ tự động thiết lập Header Content-Type phù hợp kèm boundary
      });

      if (res.ok) {
        const data = await res.json();
        // Nhận đường dẫn file ngắn do Backend trả về (Ví dụ: /uploads/banners/xyz.png)
        const fileUrl = data.fileUrl || data.url || data.image_url;
        
        if (fileUrl) {
          setFormData((prev) => ({ ...prev, image_url: fileUrl }));
          setMessage("Tải ảnh lên máy chủ thành công!");
        } else {
          setMessage("Lỗi: Không lấy được đường dẫn file trả về từ máy chủ.");
        }
      } else {
        setMessage("Lỗi: Máy chủ từ chối file hoặc sai định dạng.");
      }
    } catch (error) {
      console.error("Lỗi kết nối API upload file:", error);
      setMessage("Không thể kết nối với máy chủ để tải tệp tin.");
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Thêm hoặc Sửa banner
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      setMessage("Vui lòng nhập đường dẫn hình ảnh hoặc tải file ảnh lên trước!");
      return;
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_URL}/api/banners/${formData.id}` : `${API_URL}/api/banners`;

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage(isEditing ? "Cập nhật banner thành công!" : "Thêm mới banner thành công!");
        setFormData({ image_url: "", link: "", position: 0, active: true });
        setIsEditing(false);
        fetchBanners();
      } else {
        setMessage("Có lỗi xảy ra khi lưu thông tin.");
      }
    } catch (error) {
      console.error("Lỗi dữ liệu xử lý Form:", error);
    }
  };

  // 3. Đưa dữ liệu banner vào ô nhập để Sửa
  const handleEdit = (banner: Banner) => {
    setFormData(banner);
    setIsEditing(true);
    // Tự động nhận diện và chuyển đổi tab hiển thị phù hợp cho Admin
    setUploadMode(banner.image_url.startsWith("http") ? "link" : "file");
  };

  // 4. Xóa banner
  const handleDelete = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa banner này?")) {
      try {
        const res = await fetch(`${API_URL}/api/banners/${id}`, { method: "DELETE" });
        if (res.ok) {
          setMessage("Xóa banner thành công!");
          fetchBanners();
        }
      } catch (error) {
        console.error("Lỗi xóa banner:", error);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-6">
        Quản Lý Banner Hệ Thống
      </h2>

      {message && (
        <div className={`mb-4 p-3 border rounded font-medium ${message.includes("Lỗi") ? "bg-red-100 border-red-400 text-red-700" : "bg-green-100 border-green-400 text-green-700"}`}>
          {message}
        </div>
      )}

      {/* FORM THÊM / SỬA BANNER */}
      <form onSubmit={handleSubmit} className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {isEditing ? "🔄 Cập Nhật Banner" : "➕ Thêm Banner Mới"}
        </h3>

        {/* CHUYỂN ĐỔI PHƯƠNG THỨC NẠP ẢNH */}
        <div className="flex gap-4 mb-4 border-b pb-2">
          <button
            type="button"
            className={`pb-2 px-2 font-medium text-sm transition-all ${uploadMode === "link" ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-gray-400 hover:text-gray-600"}`}
            onClick={() => setUploadMode("link")}
          >
            🔗 Sử dụng Link ảnh công khai
          </button>
          <button
            type="button"
            className={`pb-2 px-2 font-medium text-sm transition-all ${uploadMode === "file" ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-gray-400 hover:text-gray-600"}`}
            onClick={() => setUploadMode("file")}
          >
            📁 Tải ảnh lên từ máy tính
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Ô NHẬP ẢNH ĐỘNG DỰA TRÊN TAB ĐANG CHỌN */}
          {uploadMode === "link" ? (
            <div>
              <label className="block text-sm font-medium text-gray-600">Đường dẫn hình ảnh (URL):</label>
              <input 
                type="text" 
                placeholder="Ví dụ: https://images.unsplash.com/photo-abc..."
                value={formData.image_url} 
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                required={uploadMode === "link"} 
                className="mt-1 block w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-600">Chọn file ảnh từ thiết bị:</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full p-1.5 border border-gray-300 rounded bg-white text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {isUploading && (
                <p className="text-xs text-amber-600 mt-1 animate-pulse">⏳ Đang tải tệp lên máy chủ, vui lòng đợi...</p>
              )}
              {formData.image_url && !isUploading && (
                <p className="text-xs text-green-600 mt-1 truncate">🎯 Đường dẫn hiện tại: <strong>{formData.image_url}</strong></p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600">Link liên kết điều hướng (Optional):</label>
            <input 
              type="text" 
              placeholder="Ví dụ: /books/1"
              value={formData.link} 
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Vị trí sắp xếp (Số thứ tự):</label>
            <input 
              type="number" 
              value={formData.position} 
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center pt-6">
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.active} 
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-600">Kích hoạt hiển thị công khai</span>
            </label>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            type="submit" 
            disabled={isUploading}
            className={`px-4 py-2 rounded text-white font-medium ${isUploading ? "bg-gray-400 cursor-not-allowed" : isEditing ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"}`}
          >
            {isEditing ? "Cập Nhật" : "Thêm Mới"}
          </button>
          {isEditing && (
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setFormData({ image_url: "", link: "", position: 0, active: true }); }} 
              className="px-4 py-2 bg-gray-400 text-white rounded font-medium hover:bg-gray-500"
            >
              Hủy Bỏ
            </button>
          )}
        </div>
      </form>

      {/* DANH SÁCH BANNER */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-gray-200">
          <thead>
            <tr className="bg-sky-600 text-white">
              <th className="p-3 border border-gray-200">ID</th>
              <th className="p-3 border border-gray-200">Hình Ảnh xem trước</th>
              <th className="p-3 border border-gray-200">Đường dẫn Link</th>
              <th className="p-3 border border-gray-200 text-center">Thứ tự</th>
              <th className="p-3 border border-gray-200 text-center">Trạng Thái</th>
              <th className="p-3 border border-gray-200 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 border border-gray-200 font-semibold">{b.id}</td>
                <td className="p-3 border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={b.image_url.startsWith("http") ? b.image_url : `${API_URL}${b.image_url}`} 
                    alt="Banner Preview" 
                    className="w-32 h-14 object-cover rounded border"
                  />
                </td>
                <td className="p-3 border border-gray-200 text-gray-600">{b.link || "Trống"}</td>
                <td className="p-3 border border-gray-200 text-center font-medium">{b.position}</td>
                <td className="p-3 border border-gray-200 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${b.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {b.active ? "Đang hiện" : "Đang ẩn"}
                  </span>
                </td>
                <td className="p-3 border border-gray-200 text-center">
                  <button onClick={() => handleEdit(b)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium mr-2 hover:bg-blue-600">
                    Sửa
                  </button>
                  <button onClick={() => b.id && handleDelete(b.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 italic">Hiện tại chưa có dữ liệu banner nào trong hệ thống.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}