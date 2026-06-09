"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { isBlank } from "@/services/validation";

interface Province {
  code: number;
  name: string;
  districts: District[];
}

interface District {
  code: number;
  name: string;
  wards: Ward[];
}

interface Ward {
  code: number;
  name: string;
}

interface AddressForm {
  receiverName: string;
  receiverPhone: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  wardCode: string;
  wardName: string;
  street: string;
  isDefault: boolean;
}

export default function NewAddressPage() {
  const router = useRouter();
  const [form, setForm] = useState<AddressForm>({
    receiverName: "",
    receiverPhone: "",
    provinceId: 0,
    provinceName: "",
    districtId: 0,
    wardCode: "",
    wardName: "",
    street: "",
    isDefault: false,
  });
  
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/auth/login");
      return;
    }
    
    // Fetch provinces with depth=3 to get provinces > districts > wards
    fetch("https://provinces.open-api.vn/api/?depth=3")
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => {
        console.error("Lỗi lấy danh sách Tỉnh/Thành:", err);
        showToast("Lỗi lấy danh sách Tỉnh/Thành phố", "error");
      });
  }, [router]);
  
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const prov = provinces.find(p => p.code === code);
    setForm(f => ({
      ...f,
      provinceId: code,
      provinceName: prov?.name || "",
      districtId: 0,
      wardCode: "",
      wardName: ""
    }));
    setDistricts(prov?.districts || []);
    setWards([]);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = parseInt(e.target.value);
    const dist = districts.find(d => d.code === code);
    setForm(f => ({
      ...f,
      districtId: code,
      wardCode: "",
      wardName: ""
    }));
    setWards(dist?.wards || []);
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const ward = wards.find(w => w.code.toString() === code);
    setForm(f => ({
      ...f,
      wardCode: code,
      wardName: ward?.name || ""
    }));
  };

  const setField = (field: keyof AddressForm, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validate = (): Partial<Record<keyof AddressForm, string>> => {
    const e: Partial<Record<keyof AddressForm, string>> = {};
    if (isBlank(form.receiverName)) e.receiverName = "Họ tên người nhận không được để trống";
    if (isBlank(form.receiverPhone)) e.receiverPhone = "Số điện thoại không được để trống";
    else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.receiverPhone.trim())) e.receiverPhone = "Số điện thoại không hợp lệ";
    if (!form.provinceId) e.provinceId = "Vui lòng chọn Tỉnh/Thành phố";
    if (!form.districtId) e.districtId = "Vui lòng chọn Quận/Huyện";
    if (!form.wardCode) e.wardCode = "Vui lòng chọn Phường/Xã";
    if (isBlank(form.street)) e.street = "Địa chỉ chi tiết không được để trống";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    try {
      const payload = {
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        provinceId: form.provinceId,
        provinceName: form.provinceName,
        districtId: form.districtId,
        wardCode: form.wardCode,
        wardName: form.wardName,
        street: form.street.trim(),
        isDefault: form.isDefault
      };
      
      const res = await authFetch(`${apiUrl}/api/profile/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast("Thêm địa chỉ mới thành công!");
        setTimeout(() => {
          router.push("/user/profile"); // Quay lại trang profile sau khi tạo thành công
        }, 1500);
      } else {
        const text = await res.text();
        showToast(text || "Lỗi khi lưu địa chỉ.", "error");
      }
    } catch (err) {
      showToast("Lỗi kết nối đến server.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen text-[#191c1e] flex flex-col font-sans">
      <Navbar />
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 text-white px-6 py-3.5 rounded-full shadow-xl font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-[#191c1e] border border-white/10' : 'bg-[#b70011]'}`}>
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="tracking-tight">{toast.message}</span>
        </div>
      )}

      <div className="flex-1 max-w-[800px] w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/user/profile" className="text-gray-500 hover:text-[#b70011] text-sm font-semibold transition-colors flex items-center gap-1 w-fit">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl font-bold mt-4 text-[#191c1e]">Thêm địa chỉ mới</h1>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#e0e3e5] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Tên người nhận</label>
                <input 
                  className={`w-full bg-[#f2f4f6] border ${errors.receiverName ? 'border-[#ba1a1a] bg-[#ba1a1a]/5' : 'border-transparent'} rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all outline-none h-[46px]`}
                  value={form.receiverName} 
                  onChange={e => setField("receiverName", e.target.value)}
                  placeholder="Nhập họ và tên" 
                />
                {errors.receiverName && <p className="text-[#ba1a1a] text-[11px] font-mono mt-1.5">* {errors.receiverName}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Số điện thoại</label>
                <input 
                  className={`w-full bg-[#f2f4f6] border ${errors.receiverPhone ? 'border-[#ba1a1a] bg-[#ba1a1a]/5' : 'border-transparent'} rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all outline-none h-[46px]`}
                  value={form.receiverPhone} 
                  onChange={e => setField("receiverPhone", e.target.value)}
                  placeholder="Ví dụ: 0901234567" 
                />
                {errors.receiverPhone && <p className="text-[#ba1a1a] text-[11px] font-mono mt-1.5">* {errors.receiverPhone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Tỉnh/Thành phố</label>
                <select 
                  aria-label="Tỉnh/Thành phố"
                  title="Tỉnh/Thành phố"
                  className={`w-full bg-[#f2f4f6] border ${errors.provinceId ? 'border-[#ba1a1a] bg-[#ba1a1a]/5' : 'border-transparent'} rounded-xl px-4 py-3 text-sm outline-none h-[46px] focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all cursor-pointer`}
                  value={form.provinceId}
                  onChange={handleProvinceChange}
                >
                  <option value={0}>Chọn Tỉnh/Thành</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
                {errors.provinceId && <p className="text-[#ba1a1a] text-[11px] font-mono mt-1.5">* {errors.provinceId}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Quận/Huyện</label>
                <select 
                  aria-label="Quận/Huyện"
                  title="Quận/Huyện"
                  className={`w-full bg-[#f2f4f6] border ${errors.districtId ? 'border-[#ba1a1a] bg-[#ba1a1a]/5' : 'border-transparent'} rounded-xl px-4 py-3 text-sm outline-none h-[46px] focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all ${!form.provinceId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  value={form.districtId}
                  onChange={handleDistrictChange}
                  disabled={!form.provinceId}
                >
                  <option value={0}>Chọn Quận/Huyện</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
                {errors.districtId && <p className="text-[#ba1a1a] text-[11px] font-mono mt-1.5">* {errors.districtId}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Phường/Xã</label>
                <select 
                  aria-label="Phường/Xã"
                  title="Phường/Xã"
                  className={`w-full bg-[#f2f4f6] border ${errors.wardCode ? 'border-[#ba1a1a] bg-[#ba1a1a]/5' : 'border-transparent'} rounded-xl px-4 py-3 text-sm outline-none h-[46px] focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all ${!form.districtId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  value={form.wardCode}
                  onChange={handleWardChange}
                  disabled={!form.districtId}
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
                {errors.wardCode && <p className="text-[#ba1a1a] text-[11px] font-mono mt-1.5">* {errors.wardCode}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#b70011] uppercase tracking-widest mb-1.5">Địa chỉ cụ thể (Số nhà, đường...)</label>
              <input 
                className={`w-full bg-[#f2f4f6] border ${errors.street ? 'border-[#ba1a1a] bg-[#ba1a1a]/5' : 'border-transparent'} rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#b70011] focus:bg-white transition-all outline-none h-[46px]`}
                value={form.street} 
                onChange={e => setField("street", e.target.value)}
                placeholder="Ví dụ: 123 Đường 3/2" 
              />
              {errors.street && <p className="text-[#ba1a1a] text-[11px] font-mono mt-1.5">* {errors.street}</p>}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isDefault" 
                className="w-4 h-4 rounded text-[#b70011] focus:ring-[#b70011] cursor-pointer" 
                checked={form.isDefault}
                onChange={e => setField("isDefault", e.target.checked)}
              />
              <label htmlFor="isDefault" className="text-sm font-semibold text-gray-700 select-none cursor-pointer">
                Đặt làm địa chỉ nhận hàng mặc định
              </label>
            </div>

            <div className="pt-6 border-t border-[#e0e3e5] flex flex-col sm:flex-row gap-3">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#b70011] text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-[#93000b] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 flex-1 sm:flex-none cursor-pointer shadow-md shadow-[#b70011]/20"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">save</span>
                )}
                <span>{saving ? 'Đang lưu...' : 'Lưu địa chỉ mới'}</span>
              </button>
              
              <Link 
                href="/user/profile"
                className="bg-transparent border border-gray-300 text-gray-600 hover:text-black hover:bg-gray-50 px-8 py-3.5 rounded-full font-bold text-sm transition-all flex items-center justify-center flex-1 sm:flex-none cursor-pointer"
              >
                Hủy bỏ
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
