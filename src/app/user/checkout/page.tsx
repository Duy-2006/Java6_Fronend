"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isBlank, isValidEmail } from "@/services/validation";

interface CartDetail { bookId: number; title: string; imageUrl: string; quantity: number; itemTotal: number }
interface FormState { customerName: string; customerPhone: string; email: string; customerAddress: string; paymentMethod: string }
type FormErrors = Partial<Record<keyof FormState, string>>;

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (isBlank(f.customerName))                                   e.customerName    = "Họ và tên không được để trống.";
  if (isBlank(f.customerPhone))                                  e.customerPhone   = "Số điện thoại không được để trống.";
  else if (!/^(0|\+84)[0-9]{8,10}$/.test(f.customerPhone.trim())) e.customerPhone = "Số điện thoại không hợp lệ.";
  if (f.email.trim() && !isValidEmail(f.email))                  e.email           = "Email không đúng định dạng.";
  if (isBlank(f.customerAddress))                                e.customerAddress = "Địa chỉ không được để trống.";
  return e;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartDetails, setCartDetails] = useState<CartDetail[]>([]);
  const [totalAmount,  setTotalAmount]  = useState(0);
  const [shippingFee,  setShippingFee]  = useState(0);
  const [discount,     setDiscount]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    customerName: "", customerPhone: "", email: "",
    customerAddress: "", paymentMethod: "COD",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout/preview`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setCartDetails(data.cartDetails ?? []);
        setTotalAmount(data.totalAmount ?? 0);
        setShippingFee(data.shippingFee ?? 0);
        setDiscount(data.discount ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof FormState, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/orders/${data.orderId}?success=true`);
      } else {
        alert("Đặt hàng thất bại. Vui lòng thử lại.");
      }
    } catch { alert("Lỗi kết nối."); }
    finally { setSubmitting(false); }
  };

  const finalAmount = totalAmount + shippingFee - discount;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-40 font-display text-[#222]">

      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[1200px] mx-auto flex items-center px-4 py-4">
          <Link href="/cart" className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition">
            <span className="material-symbols-outlined text-primary">arrow_back_ios_new</span>
          </Link>
          <h2 className="flex-1 text-center text-xl font-extrabold uppercase">Thanh toán</h2>
          <div className="w-10" />
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate>
        <main className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">

            {/* ── Customer info ── */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-extrabold mb-6">📦 Thông tin nhận hàng</h3>
              <div className="space-y-4">

                {([
                  { field: "customerName",    label: "Họ và tên *",        type: "text",  ph: "Nguyễn Văn A" },
                  { field: "customerPhone",   label: "Số điện thoại *",    type: "tel",   ph: "0901 234 567" },
                  { field: "email",           label: "Email (tùy chọn)",   type: "email", ph: "email@example.com" },
                ] as const).map(({ field, label, type, ph }) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
                    <input type={type}
                      className={`w-full h-12 px-4 rounded-xl border outline-none transition text-sm
                        ${errors[field] ? "border-red-400 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-primary focus:shadow-[0_0_0_2px_rgba(201,33,39,0.12)]"}`}
                      placeholder={ph}
                      value={form[field]}
                      onChange={e => set(field, e.target.value)}
                    />
                    {errors[field] && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>{errors[field]}
                      </p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Địa chỉ giao hàng *</label>
                  <textarea
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition text-sm min-h-[100px] resize-none
                      ${errors.customerAddress ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-primary focus:shadow-[0_0_0_2px_rgba(201,33,39,0.12)]"}`}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    value={form.customerAddress}
                    onChange={e => set("customerAddress", e.target.value)}
                  />
                  {errors.customerAddress && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">error</span>{errors.customerAddress}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Order summary ── */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold">🧾 Đơn hàng</h3>
                <span className="text-sm text-gray-500 font-bold">{cartDetails.length} sản phẩm</span>
              </div>

              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {cartDetails.map((item, i) => (
                  <div key={i} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                    <img
                      src={item.imageUrl ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${item.imageUrl}` : "/images/book-default.jpg"}
                      alt={item.title}
                      className="w-16 h-22 rounded-xl object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).src = "/images/book-default.jpg"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold leading-tight text-sm line-clamp-2">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">SL: {item.quantity}</p>
                      <span className="font-bold text-primary text-sm">{fmt(item.itemTotal)} đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Payment + Total ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 mt-6">

            {/* Payment methods */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-extrabold mb-4">💳 Phương thức thanh toán</h3>
              <div className="space-y-3">
                {[
                  { value: "COD",     label: "Thanh toán khi giao hàng (COD)", icon: "local_shipping" },
                  { value: "BANKING", label: "Chuyển khoản ngân hàng",         icon: "account_balance" },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition
                      ${form.paymentMethod === opt.value ? "border-primary bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name="paymentMethod" value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={e => set("paymentMethod", e.target.value)}
                      className="accent-primary w-4 h-4" />
                    <span className="material-symbols-outlined text-primary text-xl">{opt.icon}</span>
                    <span className="font-medium text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Price summary */}
            <section className="bg-white rounded-2xl shadow-sm p-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính</span>
                  <span>{fmt(totalAmount)} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span>{fmt(shippingFee)} đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{fmt(discount)} đ</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xl pt-4 border-t border-gray-100">
                  <span>Tổng thanh toán</span>
                  <span className="text-primary">{fmt(finalAmount)} đ</span>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Fixed submit bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
          <div className="max-w-[1200px] mx-auto px-4 py-4">
            <button type="submit" disabled={submitting}
              className="w-full bg-primary text-white h-14 rounded-2xl text-lg font-black uppercase
                hover:bg-red-700 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-200">
              {submitting ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}