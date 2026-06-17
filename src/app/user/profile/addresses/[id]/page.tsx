"use client";
import { authFetch, isLoggedIn } from "@/lib/authFetch";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const addressId = params.id;
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
      .then(data => {
        setProvinces(data);
        // After fetching provinces, if we have an addressId, fetch the address!
        if (addressId && addressId !== 'new') {
          fetchAddress(data);
        }
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách Tỉnh/Thành:", err);
        showToast("Lỗi lấy danh sách Tỉnh/Thành phố", "error");
      });
  }, [router, addressId]);

  const fetchAddress = async (provs: Province[]) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await authFetch(`${apiUrl}/api/profile/addresses/${addressId}`);
      if (res.ok) {
        const addr = await res.json();
        setForm({
          receiverName: addr.receiverName || "",
          receiverPhone: addr.receiverPhone || "",
          provinceId: addr.provinceId || 0,
          provinceName: addr.provinceName || "",
          districtId: addr.districtId || 0,
          wardCode: addr.wardCode || "",
          wardName: addr.wardName || "",
          street: addr.street || "",
          isDefault: addr.isDefault || false,
        });

        const prov = provs.find((p: any) => p.code === addr.provinceId);
        if (prov) {
          setDistricts(prov.districts || []);
          const dist = prov.districts?.find((d: any) => d.code === addr.districtId);
          if (dist) {
            setWards(dist.wards || []);
          }
        }
      } else {
        showToast("Không thể tải thông tin địa chỉ.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi kết nối tải địa chỉ.", "error");
    }
  };

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

      const res = await authFetch(`${apiUrl}/api/profile/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Cập nhật địa chỉ thành công!");
        setTimeout(() => {
          router.back();
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

  const inputCls = (field: keyof AddressForm) => {
    const hasError = !!errors[field];
    return `w-full bg-[#f8fafc] border ${hasError
        ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-100'
        : 'border-gray-200 hover:border-gray-300 focus:border-[#b70011] focus:ring-red-100/50'
      } rounded-xl px-4.5 py-3.5 text-sm transition-all duration-300 outline-none h-[52px] focus:ring-4 focus:bg-white shadow-sm font-medium text-[#1c1e21]`;
  };

  return (
    <div className="bg-[#f4f6f9] min-h-screen text-[#191c1e] flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Decorative gradient blur background objects */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-red-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-100/30 blur-[100px] pointer-events-none" />

      <Navbar />

      {/* Toast Alert with Modern Floating Animation */}
      {toast && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 text-white px-6 py-4 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-3 animate-bounce duration-500 backdrop-blur-md border border-white/10 ${toast.type === 'success' ? 'bg-[#191c1e]/95' : 'bg-[#b70011]/95'}`}>
          <span className="material-symbols-outlined text-[20px] text-white">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="tracking-wide">{toast.message}</span>
        </div>
      )}

      <div className="flex-1 max-w-[850px] w-full mx-auto px-4 py-10 z-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-[#b70011] text-xs font-bold transition-all duration-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 w-fit"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              QUAY LẠI
            </button>
            <h1 className="text-3xl font-extrabold mt-3 text-[#191c1e] tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#b70011]">home_pin</span>
              Cập nhật địa chỉ nhận hàng
            </h1>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg p-6 md:p-10 rounded-3xl border border-white/40 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1: Thông tin người nhận */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
                <span className="material-symbols-outlined text-gray-400 text-lg">person</span>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Thông tin người nhận</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Họ tên người nhận</label>
                  <div className="relative">
                    <input
                      className={inputCls("receiverName")}
                      value={form.receiverName}
                      onChange={e => setField("receiverName", e.target.value)}
                      placeholder="Nhập đầy đủ họ và tên"
                    />
                  </div>
                  {errors.receiverName && (
                    <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.receiverName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Số điện thoại liên lạc</label>
                  <input
                    className={inputCls("receiverPhone")}
                    value={form.receiverPhone}
                    onChange={e => setField("receiverPhone", e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                  />
                  {errors.receiverPhone && (
                    <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.receiverPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Địa chỉ giao hàng */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
                <span className="material-symbols-outlined text-gray-400 text-lg">map</span>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Địa chỉ giao hàng</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Tỉnh/Thành phố</label>
                  <select
                    aria-label="Tỉnh/Thành phố"
                    title="Tỉnh/Thành phố"
                    className={inputCls("provinceId") + " cursor-pointer pr-10 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat"}
                    value={form.provinceId}
                    onChange={handleProvinceChange}
                  >
                    <option value={0}>Chọn Tỉnh/Thành</option>
                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                  {errors.provinceId && (
                    <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.provinceId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Quận/Huyện</label>
                  <select
                    aria-label="Quận/Huyện"
                    title="Quận/Huyện"
                    className={inputCls("districtId") + ` pr-10 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat ${!form.provinceId ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
                    value={form.districtId}
                    onChange={handleDistrictChange}
                    disabled={!form.provinceId}
                  >
                    <option value={0}>Chọn Quận/Huyện</option>
                    {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                  {errors.districtId && (
                    <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.districtId}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Phường/Xã</label>
                  <select
                    aria-label="Phường/Xã"
                    title="Phường/Xã"
                    className={inputCls("wardCode") + ` pr-10 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat ${!form.districtId ? 'opacity-60 cursor-not-allowed bg-gray-100' : 'cursor-pointer'}`}
                    value={form.wardCode}
                    onChange={handleWardChange}
                    disabled={!form.districtId}
                  >
                    <option value="">Chọn Phường/Xã</option>
                    {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
                  {errors.wardCode && (
                    <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-xs">error</span>
                      {errors.wardCode}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Địa chỉ cụ thể (Số nhà, ngõ, đường...)</label>
                <input
                  className={inputCls("street")}
                  value={form.street}
                  onChange={e => setField("street", e.target.value)}
                  placeholder="Ví dụ: 123 Đường 3/2"
                />
                {errors.street && (
                  <p className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-xs">error</span>
                    {errors.street}
                  </p>
                )}
              </div>
            </div>

            {/* Set Default Address */}
            <div className="flex items-center gap-3 pt-4 pb-2">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="isDefault"
                  className="sr-only peer"
                  checked={form.isDefault}
                  onChange={e => setField("isDefault", e.target.checked)}
                />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-red-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#b70011]" />
                <span className="ml-3 text-sm font-bold text-gray-700">
                  Đặt làm địa chỉ nhận hàng mặc định
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-[0.98]"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={saving}
                className="bg-[#b70011] hover:bg-[#93000b] text-white px-10 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-75 cursor-pointer shadow-lg shadow-red-900/10 hover:shadow-red-950/20 active:scale-[0.98]"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                )}
                <span>{saving ? 'Đang lưu...' : 'Lưu cập nhật'}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
