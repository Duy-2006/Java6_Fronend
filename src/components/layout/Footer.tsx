import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pb-8 text-gray-700">

      {/* Newsletter bar */}
      <div className="bg-[#C92127] py-4 mb-10">
        <div className="max-w-[1230px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white uppercase font-bold text-sm tracking-wider">
            <span className="material-symbols-outlined">mail</span>
            ĐĂNG KÝ NHẬN BẢN TIN
          </div>
          <div className="flex-1 max-w-2xl w-full">
            <form className="flex bg-white rounded-md overflow-hidden p-0.5 shadow-inner">
              <input type="email" placeholder="Nhập địa chỉ email của bạn"
                className="flex-1 px-4 py-2 text-sm outline-none text-gray-800" />
              <button type="submit"
                className="bg-[#F7941E] text-white px-8 py-2 text-sm font-bold uppercase hover:bg-orange-500 transition-colors">
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-[1230px] mx-auto px-4">

        {/* Link grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1 space-y-4 border-r border-gray-100 pr-4">
            <p className="text-[13px] leading-relaxed text-gray-600">
              Lầu 5, 387-389 Hai Bà Trưng Quận 3 TP HCM<br />
              Công Ty Cổ Phần Phát Hành Sách TP HCM<br />
              60 - 62 Lê Lợi, Quận 1, TP. HCM, Việt Nam
            </p>
            <p className="text-[12px] text-gray-400 leading-relaxed italic border-l-2 pl-3 border-gray-100">
              Nhận đặt hàng trực tuyến và giao hàng tận nơi.
              KHÔNG hỗ trợ đặt mua và nhận hàng trực tiếp tại văn phòng.
            </p>
          </div>

          {/* Dịch vụ */}
          <FooterCol title="DỊCH VỤ" links={[
            "Điều khoản sử dụng", "Chính sách bảo mật thông tin cá nhân",
            "Chính sách bảo mật thanh toán", "Giới thiệu BookStore", "Hệ thống nhà sách",
          ]} />

          {/* Hỗ trợ */}
          <FooterCol title="HỖ TRỢ" links={[
            "Chính sách đổi - trả - hoàn tiền", "Chính sách bảo hành - bồi hoàn",
            "Chính sách vận chuyển", "Chính sách khách sỉ", "Phương thức thanh toán",
          ]} />

          {/* Tài khoản */}
          <FooterCol title="TÀI KHOẢN CỦA TÔI" links={[
            "Đăng nhập / Tạo mới tài khoản", "Thay đổi địa chỉ khách hàng",
            "Chi tiết tài khoản", "Lịch sử mua hàng",
          ]} />

          {/* Contact + Social */}
          <div className="space-y-6">
            <div className="space-y-3 border-l pl-4 border-gray-100">
              <h4 className="text-sm font-bold uppercase mb-4 text-gray-800">LIÊN HỆ</h4>
              {[
                { icon: "location_on", text: "60-62 Lê Lợi, Q.1, TP. HCM" },
                { icon: "mail",        text: "cskh@bookstore.com.vn" },
                { icon: "call",        text: "1900 636 467" },
              ].map(item => (
                <p key={item.icon} className="text-[13px] flex items-center gap-2 text-gray-600">
                  <span className="material-symbols-outlined text-sm text-red-500">{item.icon}</span>
                  {item.text}
                </p>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold uppercase mb-4 text-gray-800">MẠNG XÃ HỘI</h4>
              <div className="flex gap-4">
                {["facebook", "instagram", "youtube", "tiktok"].map(name => (
                  <a key={name} href="#"
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center transition">
                    <span className="text-gray-500 text-xs font-bold uppercase">{name[0]}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logistics logos */}
        <div className="py-10 border-t border-gray-100 space-y-6">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
            {["Giao Hàng Nhanh", "Viettel Post", "VNPost", "Ninja Van"].map(name => (
              <div key={name} className="h-8 px-4 bg-gray-100 rounded flex items-center text-xs text-gray-500 font-medium">{name}</div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
            {["VNPAY", "ZaloPay", "Momo", "ShopeePay"].map(name => (
              <div key={name} className="h-6 px-4 bg-gray-100 rounded flex items-center text-xs text-gray-500 font-medium">{name}</div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed italic">
            © 2026 BookStore Online. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-bold uppercase mb-6 text-gray-800">{title}</h4>
      <ul className="space-y-3 text-[13px] text-gray-600">
        {links.map(link => (
          <li key={link}><a href="#" className="hover:text-red-600 transition">{link}</a></li>
        ))}
      </ul>
    </div>
  );
}