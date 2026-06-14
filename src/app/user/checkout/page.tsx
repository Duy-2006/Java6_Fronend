"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isBlank, isValidEmail } from "@/services/validation";
import { authFetch, isLoggedIn } from "@/services/ordersService";
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
  const [flashSaleMap, setFlashSaleMap] = useState<Map<number, { price: number; limit: number | null }>>(new Map());

  const [form, setForm] = useState<FormState>({
    customerName: "",
    customerPhone: "",
    email: "",
    customerAddress: "",
    paymentMethod: "COD",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districts, setDistricts] = useState<any[]>([]);
  const [detailAddress, setDetailAddress] = useState("");
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [savedUser, setSavedUser] = useState<any>(null);

  // Address book states
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useManualAddress, setUseManualAddress] = useState(true);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discountAmount: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const setFormField = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // 1. Lấy flash sale map
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await fetch(`${API_URL}/api/books/flash-sale`);
        if (!res.ok) return;
        const data: any[] = await res.json();
        console.log("🔍 [DEBUG] Flash sale data from API:", data);
        const map = new Map<number, { price: number; limit: number | null }>();
        data.forEach((book) => {
          let finalPrice: number | null = null;
          if (book.discountPrice != null) finalPrice = Number(book.discountPrice);
          else if (book.discountValue != null && book.price != null) {
            const discount = Number(book.discountValue);
            const original = Number(book.price);
            if (discount > 0 && discount <= 100) finalPrice = (original * (100 - discount)) / 100;
          }
          if (finalPrice && finalPrice > 0) {
            map.set(book.id, { price: finalPrice, limit: book.usageLimit ?? null });
            console.log(`  - Mapped bookId ${book.id} -> discountPrice ${finalPrice}`);
          }
        });
        setFlashSaleMap(map);
      } catch (err) {
        console.error("Flash sale fetch error:", err);
      }
    };
    fetchFlashSale();
  }, []);

  // 1.5 Lấy danh sách Tỉnh/Thành phố
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
      if (!isLoggedIn()) {
        router.push("/login");
        return;
      }
      try {
        // authFetch tự parse JSON và throw nếu lỗi
        const data = await authFetch(`${API_URL}/api/checkout/preview`, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("🔍 [DEBUG] Preview data from backend:", data);

        const details = (data.cartDetails || []).map((item: any) => ({
          ...item,
          isAudiobook:
            item.book?.audioPrice > 0 && Number(item.price) === Number(item.book?.audioPrice),
          authorName: item.book?.author?.name || item.authorName || "Nguyễn Nhật Ánh",
        }));
        setRawCartDetails(details);
        setDiscount(data.discount || 0);

        try {
          const me = await authFetch(`${API_URL}/api/auth/me`, {});
          setForm((f) => ({
            ...f,
            customerName: me.name || f.customerName,
            customerPhone: me.phone || f.customerPhone,
            email: me.email || f.email,
          }));
          setSavedUser(me);
        } catch (e) {
          console.error("Lỗi lấy thông tin user", e);
        }

        try {
          const addrData = await authFetch(`${API_URL}/api/profile/addresses`, {});
          if (Array.isArray(addrData) && addrData.length > 0) {
            setAddresses(addrData);
            const defaultAddr = addrData.find((a: any) => a.isDefault) || addrData[0];
            setSelectedAddressId(defaultAddr.id);
            setUseManualAddress(false);
          }
        } catch (e) {
          console.error("Lỗi lấy địa chỉ", e);
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

  // Autofill từ address book khi chọn địa chỉ đã lưu
  useEffect(() => {
    if (provinces.length > 0 && selectedAddressId && !useManualAddress) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr) {
        setForm((f) => ({
          ...f,
          customerName: addr.receiverName,
          customerPhone: addr.receiverPhone,
        }));
        setSelectedProvince(addr.provinceId.toString());
        const provObj = provinces.find((p: any) => p.code === addr.provinceId);
        if (provObj) {
          setDistricts(provObj.districts || []);
          setSelectedDistrict(addr.districtId.toString());
        }
        setDetailAddress(addr.street + (addr.wardName ? ", " + addr.wardName : ""));
      }
    }
  }, [selectedAddressId, addresses, provinces, useManualAddress]);

  // Autofill địa chỉ từ profile khi chưa có address book
  useEffect(() => {
    if (provinces.length > 0 && savedUser?.address && useManualAddress && addresses.length === 0) {
      const parts = savedUser.address.split(", ").reverse();
      if (parts.length >= 2) {
        const pName = parts[0];
        const dName = parts[1];
        const detail = parts.slice(2).reverse().join(", ");
        const prov = provinces.find((p: any) => p.name === pName);
        if (prov) {
          setSelectedProvince(prov.code.toString());
          setDistricts(prov.districts || []);
          const dist = prov.districts?.find((d: any) => d.name === dName);
          if (dist) setSelectedDistrict(dist.code.toString());
          setDetailAddress(detail);
          setForm((f) => ({ ...f, customerAddress: savedUser.address }));
        }
      }
      setSavedUser((curr: any) => ({ ...curr, address: null }));
    }
  }, [provinces, savedUser, useManualAddress, addresses.length]);

  // Lấy danh sách voucher
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const data = await authFetch(`${API_URL}/api/vouchers/active`, {});
        setAvailableVouchers(data || []);
      } catch (err) {
        console.error("Failed to fetch vouchers:", err);
      }
    };
    fetchVouchers();
  }, []);

  // 3. Tính toán giá
  const { displayItems, totalAmount, onlyAudiobooks } = useMemo(() => {
    if (rawCartDetails.length === 0) {
      return { displayItems: [], totalAmount: 0, onlyAudiobooks: false };
    }
    let total = 0;
    const items: any[] = [];
    let isAllAudiobooks = true;

    rawCartDetails.forEach((item) => {
      if (!(item as any).isAudiobook) isAllAudiobooks = false;
      const promoInfo = flashSaleMap.get(item.bookId);
      if (promoInfo && promoInfo.price < item.price) {
        const promoQty =
          promoInfo.limit !== null ? Math.min(item.quantity, promoInfo.limit) : item.quantity;
        const normalQty = item.quantity - promoQty;
        if (promoQty > 0) {
          const itemTotal = promoInfo.price * promoQty;
          total += itemTotal;
          items.push({
            ...item,
            quantity: promoQty,
            displayPrice: promoInfo.price,
            displayTotal: itemTotal,
            isPromo: true,
          });
        }
        if (normalQty > 0) {
          const itemTotal = item.price * normalQty;
          total += itemTotal;
          items.push({
            ...item,
            quantity: normalQty,
            displayPrice: item.price,
            displayTotal: itemTotal,
            isNormal: true,
          });
        }
      } else {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        items.push({ ...item, displayPrice: item.price, displayTotal: itemTotal });
      }
    });

    console.log("🔍 [DEBUG] Calculated totalAmount:", total);
    return { displayItems: items, totalAmount: total, onlyAudiobooks: isAllAudiobooks };
  }, [rawCartDetails, flashSaleMap]);

  const finalAmount = useMemo(() => {
    return totalAmount + shippingFee - discount - (appliedVoucher?.discountAmount || 0);
  }, [totalAmount, shippingFee, discount, appliedVoucher]);

  // Tính phí vận chuyển GHTK
  useEffect(() => {
    if (onlyAudiobooks) {
      setShippingFee(0);
      return;
    }
    if (!selectedProvince || !selectedDistrict) {
      setShippingFee(0);
      return;
    }

    const calculateFee = async () => {
      setCalculatingFee(true);
      const provObj = provinces.find((p) => p.code === parseInt(selectedProvince));
      const distObj = districts.find((d) => d.code === parseInt(selectedDistrict));
      if (!provObj || !distObj) {
        setCalculatingFee(false);
        return;
      }

      const provName = provObj.name;
      const distName = distObj.name;
      const fullAddress = `${detailAddress ? detailAddress + ", " : ""}${distName}, ${provName}`;
      setForm((f) => ({ ...f, customerAddress: fullAddress }));

      const totalWeight =
        displayItems.reduce(
          (acc, item) => acc + ((item as any).isAudiobook ? 0 : item.quantity * 250),
          0
        ) || 500;

      try {
        const params = new URLSearchParams({
          pick_province: "Hà Nội",
          pick_district: "Quận Cầu Giấy",
          province: provName,
          district: distName,
          weight: totalWeight.toString(),
          value: totalAmount.toString(),
          deliver_option: "none",
        });
        const data = await authFetch(`/api/shipment/fee?${params.toString()}`, {});
        if (data.success && data.fee) {
          setShippingFee(data.fee.fee);
          setCalculatingFee(false);
          return;
        }
      } catch (e) {
        console.warn("GHTK API error, using fallback.", e);
      }

      const isHaNoi = provName.includes("Hà Nội");
      const northernProvinces = [
        "Hải Phòng", "Quảng Ninh", "Hải Dương", "Hưng Yên", "Bắc Ninh", "Vĩnh Phúc",
        "Thái Nguyên", "Phú Thọ", "Bắc Giang", "Hòa Bình", "Sơn La", "Điện Biên",
        "Lai Châu", "Lào Cai", "Yên Bái", "Hà Giang", "Tuyên Quang", "Cao Bằng",
        "Bắc Kạn", "Lạng Sơn", "Thái Bình", "Nam Định", "Ninh Bình", "Thanh Hóa",
      ];
      const isNorthern = northernProvinces.some((p) => provName.includes(p));
      let baseFee = 38000;
      if (isHaNoi) baseFee = 22000;
      else if (isNorthern) baseFee = 30000;
      const weightSurcharge =
        totalWeight > 1000 ? Math.floor((totalWeight - 1000) / 500) * 5000 : 0;
      setShippingFee(baseFee + weightSurcharge);
      setCalculatingFee(false);
    };

    const delayDebounce = setTimeout(() => {
      calculateFee();
    }, 600);
    return () => clearTimeout(delayDebounce);
  }, [selectedProvince, selectedDistrict, detailAddress, provinces, districts, totalAmount, displayItems, onlyAudiobooks]);

  const handleApplyVoucher = async (codeOverride?: string) => {
    const codeToApply = codeOverride || voucherCode;
    if (!codeToApply.trim()) {
      setVoucherError("Vui lòng nhập mã voucher");
      return;
    }
    setApplyingVoucher(true);
    setVoucherError("");
    try {
      // authFetch tự throw nếu lỗi, nên catch bên dưới sẽ bắt
      const data = await authFetch(`${API_URL}/api/checkout/apply-voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToApply, orderValue: totalAmount }),
      });
      setAppliedVoucher({ code: codeToApply, discountAmount: data.discountAmount || 0 });
      setVoucherCode("");
      showToast(`Đã áp dụng mã giảm giá ${codeToApply.toUpperCase()} thành công!`);
    } catch (err: any) {
      setVoucherError(err.message);
      setAppliedVoucher(null);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);

    if (!onlyAudiobooks) {
      if (!selectedProvince || !selectedDistrict || isBlank(detailAddress)) {
        errs.customerAddress =
          "Vui lòng chọn đầy đủ thông tin Tỉnh/Thành phố, Quận/Huyện và số địa chỉ chi tiết.";
      }
    } else {
      if (isBlank(form.customerAddress)) {
        form.customerAddress = "Sách nói (Digital Delivery)";
      }
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc", "error");
      return;
    }
    if (displayItems.length === 0) {
      showToast("Giỏ hàng trống", "error");
      router.push("/user/cart");
      return;
    }

    setSubmitting(true);
    try {
      if (!isLoggedIn()) throw new Error("Vui lòng đăng nhập lại");

      const itemsPayload = displayItems.map((item) => ({
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
        voucherCode: appliedVoucher?.code || null,
        items: itemsPayload,
        saveAddress: useManualAddress && saveAddress,
        provinceId: selectedProvince ? parseInt(selectedProvince) : null,
        districtId: selectedDistrict ? parseInt(selectedDistrict) : null,
        provinceName:
          provinces.find((p: any) => p.code === parseInt(selectedProvince))?.name || null,
        street: detailAddress,
      };
      console.log("🔍 [DEBUG] Full checkout payload:", payload);

      // authFetch tự parse JSON và throw nếu lỗi
      const data = await authFetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log("🔍 [DEBUG] Checkout response:", data);

      if (data.success) {
        // ─── VNPAY ───────────────────────────────────────────────────
        if (form.paymentMethod === "VNPAY") {
          const paymentData = await authFetch(`${API_URL}/api/payment/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: finalAmount,
              orderId: data.orderId.toString(),
              orderInfo: `Thanh toán đơn hàng #${data.orderCode}`,
              bankCode: "VNBANK",
            }),
          });
          if (paymentData.paymentUrl) {
            sessionStorage.setItem("pendingOrderId", data.orderId);
            sessionStorage.setItem("pendingOrderCode", data.orderCode);
            window.location.href = paymentData.paymentUrl;
          } else {
            throw new Error(paymentData.message || "Không tạo được link thanh toán VNPAY");
          }

        // ─── PAYOS ───────────────────────────────────────────────────
        } else if (form.paymentMethod === "PAYOS") {
          const paymentData = await authFetch(`${API_URL}/api/pay-os/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: finalAmount,
              description: `DH${data.orderCode}`.substring(0, 25),
            }),
          });
          if (paymentData.checkoutUrl) {
            sessionStorage.setItem("pendingOrderId", data.orderId);
            sessionStorage.setItem("pendingOrderCode", data.orderCode);
            window.location.href = paymentData.checkoutUrl;
          } else {
            throw new Error(paymentData.message || "Không tạo được link thanh toán PayOS");
          }

        // ─── COD ─────────────────────────────────────────────────────
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

  if (loading)
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </>
    );

  if (displayItems.length === 0)
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-gray-500 mb-6">Không có sản phẩm nào được chọn để thanh toán.</p>
            <Link
              href="/cart"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition"
            >
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
      <link
        href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
        rel="stylesheet"
      />

      <main className="bg-[#f7f9fb] min-h-screen py-10 font-sans text-[#191c1e]">
        <div className="max-w-[1230px] mx-auto px-4">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[32px] font-bold text-[#191c1e] tracking-[-0.02em] font-sans">
              Thanh toán đơn hàng
            </h1>
            <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-[#545f73]">
              <Link href="/user/cart" className="hover:text-[#b70011] transition-colors">
                Giỏ hàng
              </Link>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="text-[#191c1e] font-semibold">Thông tin thanh toán</span>
              <span className="material-symbols-outlined text-[12px]">chevron_right</span>
              <span className="opacity-40">Hoàn tất đơn hàng</span>
            </div>
          </div>

          {/* Address Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-[4px] w-[90%] max-w-[500px] shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-bold text-[15px]">Chọn địa chỉ nhận hàng</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="text-gray-500 hover:text-black"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`border rounded-[4px] p-4 cursor-pointer transition-all ${
                        selectedAddressId === a.id && !useManualAddress
                          ? "border-[#b70011] bg-[#b70011]/5"
                          : "border-[#e0e3e5] hover:border-gray-400"
                      }`}
                      onClick={() => {
                        setSelectedAddressId(a.id);
                        setUseManualAddress(false);
                        setShowAddressModal(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold flex items-center gap-2 text-[13px]">
                          {a.receiverName}
                          {a.isDefault && (
                            <span className="bg-[#b70011] text-white text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className="text-[#b70011] font-mono text-[13px]">{a.receiverPhone}</div>
                      </div>
                      <div className="text-[13px] text-[#545f73]">
                        {a.street},{a.wardName && " " + a.wardName + ","}
                        {" "}
                        {provinces
                          .find((p: any) => p.code === a.provinceId)
                          ?.districts?.find((d: any) => d.code === a.districtId)?.name}
                        , {a.provinceName}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setUseManualAddress(true);
                      setShowAddressModal(false);
                    }}
                    className={`w-full border border-dashed rounded-[4px] p-3 text-center transition-all text-[13px] font-semibold ${
                      useManualAddress
                        ? "border-[#b70011] text-[#b70011] bg-[#b70011]/5"
                        : "border-[#e0e3e5] text-[#545f73] hover:border-gray-400"
                    }`}
                  >
                    + Nhập địa chỉ nhận hàng mới
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* Left side */}
              <div className="w-full lg:w-2/3 space-y-6">

                {/* 1. Shipping Details */}
                <div className="bg-white border border-[#e0e3e5] rounded-[4px] p-6">
                  <h3 className="text-[14px] font-bold text-[#191c1e] tracking-wider uppercase border-b border-[#e0e3e5] pb-3 mb-5">
                    1. Thông tin giao hàng
                  </h3>

                  {!useManualAddress && selectedAddressId ? (
                    <div className="border border-[#b70011] bg-[#b70011]/5 rounded-[2px] p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold flex items-center gap-2 text-[13px] text-[#191c1e]">
                          {addresses.find((a) => a.id === selectedAddressId)?.receiverName}
                          {addresses.find((a) => a.id === selectedAddressId)?.isDefault && (
                            <span className="bg-[#b70011] text-white text-[10px] px-1.5 py-0.5 rounded-[2px] font-mono">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(true)}
                          className="text-[#b70011] text-[13px] font-semibold hover:underline"
                        >
                          Thay đổi
                        </button>
                      </div>
                      <div className="text-[#545f73] text-[13px] mb-1 font-mono">
                        SĐT: {addresses.find((a) => a.id === selectedAddressId)?.receiverPhone}
                      </div>
                      <div className="text-[#545f73] text-[13px]">{form.customerAddress}</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                            Họ và tên *
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập họ và tên người nhận"
                            className={`w-full h-11 px-3 bg-white border rounded-[2px] outline-none text-[13px] transition-colors focus:border-[#b70011] ${
                              errors.customerName
                                ? "border-[#ba1a1a] bg-[#ba1a1a]/5"
                                : "border-[#e0e3e5]"
                            }`}
                            value={form.customerName}
                            onChange={(e) => setFormField("customerName", e.target.value)}
                          />
                          {errors.customerName && (
                            <p className="text-[#ba1a1a] text-[11px] font-mono mt-1">
                              * {errors.customerName}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                            Số điện thoại *
                          </label>
                          <input
                            type="tel"
                            placeholder="Ví dụ: 0901234567"
                            className={`w-full h-11 px-3 bg-white border rounded-[2px] outline-none text-[13px] transition-colors focus:border-[#b70011] ${
                              errors.customerPhone
                                ? "border-[#ba1a1a] bg-[#ba1a1a]/5"
                                : "border-[#e0e3e5]"
                            }`}
                            value={form.customerPhone}
                            onChange={(e) => setFormField("customerPhone", e.target.value)}
                          />
                          {errors.customerPhone && (
                            <p className="text-[#ba1a1a] text-[11px] font-mono mt-1">
                              * {errors.customerPhone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                          Địa chỉ Email (tùy chọn)
                        </label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          className={`w-full h-11 px-3 bg-white border rounded-[2px] outline-none text-[13px] transition-colors focus:border-[#b70011] ${
                            errors.email ? "border-[#ba1a1a] bg-[#ba1a1a]/5" : "border-[#e0e3e5]"
                          }`}
                          value={form.email}
                          onChange={(e) => setFormField("email", e.target.value)}
                        />
                        {errors.email && (
                          <p className="text-[#ba1a1a] text-[11px] font-mono mt-1">
                            * {errors.email}
                          </p>
                        )}
                      </div>

                      {!onlyAudiobooks ? (
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                                Tỉnh/Thành phố *
                              </label>
                              <select
                                aria-label="Tỉnh/Thành phố"
                                className={`w-full h-11 px-3 bg-white border rounded-[2px] outline-none text-[13px] transition-colors focus:border-[#b70011] ${
                                  errors.customerAddress && !selectedProvince
                                    ? "border-[#ba1a1a] bg-[#ba1a1a]/5"
                                    : "border-[#e0e3e5]"
                                }`}
                                value={selectedProvince}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedProvince(val);
                                  setSelectedDistrict("");
                                  setDistricts([]);
                                  const prov = provinces.find((p) => p.code === parseInt(val));
                                  if (prov) setDistricts(prov.districts || []);
                                  setFormField("customerAddress", "");
                                }}
                              >
                                <option value="">Chọn Tỉnh / Thành phố</option>
                                {provinces.map((p) => (
                                  <option key={p.code} value={p.code}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                                Quận/Huyện *
                              </label>
                              <select
                                aria-label="Quận/Huyện"
                                className={`w-full h-11 px-3 bg-white border rounded-[2px] outline-none text-[13px] transition-colors focus:border-[#b70011] ${
                                  errors.customerAddress && !selectedDistrict
                                    ? "border-[#ba1a1a] bg-[#ba1a1a]/5"
                                    : "border-[#e0e3e5]"
                                }`}
                                value={selectedDistrict}
                                disabled={!selectedProvince}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedDistrict(val);
                                  const provObj = provinces.find(
                                    (p) => p.code === parseInt(selectedProvince)
                                  );
                                  const distObj = districts.find((d) => d.code === parseInt(val));
                                  const fullAddress = `${detailAddress ? detailAddress + ", " : ""}${distObj?.name || ""}${distObj && provObj ? ", " : ""}${provObj?.name || ""}`;
                                  setFormField("customerAddress", fullAddress);
                                }}
                              >
                                <option value="">Chọn Quận / Huyện</option>
                                {districts.map((d) => (
                                  <option key={d.code} value={d.code}>
                                    {d.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-[#545f73] uppercase tracking-wider mb-1.5">
                              Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) *
                            </label>
                            <input
                              type="text"
                              placeholder="Ví dụ: 123 Đường 3/2, Phường 12"
                              className={`w-full h-11 px-3 bg-white border rounded-[2px] outline-none text-[13px] transition-colors focus:border-[#b70011] ${
                                errors.customerAddress && isBlank(detailAddress)
                                  ? "border-[#ba1a1a] bg-[#ba1a1a]/5"
                                  : "border-[#e0e3e5]"
                              }`}
                              value={detailAddress}
                              disabled={!selectedDistrict}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDetailAddress(val);
                                const provObj = provinces.find(
                                  (p) => p.code === parseInt(selectedProvince)
                                );
                                const distObj = districts.find(
                                  (d) => d.code === parseInt(selectedDistrict)
                                );
                                const fullAddress = `${val ? val + ", " : ""}${distObj?.name || ""}${distObj && provObj ? ", " : ""}${provObj?.name || ""}`;
                                setFormField("customerAddress", fullAddress);
                                setErrors((err) => ({ ...err, customerAddress: undefined }));
                              }}
                            />
                            {errors.customerAddress && (
                              <p className="text-[#ba1a1a] text-[11px] font-mono mt-1">
                                * {errors.customerAddress}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="saveAddress"
                              className="w-4 h-4 rounded text-[#b70011] focus:ring-[#b70011] cursor-pointer"
                              checked={saveAddress}
                              onChange={(e) => setSaveAddress(e.target.checked)}
                            />
                            <label
                              htmlFor="saveAddress"
                              className="text-[13px] text-[#545f73] font-semibold select-none cursor-pointer"
                            >
                              Lưu thông tin này vào Sổ địa chỉ
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-4 bg-[#f2f4f6] border border-[#e0e3e5] rounded-[2px] text-[12px] text-[#545f73] font-mono">
                          <div className="flex items-center gap-2 text-[#191c1e] font-semibold mb-1">
                            <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                            <span>Đơn hàng chỉ gồm sản phẩm số (Sách nói)</span>
                          </div>
                          <p>
                            Hệ thống không tính phí vận chuyển và sẽ mở khóa sách trực tiếp trong
                            Thư viện cá nhân của bạn ngay khi giao dịch hoàn tất.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Shipping Methods */}
                {!onlyAudiobooks && (
                  <div className="bg-white border border-[#e0e3e5] rounded-[4px] p-6">
                    <h3 className="text-[14px] font-bold text-[#191c1e] tracking-wider uppercase border-b border-[#e0e3e5] pb-3 mb-5">
                      2. Đối tác vận chuyển
                    </h3>
                    <div className="border border-[#b70011] bg-[#b70011]/5 rounded-[2px] p-4 flex justify-between items-center">
                      <div className="flex gap-3 items-start">
                        <span className="material-symbols-outlined text-[#b70011] text-[20px] mt-0.5">
                          local_shipping
                        </span>
                        <div>
                          <div className="font-semibold text-[13px] text-[#191c1e]">
                            Giao hàng tiêu chuẩn
                          </div>
                          <div className="text-[11px] text-[#545f73] font-mono mt-0.5">
                            Đối tác: Giao Hàng Tiết Kiệm (GHTK)
                          </div>
                          <div className="text-[11px] text-[#545f73] font-mono">
                            Dự kiến nhận hàng: 3 - 5 ngày làm việc
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[14px] font-mono text-[#b70011]">
                          {calculatingFee ? (
                            <span className="inline-block w-4 h-4 border-2 border-[#b70011] border-t-transparent rounded-full animate-spin" />
                          ) : shippingFee === 0 ? (
                            "Miễn phí"
                          ) : (
                            fmt(shippingFee)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Payment Methods */}
                <div className="bg-white border border-[#e0e3e5] rounded-[4px] p-6">
                  <h3 className="text-[14px] font-bold text-[#191c1e] tracking-wider uppercase border-b border-[#e0e3e5] pb-3 mb-5">
                    3. Phương thức thanh toán
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        value: "COD",
                        label: "Thanh toán khi nhận hàng (COD)",
                        desc: "Nhận sách và thanh toán tiền mặt trực tiếp với shipper",
                        icon: "payments",
                        disabled: onlyAudiobooks,
                      },
                      {
                        value: "VNPAY",
                        label: "Thanh toán qua VNPay",
                        desc: "Quét mã QR hoặc sử dụng thẻ ATM, Visa, Mastercard",
                        icon: "qr_code_scanner",
                        disabled: false,
                      },
                      {
                        value: "PAYOS",
                        label: "Thanh toán qua PayOS",
                        desc: "Thanh toán nhanh qua PayOS với QR, thẻ nội địa/quốc tế hoặc ví điện tử",
                        icon: "credit_score",
                        disabled: false,
                      },
                    ].map((opt) => {
                      const isSelected = form.paymentMethod === opt.value;
                      if (opt.disabled && isSelected) {
                        setTimeout(() => setFormField("paymentMethod", "VNPAY"), 0);
                      }
                      return (
                        <label
                          key={opt.value}
                          className={`border rounded-[2px] p-4 flex flex-col justify-between cursor-pointer transition-all ${
                            opt.disabled
                              ? "opacity-40 cursor-not-allowed border-[#e0e3e5] bg-[#eceef0]"
                              : isSelected
                              ? "border-[#b70011] bg-[#b70011]/5"
                              : "border-[#e0e3e5] bg-white hover:bg-[#f7f9fb]"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={opt.value}
                                disabled={opt.disabled}
                                checked={isSelected}
                                onChange={(e) => setFormField("paymentMethod", e.target.value)}
                                className="accent-[#b70011] w-3.5 h-3.5 border-[#e0e3e5] cursor-pointer disabled:cursor-not-allowed"
                              />
                              <span className="text-[13px] font-semibold text-[#191c1e]">
                                {opt.label}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-[#545f73]">
                              {opt.icon}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#545f73] leading-relaxed">{opt.desc}</p>
                          {opt.value === "COD" && onlyAudiobooks && (
                            <p className="text-[#ba1a1a] text-[10px] font-mono mt-2 font-semibold">
                              * Sách nói chỉ hỗ trợ thanh toán trực tuyến
                            </p>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {form.paymentMethod === "VNPAY" && (
                    <div className="mt-4 p-4 bg-[#f2f4f6] border border-[#e0e3e5] rounded-[2px] text-[11px] text-[#545f73] font-mono space-y-1">
                      <div className="font-semibold text-[#191c1e] mb-1">
                        Hướng dẫn thanh toán VNPay:
                      </div>
                      <div>
                        • Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán bảo mật của VNPay.
                      </div>
                      <div>
                        • Bạn có thể chọn quét mã QR bằng ứng dụng ngân hàng hoặc nhập thông tin
                        thẻ ATM, VISA, Mastercard.
                      </div>
                    </div>
                  )}

                  {form.paymentMethod === "PAYOS" && (
                    <div className="mt-4 p-4 bg-[#f2f4f6] border border-[#e0e3e5] rounded-[2px] text-[11px] text-[#545f73] font-mono space-y-1">
                      <div className="font-semibold text-[#191c1e] mb-1">
                        Hướng dẫn thanh toán PayOS:
                      </div>
                      <div>• Chọn PayOS để thanh toán nhanh qua cổng PayOS.</div>
                      <div>• Hỗ trợ QR, thẻ ATM, thẻ quốc tế và nhiều ví điện tử.</div>
                    </div>
                  )}
                </div>

                {/* 4. Voucher */}
                <div className="bg-white border border-[#e0e3e5] rounded-[4px] p-6">
                  <h3 className="text-[14px] font-bold text-[#191c1e] tracking-wider uppercase border-b border-[#e0e3e5] pb-3 mb-5">
                    4. Mã giảm giá & Quà tặng
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="NHẬP MÃ VOUCHER"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      disabled={applyingVoucher || appliedVoucher !== null}
                      className="flex-1 h-11 px-3 border border-[#e0e3e5] rounded-[2px] text-[13px] font-mono font-medium placeholder-gray-400 focus:border-[#b70011] focus:outline-none uppercase disabled:bg-[#eceef0]"
                    />
                    {appliedVoucher ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedVoucher(null);
                          showToast("Đã hủy áp dụng mã giảm giá");
                        }}
                        className="px-4 h-11 border border-[#e0e3e5] hover:bg-[#f2f4f6] text-[#191c1e] rounded-[2px] font-bold transition text-[12px] font-mono uppercase tracking-wider"
                      >
                        Hủy
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApplyVoucher()}
                        disabled={applyingVoucher || !voucherCode.trim()}
                        className="px-6 h-11 bg-[#b70011] hover:bg-[#b70011]/90 text-white rounded-[2px] font-bold transition text-[12px] font-mono uppercase tracking-wider disabled:opacity-40 flex items-center justify-center min-w-[110px]"
                      >
                        {applyingVoucher ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Áp dụng"
                        )}
                      </button>
                    )}
                  </div>
                  {voucherError && (
                    <p className="text-[#ba1a1a] text-[11px] font-mono mt-2 font-medium">
                      * {voucherError}
                    </p>
                  )}
                  {appliedVoucher && (
                    <p className="text-emerald-600 text-sm mt-2 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Đã áp dụng mã {appliedVoucher.code} (-{fmt(appliedVoucher.discountAmount)}đ)
                    </p>
                  )}

                  {availableVouchers.length > 0 && !appliedVoucher && (
                    <div className="mt-6 border-t border-[#eceef0] pt-4">
                      <p className="text-[10px] text-[#545f73] font-semibold mb-3 uppercase tracking-wider font-mono">
                        Chọn mã giảm giá có sẵn:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar font-mono text-[11px]">
                        {availableVouchers.map((v, i) => {
                          const isEligible = totalAmount >= v.minOrderValue;
                          return (
                            <div
                              key={i}
                              className={`flex items-center justify-between p-3 rounded-[2px] border transition-all ${
                                isEligible
                                  ? "border-[#e0e3e5] bg-white hover:border-[#b70011]/40"
                                  : "border-[#eceef0] bg-[#f7f9fb] opacity-50"
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-[12px] text-[#191c1e] font-mono flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[14px] text-[#b70011]">
                                    local_activity
                                  </span>
                                  {v.code}
                                </div>
                                <div className="text-[11px] text-[#545f73] mt-1 line-clamp-1 font-mono">
                                  Giảm{" "}
                                  {v.discountType === "PERCENT"
                                    ? `${v.discountValue}%`
                                    : fmt(v.discountValue)}
                                  {v.minOrderValue > 0 &&
                                    ` cho đơn từ ${fmt(v.minOrderValue)}`}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={!isEligible || applyingVoucher}
                                onClick={() => {
                                  setVoucherCode(v.code);
                                  handleApplyVoucher(v.code);
                                }}
                                className={`px-3 py-1.5 rounded-[2px] text-[11px] font-bold font-mono transition-all uppercase tracking-wider ${
                                  isEligible
                                    ? "bg-[#b70011] text-white hover:bg-[#b70011]/90"
                                    : "bg-[#e6e8ea] text-[#9ba3af] cursor-not-allowed"
                                }`}
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
              </div>

              {/* Right side — Order Summary */}
              <div className="w-full lg:w-1/3 lg:sticky lg:top-24 space-y-6">
                <div className="bg-white border border-[#e0e3e5] rounded-[4px] p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-[#e0e3e5] pb-3">
                    <h3 className="text-[14px] font-bold text-[#191c1e] uppercase tracking-wider">
                      Đơn hàng của bạn
                    </h3>
                    <span className="text-[12px] text-[#545f73] font-semibold font-mono">
                      {displayItems.length} sản phẩm
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 divide-y divide-[#eceef0] no-scrollbar">
                    {displayItems.map((item, idx) => (
                      <div key={idx} className={`flex gap-4 items-start ${idx > 0 ? "pt-4" : ""}`}>
                        <div className="w-[60px] h-[90px] bg-[#eceef0] border border-[#e0e3e5] rounded-[2px] flex-shrink-0 overflow-hidden shadow-sm">
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "/images/book-default.jpg")}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[13px] text-[#191c1e] line-clamp-2 leading-tight">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#545f73] mt-0.5 truncate font-sans">
                            Tác giả: {item.authorName}
                          </p>
                          <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                            <span className="text-[11px] text-[#545f73] font-mono">
                              SL: {item.quantity}
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-[13px] font-mono text-[#b70011]">
                                {fmt(item.displayTotal)}
                              </span>
                              {item.displayPrice < item.price && (
                                <div className="text-[10px] text-gray-400 line-through font-mono">
                                  {fmt(item.price * item.quantity)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            {(item as any).isAudiobook ? (
                              <span className="px-1.5 py-0.5 bg-[#6a7188] text-white text-[9px] font-medium font-mono rounded-[2px] tracking-wide uppercase">
                                Sách nói
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-[#d5e0f8] text-[#586377] text-[9px] font-medium font-mono rounded-[2px] tracking-wide uppercase">
                                Sách giấy
                              </span>
                            )}
                            {item.isPromo && (
                              <span className="px-1.5 py-0.5 bg-[#ffdad6] text-[#ba1a1a] text-[9px] font-medium font-mono rounded-[2px] tracking-wide uppercase">
                                Khuyến mãi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#e0e3e5] pt-4 space-y-2.5 text-[13px]">
                    <div className="flex justify-between items-center text-[#545f73]">
                      <span>Tạm tính</span>
                      <span className="font-semibold font-mono text-[#191c1e]">
                        {fmt(totalAmount)}
                      </span>
                    </div>
                    {!onlyAudiobooks && (
                      <div className="flex justify-between items-center text-[#545f73]">
                        <span>Phí vận chuyển</span>
                        <span className="font-semibold font-mono text-[#191c1e]">
                          {calculatingFee ? (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-[#b70011] border-t-transparent rounded-full animate-spin" />
                          ) : shippingFee === 0 ? (
                            "Miễn phí"
                          ) : (
                            fmt(shippingFee)
                          )}
                        </span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-[#166534] font-medium">
                        <span>Giảm giá sách</span>
                        <span className="font-mono">-{fmt(discount)}</span>
                      </div>
                    )}
                    {appliedVoucher && (
                      <div className="flex justify-between items-center text-[#166534] font-medium">
                        <span>Voucher ({appliedVoucher.code})</span>
                        <span className="font-mono">-{fmt(appliedVoucher.discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#e0e3e5] pt-4 mt-2 flex justify-between items-baseline">
                      <span className="font-bold text-[14px] text-[#191c1e]">Tổng thanh toán</span>
                      <span className="text-[22px] font-extrabold text-[#b70011] font-mono">
                        {fmt(Math.max(0, finalAmount))}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 bg-[#b70011] hover:bg-[#b70011]/90 text-white font-bold rounded-[2px] transition-all shadow-sm active:scale-[0.99] uppercase tracking-wider text-[13px] font-sans disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang xử lý đặt hàng...</span>
                        </>
                      ) : (
                        "Xác nhận đặt hàng"
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-1.5 opacity-60 text-[10px] text-[#545f73] font-mono">
                      <span className="material-symbols-outlined text-[13px]">lock</span>
                      <span>Secure SSL Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 border rounded-[2px] shadow-md max-w-sm animate-fade-in flex items-center gap-3 font-mono text-[12px] ${
            toast.type === "success"
              ? "bg-white border-[#586377] text-[#191c1e]"
              : "bg-white border-[#ba1a1a] text-[#ba1a1a]"
          }`}
        >
          <span className="material-symbols-outlined text-[16px] text-inherit">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <Footer />
    </>
  );
}