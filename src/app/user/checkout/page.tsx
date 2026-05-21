"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isBlank, isValidEmail } from "@/services/validation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface CartDetail {
  bookId: number;
  title: string;
  imageUrl: string;
  quantity: number;
  price: number;
}
interface FormState {
  customerName: string;
  customerPhone: string;
  email: string;
  customerAddress: string;
  paymentMethod: string;
}
type FormErrors = Partial<Record<keyof FormState, string>>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

const getToken = () => {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (isBlank(f.customerName)) e.customerName = "Họ và tên không được để trống.";
  if (isBlank(f.customerPhone)) e.customerPhone = "Số điện thoại không được để trống.";
  else if (!/^(0|\+84)[0-9]{8,10}$/.test(f.customerPhone.trim())) e.customerPhone = "Số điện thoại không hợp lệ.";
  if (f.email.trim() && !isValidEmail(f.email)) e.email = "Email không đúng định dạng.";
  if (isBlank(f.customerAddress)) e.customerAddress = "Địa chỉ không được để trống.";
  return e;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [rawCartDetails, setRawCartDetails] = useState<CartDetail[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flashSaleMap, setFlashSaleMap] = useState<Map<number, { price: number, limit: number | null }>>(new Map());

  const [form, setForm] = useState<FormState>({
    customerName: "", customerPhone: "", email: "",
    customerAddress: "", paymentMethod: "COD",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // GHTK and Provinces Integration States
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districts, setDistricts] = useState<any[]>([]);
  const [detailAddress, setDetailAddress] = useState("");
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [savedUser, setSavedUser] = useState<any>(null);

  // Voucher States
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);

  // 1. Lấy flash sale map
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await fetch(`${API_URL}/api/books/flash-sale`);
        if (!res.ok) return;
        const data: any[] = await res.json();
        console.log("🔍 [DEBUG] Flash sale data from API:", data);
        const map = new Map<number, number>();
        data.forEach(book => {
          let finalPrice: number | null = null;
          if (book.discountPrice != null) finalPrice = Number(book.discountPrice);
          else if (book.discountValue != null && book.price != null) {
            const discount = Number(book.discountValue);
            const original = Number(book.price);
            if (discount > 0 && discount <= 100) finalPrice = original * (100 - discount) / 100;
          }
          if (finalPrice && finalPrice > 0) {
            map.set(book.id, { price: finalPrice, limit: book.usageLimit ?? null });
            console.log(`  - Mapped bookId ${book.id} -> discountPrice ${finalPrice}`);
          }
        });
        setFlashSaleMap(map);
      } catch (err) { console.error("Flash sale fetch error:", err); }
    };
    fetchFlashSale();
  }, []);

  // 1.5 Lấy danh sách Tỉnh/Thành phố từ Open API
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/?depth=2");
        if (res.ok) {
          const data = await res.json();
          setProvinces(data);
        }
      } catch (e) {
        console.error("Error fetching provinces:", e);
      }
    };
    fetchProvinces();
  }, []);

  // 2. Lấy preview từ backend
  useEffect(() => {
    const fetchPreview = async () => {
      const token = getToken();
      if (!token) { router.push("/login"); return; }
      try {
        const res = await fetch(`${API_URL}/api/checkout/preview`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error((await res.json()).error || "Preview failed");
        const data = await res.json();
        console.log("🔍 [DEBUG] Preview data from backend:", data);
        setRawCartDetails(data.cartDetails || []);
        // ban đầu set discount, phí vận chuyển sẽ do GHTK tính toán dựa trên địa chỉ
        setDiscount(data.discount || 0);

        // Fetch User Info to autofill
        const meRes = await fetch(`${API_URL}/api/auth/me`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.ok) {
           const me = await meRes.json();
           setForm(f => ({
             ...f, 
             customerName: me.name || f.customerName,
             customerPhone: me.phone || f.customerPhone,
             email: me.email || f.email
           }));
           setSavedUser(me);
        }
      } catch (error: any) {
        alert(error.message);
        router.push("/user/cart");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [router]);

  // Autofill address when provinces are loaded
  useEffect(() => {
    if (provinces.length > 0 && savedUser?.address) {
       const parts = savedUser.address.split(", ").reverse();
       if (parts.length >= 2) {
          const pName = parts[0];
          const dName = parts[1];
          const detail = parts.slice(2).reverse().join(", ");

          const prov = provinces.find(p => p.name === pName);
          if (prov) {
             setSelectedProvince(prov.code.toString());
             setDistricts(prov.districts || []);
             const dist = prov.districts?.find((d: any) => d.name === dName);
             if (dist) {
                setSelectedDistrict(dist.code.toString());
             }
             setDetailAddress(detail);
             setForm(f => ({ ...f, customerAddress: savedUser.address }));
          }
       }
       setSavedUser((curr: any) => ({ ...curr, address: null }));
    }
  }, [provinces, savedUser]);

  // Fetch Available Vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const token = getToken();
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        
        const res = await fetch(`${API_URL}/api/vouchers/active`, { headers });
        if (res.ok) {
          const data = await res.json();
          setAvailableVouchers(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch vouchers:", err);
      }
    };
    fetchVouchers();
  }, []);

  // 3. Tính toán giá khuyến mãi và tổng tiền (dùng useMemo)
  const { displayItems, totalAmount, finalAmount } = useMemo(() => {
    if (rawCartDetails.length === 0) return { displayItems: [], totalAmount: 0, finalAmount: 0 };
    console.log("🔍 [DEBUG] rawCartDetails:", rawCartDetails);
    console.log("🔍 [DEBUG] flashSaleMap (size):", flashSaleMap.size);
    let total = 0;
    const items: any[] = [];
    rawCartDetails.forEach(item => {
      const promoInfo = flashSaleMap.get(item.bookId);
      if (promoInfo && promoInfo.price < item.price) {
        const promoQty = promoInfo.limit !== null ? Math.min(item.quantity, promoInfo.limit) : item.quantity;
        const normalQty = item.quantity - promoQty;

        if (promoQty > 0) {
          const itemTotal = promoInfo.price * promoQty;
          total += itemTotal;
          items.push({ ...item, quantity: promoQty, displayPrice: promoInfo.price, displayTotal: itemTotal, isPromo: true });
        }
        if (normalQty > 0) {
          const itemTotal = item.price * normalQty;
          total += itemTotal;
          items.push({ ...item, quantity: normalQty, displayPrice: item.price, displayTotal: itemTotal, isNormal: true });
        }
      } else {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        items.push({ ...item, displayPrice: item.price, displayTotal: itemTotal });
      }
    });
    const final = total + shippingFee - discount - (appliedVoucher?.discountAmount || 0);
    console.log("🔍 [DEBUG] Calculated totalAmount:", total, "finalAmount:", final);
    return { displayItems: items, totalAmount: total, finalAmount: final };
  }, [rawCartDetails, flashSaleMap, shippingFee, discount, appliedVoucher]);

  // 2.5 Tính toán phí vận chuyển GHTK khi thay đổi địa chỉ hoặc tổng tiền
  useEffect(() => {
    if (!selectedProvince || !selectedDistrict) {
      setShippingFee(0);
      return;
    }

    const calculateFee = async () => {
      setCalculatingFee(true);
      const provObj = provinces.find(p => p.code === parseInt(selectedProvince));
      const distObj = districts.find(d => d.code === parseInt(selectedDistrict));
      if (!provObj || !distObj) {
        setCalculatingFee(false);
        return;
      }

      const provName = provObj.name;
      const distName = distObj.name;

      // Cập nhật địa chỉ đầy đủ vào form state
      const fullAddress = `${detailAddress ? detailAddress + ", " : ""}${distName}, ${provName}`;
      setForm(f => ({ ...f, customerAddress: fullAddress }));

      // Tính tổng khối lượng sách (giả định mỗi cuốn sách nặng 250g)
      const totalWeight = displayItems.reduce((acc, item) => acc + item.quantity * 250, 0) || 500;

      try {
        // Tham số gọi API GHTK
        const params = new URLSearchParams({
          pick_province: "Hà Nội",
          pick_district: "Quận Cầu Giấy",
          province: provName,
          district: distName,
          weight: totalWeight.toString(),
          value: totalAmount.toString(),
          deliver_option: "none"
        });

        const res = await fetch(`/api/shipment/fee?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.fee) {
            setShippingFee(data.fee.fee);
            setCalculatingFee(false);
            return;
          }
        }
      } catch (e) {
        console.warn("GHTK API error, using intelligent fallback rules.", e);
      }

      // FALLBACK: Tính toán phí dựa trên quy tắc phân vùng của GHTK
      const isHaNoi = provName.includes("Hà Nội");
      const northernProvinces = [
        "Hải Phòng", "Quảng Ninh", "Hải Dương", "Hưng Yên", "Bắc Ninh", "Vĩnh Phúc", 
        "Thái Nguyên", "Phú Thọ", "Bắc Giang", "Hòa Bình", "Sơn La", "Điện Biên", 
        "Lai Châu", "Lào Cai", "Yên Bái", "Hà Giang", "Tuyên Quang", "Cao Bằng", 
        "Bắc Kạn", "Lạng Sơn", "Thái Bình", "Nam Định", "Ninh Bình", "Thanh Hóa"
      ];
      const isNorthern = northernProvinces.some(p => provName.includes(p));

      let baseFee = 38000; // Liên vùng
      if (isHaNoi) {
        baseFee = 22000;
      } else if (isNorthern) {
        baseFee = 30000;
      }

      // Thêm phụ phí khối lượng (nếu nặng hơn 1kg)
      const weightSurcharge = totalWeight > 1000 ? Math.floor((totalWeight - 1000) / 500) * 5000 : 0;
      setShippingFee(baseFee + weightSurcharge);
      setCalculatingFee(false);
    };

    const delayDebounce = setTimeout(() => {
      calculateFee();
    }, 600); // Debounce to prevent too many API calls

    return () => clearTimeout(delayDebounce);
  }, [selectedProvince, selectedDistrict, detailAddress, provinces, districts, totalAmount, displayItems]);

  const handleApplyVoucher = async (codeOverride?: string) => {
    const codeToApply = codeOverride || voucherCode;
    if (!codeToApply.trim()) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    setApplyingVoucher(true);
    setVoucherError("");
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/checkout/apply-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },

        body: JSON.stringify({ code: codeToApply, orderValue: totalAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Voucher không hợp lệ");
      
      setAppliedVoucher({
        code: codeToApply,
        discountAmount: data.discountAmount || 0
      });
      setVoucherCode(""); // clear input on success
    } catch (err: any) {
      setVoucherError(err.message);
      setAppliedVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (!selectedProvince || !selectedDistrict || isBlank(detailAddress)) {
      errs.customerAddress = "Vui lòng chọn Tỉnh/Thành phố, Quận/Huyện và nhập địa chỉ chi tiết.";
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (displayItems.length === 0) { alert("Giỏ hàng trống"); router.push("/user/cart"); return; }

    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Vui lòng đăng nhập lại");
      const itemsPayload = displayItems.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
        price: item.displayPrice,
      }));
      console.log("🔍 [DEBUG] Submitting payload items:", itemsPayload);
      const payload = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        email: form.email,
        customerAddress: form.customerAddress,
        paymentMethod: form.paymentMethod,
        saveAddress: saveAddress,
        voucherCode: appliedVoucher?.code || null,
        items: itemsPayload,
      };
      console.log("🔍 [DEBUG] Full checkout payload:", payload);
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("🔍 [DEBUG] Checkout response:", data);
      if (res.ok && data.success) {
        if (form.paymentMethod === "VNPAY") {
          const paymentRes = await fetch(`${API_URL}/api/payment/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              amount: finalAmount,
              orderId: data.orderId.toString(),
              orderInfo: `Thanh toán đơn hàng #${data.orderCode}`,
              bankCode: "VNBANK",
            }),
          });
          const paymentData = await paymentRes.json();
          if (paymentData.paymentUrl) {
            sessionStorage.setItem("pendingOrderId", data.orderId);
            sessionStorage.setItem("pendingOrderCode", data.orderCode);
            window.location.href = paymentData.paymentUrl;
          } else throw new Error(paymentData.message || "Không tạo được URL thanh toán");
        } else {
          router.push(`/user/orders/${data.orderId}/success`);
        }
      } else {
        throw new Error(data.error || data.message || "Đặt hàng thất bại");
      }
    } catch (error: any) {
      alert(error.message);
      setSubmitting(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return "/images/book-default.jpg";
    let clean = url;
    if (clean.startsWith("books/")) clean = clean.substring(6);
    return `${API_URL}/uploads/books/${clean}`;
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
      <Footer />
    </>
  );

  if (displayItems.length === 0) return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <p className="text-6xl mb-4">🛒</p>
          <p className="text-gray-500 mb-6">Không có sản phẩm nào được chọn để thanh toán.</p>
          <Link href="/cart" className="inline-block bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition">
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div className="bg-[#f5f5f5] min-h-screen pb-40 font-display text-[#222]">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold uppercase text-center mb-6">Thanh toán</h1>
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
              {/* Thông tin khách hàng */}
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-extrabold mb-6">Thông tin nhận hàng</h3>
                <div className="space-y-4">
                  {[
                    { field: "customerName", label: "Họ và tên *", type: "text", ph: "Nguyễn Văn A" },
                    { field: "customerPhone", label: "Số điện thoại *", type: "tel", ph: "0901 234 567" },
                    { field: "email", label: "Email (tùy chọn)", type: "email", ph: "email@example.com" },
                  ].map(({ field, label, type, ph }) => (
                    <div key={field}>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
                      <input type={type} className={`w-full h-12 px-4 rounded-xl border outline-none text-sm ${errors[field as keyof FormState] ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-red-600"}`} placeholder={ph} value={form[field as keyof FormState]} onChange={e => set(field as keyof FormState, e.target.value)} />
                      {errors[field as keyof FormState] && <p className="text-red-500 text-xs mt-1">{errors[field as keyof FormState]}</p>}
                    </div>
                  ))}
                  {/* Tỉnh/Thành phố & Quận/Huyện */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Tỉnh/Thành phố *</label>
                      <select
                        className={`w-full h-12 px-4 rounded-xl border outline-none text-sm bg-white ${errors.customerAddress ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-red-600"}`}
                        value={selectedProvince}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedProvince(val);
                          setSelectedDistrict("");
                          setDistricts([]);
                          const prov = provinces.find(p => p.code === parseInt(val));
                          if (prov) {
                            setDistricts(prov.districts || []);
                          }
                          // Cập nhật form address rỗng khi đổi Tỉnh
                          setForm(f => ({ ...f, customerAddress: "" }));
                        }}
                      >
                        <option value="">Chọn Tỉnh / Thành phố</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Quận/Huyện *</label>
                      <select
                        className={`w-full h-12 px-4 rounded-xl border outline-none text-sm bg-white ${errors.customerAddress ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-red-600"}`}
                        value={selectedDistrict}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedDistrict(val);
                          // Cập nhật form address dựa trên quận huyện
                          const provObj = provinces.find(p => p.code === parseInt(selectedProvince));
                          const distObj = districts.find(d => d.code === parseInt(val));
                          const provName = provObj ? provObj.name : "";
                          const distName = distObj ? distObj.name : "";
                          const fullAddress = `${detailAddress ? detailAddress + ", " : ""}${distName}${distName && provName ? ", " : ""}${provName}`;
                          setForm(f => ({ ...f, customerAddress: fullAddress }));
                        }}
                        disabled={!selectedProvince}
                      >
                        <option value="">Chọn Quận / Huyện</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Địa chỉ chi tiết */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Địa chỉ cụ thể (Số nhà, đường, phường/xã) *</label>
                    <input
                      type="text"
                      className={`w-full h-12 px-4 rounded-xl border outline-none text-sm ${errors.customerAddress ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-red-600"}`}
                      placeholder="Ví dụ: 123 Đường 3/2, Phường 12"
                      value={detailAddress}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDetailAddress(val);
                        // Cập nhật địa chỉ đầy đủ vào form state
                        const provObj = provinces.find(p => p.code === parseInt(selectedProvince));
                        const distObj = districts.find(d => d.code === parseInt(selectedDistrict));
                        const provName = provObj ? provObj.name : "";
                        const distName = distObj ? distObj.name : "";
                        const fullAddress = `${val ? val + ", " : ""}${distName}${distName && provName ? ", " : ""}${provName}`;
                        setForm(f => ({ ...f, customerAddress: fullAddress }));
                        setErrors(err => ({ ...err, customerAddress: undefined }));
                      }}
                      disabled={!selectedDistrict}
                    />
                    {errors.customerAddress && <p className="text-red-500 text-xs mt-1">{errors.customerAddress}</p>}
                  </div>

                  {/* Lưu địa chỉ */}
                  <div className="flex items-center gap-2 mt-4">
                    <input 
                      type="checkbox" 
                      id="saveAddress" 
                      checked={saveAddress} 
                      onChange={e => setSaveAddress(e.target.checked)} 
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <label htmlFor="saveAddress" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Lưu làm địa chỉ nhận hàng mặc định</label>
                  </div>
                </div>
              </section>

              {/* Danh sách đơn hàng */}
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-extrabold">Đơn hàng</h3>
                  <span className="text-sm text-gray-500 font-bold">{displayItems.length} sản phẩm</span>
                </div>
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {displayItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                      <img src={getImageUrl(item.imageUrl)} alt={item.title} className="w-16 h-22 rounded-xl object-cover flex-shrink-0" onError={e => (e.currentTarget.src = "/images/book-default.jpg")} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold leading-tight text-sm line-clamp-2">
                          {item.title} {item.isNormal && <span className="text-gray-400 font-normal">(Giá gốc)</span>}
                          {item.isPromo && <span className="text-orange-500 font-normal">(Ưu đãi)</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">SL: {item.quantity}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-red-600 text-sm">{fmt(item.displayTotal)} đ</span>
                          {item.displayPrice < item.price && <span className="text-xs text-gray-400 line-through">{fmt(item.price)} đ</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mt-6">
              {/* Phương thức thanh toán */}
              <section className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-extrabold mb-4">Phương thức thanh toán</h3>
                <div className="space-y-3">
                  {[
                    { value: "COD", label: "Thanh toán khi giao hàng (COD)", icon: "local_shipping" },
                    { value: "VNPAY", label: "Thanh toán qua VNPay (thẻ ATM/Visa/Mastercard)", icon: "qr_code_scanner" },
                  ].map(opt => (
                    <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${form.paymentMethod === opt.value ? "border-red-600 bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input type="radio" name="paymentMethod" value={opt.value} checked={form.paymentMethod === opt.value} onChange={e => set("paymentMethod", e.target.value)} className="accent-red-600 w-4 h-4" />
                      <span className="material-symbols-outlined text-red-600 text-xl">{opt.icon}</span>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {form.paymentMethod === "VNPAY" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                    <p className="font-medium">Hướng dẫn thanh toán VNPay:</p>
                    <p>• Bạn sẽ được chuyển đến cổng thanh toán của VNPay</p>
                    <p>• Hỗ trợ thẻ ATM nội địa, Visa, Mastercard, JCB</p>
                  </div>
                )}
              </section>

              {/* Voucher Section */}
              <section className="bg-white rounded-2xl shadow-sm p-6 mt-6">
                <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">local_offer</span>
                  Mã giảm giá
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nhập mã voucher" 
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                      disabled={applyingVoucher || appliedVoucher !== null}
                      className="flex-1 h-12 px-4 border border-gray-200 rounded-xl text-sm font-medium uppercase focus:border-red-600 focus:outline-none disabled:bg-gray-50"
                    />
                    {appliedVoucher ? (
                      <button 
                        type="button" 
                        onClick={() => setAppliedVoucher(null)}
                        className="px-4 h-12 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition text-sm"
                      >
                        Hủy
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleApplyVoucher}
                        disabled={applyingVoucher || !voucherCode.trim()}
                        className="px-6 h-12 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition text-sm disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                      >
                        {applyingVoucher ? (
                          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : "Áp dụng"}
                      </button>
                    )}
                  </div>
                  {voucherError && <p className="text-red-500 text-xs mt-1 font-medium">{voucherError}</p>}
                  {appliedVoucher && (
                    <p className="text-emerald-600 text-sm mt-1 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Đã áp dụng mã {appliedVoucher.code} (-{fmt(appliedVoucher.discountAmount)}đ)
                    </p>
                  )}

                  {/* Hiển thị danh sách voucher có sẵn */}
                  {availableVouchers.length > 0 && !appliedVoucher && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Hoặc chọn mã có sẵn:</p>
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {availableVouchers.map((v, i) => {
                          const isEligible = totalAmount >= v.minOrderValue;
                          return (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${isEligible ? 'border-indigo-100 bg-indigo-50/30' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                              <div>
                                <div className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-indigo-600">confirmation_number</span>
                                  {v.code}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Giảm {v.discountType === "PERCENT" ? `${v.discountValue}%` : `${fmt(v.discountValue)}đ`} 
                                  {v.minOrderValue > 0 && ` (Đơn từ ${fmt(v.minOrderValue)}đ)`}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={!isEligible || applyingVoucher}
                                onClick={() => {
                                  setVoucherCode(v.code);
                                  handleApplyVoucher(v.code);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEligible ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                              >
                                Dùng
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Tổng kết */}
              <section className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">Thông tin thanh toán</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{fmt(totalAmount)} đ</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phí vận chuyển</span>
                    <span className="flex items-center gap-1.5 font-semibold">
                      {calculatingFee && (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      )}
                      {shippingFee === 0 ? "Miễn phí" : fmt(shippingFee) + " đ"}
                    </span>
                  </div>
                  {discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Giảm giá chung</span><span>-{fmt(discount)} đ</span></div>}
                  {appliedVoucher && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Voucher</span>
                      <span>-{fmt(appliedVoucher.discountAmount)} đ</span>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between font-extrabold text-xl items-center">
                    <span>Tổng thanh toán</span>
                    <span className="text-red-600 text-2xl">{fmt(Math.max(0, finalAmount))} đ</span>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-[0_8px_20px_-8px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100">XÁC NHẬN ĐẶT HÀNG</button>
              </section>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}