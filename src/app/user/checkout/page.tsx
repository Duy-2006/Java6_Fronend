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
  const [flashSaleMap, setFlashSaleMap] = useState<Map<number, number>>(new Map());

  const [form, setForm] = useState<FormState>({
    customerName: "", customerPhone: "", email: "",
    customerAddress: "", paymentMethod: "COD",
  });
  const [errors, setErrors] = useState<FormErrors>({});

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
            map.set(book.id, finalPrice);
            console.log(`  - Mapped bookId ${book.id} -> discountPrice ${finalPrice}`);
          }
        });
        setFlashSaleMap(map);
      } catch (err) { console.error("Flash sale fetch error:", err); }
    };
    fetchFlashSale();
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
        setShippingFee(data.shippingFee || 0);
        setDiscount(data.discount || 0);
      } catch (error: any) {
        alert(error.message);
        router.push("/user/cart");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [router]);

  // 3. Tính toán giá khuyến mãi và tổng tiền (dùng useMemo)
  const { displayItems, totalAmount, finalAmount } = useMemo(() => {
    if (rawCartDetails.length === 0) return { displayItems: [], totalAmount: 0, finalAmount: 0 };
    console.log("🔍 [DEBUG] rawCartDetails:", rawCartDetails);
    console.log("🔍 [DEBUG] flashSaleMap (size):", flashSaleMap.size);
    let total = 0;
    const items = rawCartDetails.map(item => {
      const discounted = flashSaleMap.get(item.bookId);
      console.log(`  - bookId=${item.bookId}, discounted=${discounted}, original=${item.price}`);
      const effectivePrice = discounted && discounted < item.price ? discounted : item.price;
      const itemTotal = effectivePrice * item.quantity;
      total += itemTotal;
      return { ...item, displayPrice: effectivePrice, displayTotal: itemTotal };
    });
    const final = total + shippingFee - discount;
    console.log("🔍 [DEBUG] Calculated totalAmount:", total, "finalAmount:", final);
    return { displayItems: items, totalAmount: total, finalAmount: final };
  }, [rawCartDetails, flashSaleMap, shippingFee, discount]);

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Địa chỉ giao hàng *</label>
                    <textarea className={`w-full px-4 py-3 rounded-xl border outline-none text-sm min-h-[100px] resize-none ${errors.customerAddress ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-red-600"}`} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..." value={form.customerAddress} onChange={e => set("customerAddress", e.target.value)} />
                    {errors.customerAddress && <p className="text-red-500 text-xs mt-1">{errors.customerAddress}</p>}
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
                        <p className="font-bold leading-tight text-sm line-clamp-2">{item.title}</p>
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

              {/* Tổng kết */}
              <section className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">Thông tin thanh toán</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Tạm tính</span><span>{fmt(totalAmount)} đ</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phí vận chuyển</span><span>{shippingFee === 0 ? "Miễn phí" : fmt(shippingFee) + " đ"}</span></div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{fmt(discount)} đ</span></div>}
                  <div className="border-t pt-3 flex justify-between font-extrabold text-xl"><span>Tổng thanh toán</span><span className="text-red-600">{fmt(finalAmount)} đ</span></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full mt-6 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50">XÁC NHẬN ĐẶT HÀNG</button>
              </section>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}