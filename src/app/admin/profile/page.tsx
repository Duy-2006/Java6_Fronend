"use client";

import { authFetch, isLoggedIn } from "@/lib/authFetch";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  Key,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { isBlank, isValidEmail } from "@/services/validation";

interface AdminProfile {
  username: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [profile, setProfile] = useState<AdminProfile>({
    username: "",
    name: "",
    email: "",
    phone: "",
    avatar: ""
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof AdminProfile, string>>>({});
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({});

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL !== undefined ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:8080";

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/");
      return;
    }

    // Load admin profile
    authFetch(`${API_URL}/api/admin/profile`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/");
          return null;
        }
        if (!res.ok) {
          throw new Error("Không thể tải thông tin admin");
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfile({
            username: data.username || "",
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            avatar: data.avatar || ""
          });
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy thông tin admin:", err);
        showToast("Không thể kết nối đến máy chủ", "error");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProfileChange = (field: keyof AdminProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateProfile = () => {
    const errors: Partial<Record<keyof AdminProfile, string>> = {};
    if (isBlank(profile.name)) {
      errors.name = "Họ và tên không được để trống";
    }
    if (isBlank(profile.email)) {
      errors.email = "Email không được để trống";
    } else if (!isValidEmail(profile.email)) {
      errors.email = "Email không hợp lệ";
    }
    if (profile.phone && !/^(0|\+84)[0-9]{8,10}$/.test(profile.phone)) {
      errors.phone = "Số điện thoại không hợp lệ (8-10 số)";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors: Partial<Record<keyof PasswordForm, string>> = {};
    if (isBlank(passwordForm.currentPassword)) {
      errors.currentPassword = "Mật khẩu hiện tại không được để trống";
    }
    if (isBlank(passwordForm.newPassword)) {
      errors.newPassword = "Mật khẩu mới không được để trống";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }
    if (isBlank(passwordForm.confirmPassword)) {
      errors.confirmPassword = "Xác nhận mật khẩu mới không được để trống";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      showToast("Chỉ hỗ trợ file hình ảnh", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Dung lượng ảnh tối đa là 5MB", "error");
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("imageFile", file);

    try {
      const res = await authFetch(`${API_URL}/api/admin/profile/update-avatar`, {
        method: "PUT",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, avatar: data.avatar }));
        showToast("Đã cập nhật ảnh đại diện thành công", "success");
        // Cập nhật lại user metadata trong localStorage để đồng bộ sidebar/topbar
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.avatar = data.avatar;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        // Kích hoạt cập nhật sidebar
        window.dispatchEvent(new Event("storage"));
      } else {
        const errData = await res.json().catch(() => ({ message: "Lỗi tải ảnh" }));
        showToast(errData.message || "Tải ảnh thất bại", "error");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setSavingProfile(true);
    try {
      const res = await authFetch(`${API_URL}/api/admin/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast("Cập nhật thông tin cá nhân thành công", "success");
        setProfile(prev => ({
          ...prev,
          name: data.name,
          email: data.email,
          phone: data.phone
        }));

        // Đồng bộ localStorage
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          userObj.name = data.name;
          userObj.fullName = data.name;
          userObj.email = data.email;
          localStorage.setItem("user", JSON.stringify(userObj));
        }
        
        // Kích hoạt cập nhật sidebar
        window.dispatchEvent(new Event("storage"));
      } else {
        const errData = await res.json().catch(() => ({ message: "Cập nhật thất bại" }));
        showToast(errData.message || "Không thể cập nhật thông tin", "error");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      const res = await authFetch(`${API_URL}/api/admin/profile/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        showToast("Đổi mật khẩu thành công!", "success");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        const errData = await res.json().catch(() => ({ message: "Mật khẩu hiện tại không đúng" }));
        showToast(errData.message || "Đổi mật khẩu thất bại", "error");
      }
    } catch (error) {
      console.error("Change password error:", error);
      showToast("Lỗi kết nối máy chủ", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // Lấy chữ cái đầu tiên cho Avatar placeholder
  const getInitials = (fullName: string) => {
    if (!fullName) return "A";
    const parts = fullName.trim().split(" ");
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-10 h-10 animate-spin text-[#c0392b] mb-3" />
        <p className="text-slate-500 font-medium">Đang tải thông tin cá nhân...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid max-w-4xl mx-auto py-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-250 text-emerald-800" 
            : "bg-rose-50 border-rose-250 text-rose-800"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-6">
        {/* Avatar Upload Container */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 shadow-sm relative bg-slate-100 flex items-center justify-center select-none">
            {profile.avatar ? (
              <img
                src={profile.avatar.startsWith("http") ? profile.avatar : `${API_URL}${profile.avatar}`}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text initials if image fails to load
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-[#c0392b] font-bold text-3xl font-mono">
                {getInitials(profile.name)}
              </span>
            )}

            {/* Spinner when uploading avatar */}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Change Avatar Button Trigger */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 bg-[#c0392b] hover:bg-[#922b21] disabled:bg-slate-400 text-white p-2 rounded-full shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
            title="Đổi ảnh đại diện"
          >
            <Camera className="w-4 h-4" />
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
            title="Chọn ảnh đại diện"
            aria-label="Chọn ảnh đại diện"
          />
        </div>

        {/* User basic info */}
        <div className="text-center md:text-left flex-grow">
          <h1 className="text-xl font-bold text-slate-800 leading-tight mb-1">{profile.name || "Administrator"}</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Tài khoản: {profile.username}</p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fdf2f0] text-[#c0392b]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c0392b]"></span>
            </span>
            <span>Quản trị viên</span>
          </div>
        </div>
      </div>

      {/* Main Form Box with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "info"
                ? "border-[#c0392b] text-[#c0392b] bg-white font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Thông tin tài khoản</span>
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "password"
                ? "border-[#c0392b] text-[#c0392b] bg-white font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* Tab 1 Content: Account Information */}
        {activeTab === "info" && (
          <form onSubmit={handleSaveProfile} className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="admin-name">Họ và tên</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="admin-name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className={`w-full bg-slate-50 border rounded-xl !pl-10 !pr-4 py-2.5 text-sm transition-all focus:bg-white outline-none ${
                      profileErrors.name 
                        ? "border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-slate-200 focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]"
                    }`}
                  />
                </div>
                {profileErrors.name && (
                  <span className="text-[11px] font-semibold text-red-500 mt-0.5">{profileErrors.name}</span>
                )}
              </div>

              {/* Username (Read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400" htmlFor="admin-username">Tên đăng nhập (Không thể đổi)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="admin-username"
                    value={profile.username}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl !pl-10 !pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="admin-email">Địa chỉ email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    id="admin-email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    placeholder="admin@example.com"
                    className={`w-full bg-slate-50 border rounded-xl !pl-10 !pr-4 py-2.5 text-sm transition-all focus:bg-white outline-none ${
                      profileErrors.email 
                        ? "border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-slate-200 focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]"
                    }`}
                  />
                </div>
                {profileErrors.email && (
                  <span className="text-[11px] font-semibold text-red-500 mt-0.5">{profileErrors.email}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="admin-phone">Số điện thoại</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="admin-phone"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    className={`w-full bg-slate-50 border rounded-xl !pl-10 !pr-4 py-2.5 text-sm transition-all focus:bg-white outline-none ${
                      profileErrors.phone 
                        ? "border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-slate-200 focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]"
                    }`}
                  />
                </div>
                {profileErrors.phone && (
                  <span className="text-[11px] font-semibold text-red-500 mt-0.5">{profileErrors.phone}</span>
                )}
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-[#c0392b] hover:bg-[#922b21] disabled:bg-slate-400 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.01] active:scale-95"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2 Content: Change Password */}
        {activeTab === "password" && (
          <form onSubmit={handleSavePassword} className="p-6 md:p-8 space-y-6">
            <div className="max-w-xl space-y-5">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="current-password">Mật khẩu hiện tại</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-slate-50 border rounded-xl !pl-10 !pr-10 py-2.5 text-sm transition-all focus:bg-white outline-none ${
                      passwordErrors.currentPassword 
                        ? "border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-slate-200 focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="text-[11px] font-semibold text-red-500 mt-0.5">{passwordErrors.currentPassword}</span>
                )}
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="new-password">Mật khẩu mới</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className={`w-full bg-slate-50 border rounded-xl !pl-10 !pr-10 py-2.5 text-sm transition-all focus:bg-white outline-none ${
                      passwordErrors.newPassword 
                        ? "border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-slate-200 focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <span className="text-[11px] font-semibold text-red-500 mt-0.5">{passwordErrors.newPassword}</span>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700" htmlFor="confirm-password">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className={`w-full bg-slate-50 border rounded-xl !pl-10 !pr-10 py-2.5 text-sm transition-all focus:bg-white outline-none ${
                      passwordErrors.confirmPassword 
                        ? "border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-slate-200 focus:border-[#c0392b] focus:ring-1 focus:ring-[#c0392b]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="text-[11px] font-semibold text-red-500 mt-0.5">{passwordErrors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Save Password Button */}
            <div className="flex justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 bg-[#c0392b] hover:bg-[#922b21] disabled:bg-slate-400 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.01] active:scale-95"
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
