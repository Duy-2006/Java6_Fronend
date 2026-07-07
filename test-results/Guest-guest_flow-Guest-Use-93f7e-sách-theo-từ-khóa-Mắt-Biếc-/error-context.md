# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Guest\guest_flow.spec.ts >> Guest User Flows - Kịch bản Khách vãng lai >> TC_G_02: Tìm kiếm sách theo từ khóa "Mắt Biếc"
- Location: src\tests\Guest\guest_flow.spec.ts:12:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Mắt Biếc')
Expected: visible
Error: strict mode violation: locator('text=Mắt Biếc') resolved to 2 elements:
    1) <p class="font-bold text-sm text-[#191c1e] leading-tight mb-1">Mắt Biếc</p> aka getByText('Mắt Biếc', { exact: true })
    2) <h1 class="font-extrabold text-[40px] md:text-[54px] lg:text-[60px] leading-tight text-white mb-6 font-headline-lg tracking-tighter">…</h1> aka getByRole('heading', { name: 'Mắt Biếc: Eternal Memory' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Mắt Biếc')
    5 × locator resolved to <p class="font-bold text-sm text-[#191c1e] leading-tight mb-1">Mắt Biếc</p>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - text: SĂN DEAL HÈ RỰC RỠ - GIẢM ĐẾN 50% TOÀN BỘ SÁCH NÓI.
      - link "XEM NGAY" [ref=e4] [cursor=pointer]:
        - /url: "#"
    - navigation [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "Bibliora" [ref=e8] [cursor=pointer]:
            - /url: /
            - generic [ref=e9]: Bibliora
          - button "Danh mục expand_more" [ref=e12]:
            - text: Danh mục
            - generic [ref=e13]: expand_more
        - generic [ref=e15]:
          - generic [ref=e16]: search
          - textbox "Tìm kiếm sách, tác giả..." [ref=e17]
          - button "photo_camera" [ref=e18]:
            - generic [ref=e19]: photo_camera
        - generic [ref=e20]:
          - button "shopping_cart" [ref=e21]:
            - generic [ref=e22]: shopping_cart
          - link "login Đăng nhập" [ref=e23] [cursor=pointer]:
            - /url: /auth/login
            - generic [ref=e24]: login
            - text: Đăng nhập
    - main [ref=e25]:
      - generic [ref=e27]:
        - img "Mắt Biếc" [ref=e28]
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]: Sách Mới Nhất
            - generic [ref=e33]: Bestseller
          - 'heading "Mắt Biếc: Eternal Memory" [level=1] [ref=e34]'
          - paragraph [ref=e35]: Đắm chìm trong tuyệt tác của Nguyễn Nhật Ánh qua định dạng sách nói chất lượng cao, với âm hưởng điện ảnh và giọng đọc đầy cảm xúc.
          - generic [ref=e36]:
            - link "play_circle Nghe Thử Ngay" [ref=e37] [cursor=pointer]:
              - /url: /user/books/1016/audiobook
              - generic [ref=e38]: play_circle
              - text: Nghe Thử Ngay
            - link "Xem Chi Tiết" [ref=e39] [cursor=pointer]:
              - /url: /user/books/1016
      - generic [ref=e46]:
        - link "Vavanhoatrongnuoc Vavanhoatrongnuoc" [ref=e47] [cursor=pointer]:
          - /url: /user/category/1
          - img "Vavanhoatrongnuoc" [ref=e49]
          - generic [ref=e50]: Vavanhoatrongnuoc
        - link "Kỹ năng sống & Phát triển bản thân Kỹ năng sống & Phát triển bản thân" [ref=e51] [cursor=pointer]:
          - /url: /user/category/2
          - img "Kỹ năng sống & Phát triển bản thân" [ref=e53]
          - generic [ref=e54]: Kỹ năng sống & Phát triển bản thân
        - link "Văn học Nước Ngoài Văn học Nước Ngoài" [ref=e55] [cursor=pointer]:
          - /url: /user/category/3
          - img "Văn học Nước Ngoài" [ref=e57]
          - generic [ref=e58]: Văn học Nước Ngoài
        - link "Thiếu nhi Thiếu nhi" [ref=e59] [cursor=pointer]:
          - /url: /user/category/4
          - img "Thiếu nhi" [ref=e61]
          - generic [ref=e62]: Thiếu nhi
      - generic [ref=e64]:
        - generic [ref=e65]:
          - heading "Bán Chạy Nhất" [level=2] [ref=e67]
          - link "Xem tất cả arrow_forward" [ref=e69] [cursor=pointer]:
            - /url: /user/catalog
            - text: Xem tất cả
            - generic [ref=e70]: arrow_forward
        - generic [ref=e71]:
          - generic [ref=e72]:
            - link "Ký Ức Theo Dòng Đời book Sách giấy headphones Sách nói play_arrow" [ref=e73] [cursor=pointer]:
              - /url: /user/books/2
              - img "Ký Ức Theo Dòng Đời" [ref=e74]
              - generic [ref=e75]:
                - generic [ref=e76]:
                  - generic [ref=e77]: book
                  - text: Sách giấy
                - generic [ref=e78]:
                  - generic [ref=e79]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e80]:
                - generic [ref=e81]: play_arrow
            - generic [ref=e82]:
              - generic [ref=e83]:
                - link "Ký Ức Theo Dòng Đời" [ref=e84] [cursor=pointer]:
                  - /url: /user/books/2
                  - heading "Ký Ức Theo Dòng Đời" [level=3] [ref=e85]
                - paragraph [ref=e86]: Nguyễn Nhật Ánh
                - generic [ref=e87]:
                  - generic [ref=e88]: star
                  - generic [ref=e89]: "4.8"
                  - generic [ref=e90]: (29)
              - generic [ref=e91]:
                - generic [ref=e92]:
                  - generic [ref=e93]:
                    - generic [ref=e94]: "Sách giấy:"
                    - generic [ref=e95]: 140.000 ₫
                  - generic [ref=e96]:
                    - generic [ref=e97]: "Sách nói:"
                    - generic [ref=e98]: 0 ₫
                - generic [ref=e99]:
                  - generic [ref=e101]: Đã bán 2
                  - button "add_shopping_cart" [ref=e102]:
                    - generic [ref=e103]: add_shopping_cart
          - generic [ref=e104]:
            - link "Cách Sống book Sách giấy headphones Sách nói play_arrow" [ref=e105] [cursor=pointer]:
              - /url: /user/books/3
              - img "Cách Sống" [ref=e106]
              - generic [ref=e107]:
                - generic [ref=e108]:
                  - generic [ref=e109]: book
                  - text: Sách giấy
                - generic [ref=e110]:
                  - generic [ref=e111]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e112]:
                - generic [ref=e113]: play_arrow
            - generic [ref=e114]:
              - generic [ref=e115]:
                - link "Cách Sống" [ref=e116] [cursor=pointer]:
                  - /url: /user/books/3
                  - heading "Cách Sống" [level=3] [ref=e117]
                - paragraph [ref=e118]: Dale Carnegie
                - generic [ref=e119]:
                  - generic [ref=e120]: star
                  - generic [ref=e121]: "4.8"
                  - generic [ref=e122]: (36)
              - generic [ref=e123]:
                - generic [ref=e124]:
                  - generic [ref=e125]:
                    - generic [ref=e126]: "Sách giấy:"
                    - generic [ref=e127]: 99.000 ₫
                  - generic [ref=e128]:
                    - generic [ref=e129]: "Sách nói:"
                    - generic [ref=e130]: 0 ₫
                - generic [ref=e131]:
                  - generic [ref=e133]: Đã bán 1
                  - button "add_shopping_cart" [ref=e134]:
                    - generic [ref=e135]: add_shopping_cart
      - generic [ref=e137]:
        - heading "Sách Mới Cập Nhật" [level=2] [ref=e140]
        - generic [ref=e142]:
          - generic [ref=e143]:
            - link "Thuyết Phục Không Ép Buộc book Sách giấy headphones Sách nói play_arrow" [ref=e144] [cursor=pointer]:
              - /url: /user/books/1
              - img "Thuyết Phục Không Ép Buộc" [ref=e145]
              - generic [ref=e146]:
                - generic [ref=e147]:
                  - generic [ref=e148]: book
                  - text: Sách giấy
                - generic [ref=e149]:
                  - generic [ref=e150]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e151]:
                - generic [ref=e152]: play_arrow
            - generic [ref=e153]:
              - generic [ref=e154]:
                - link "Thuyết Phục Không Ép Buộc" [ref=e155] [cursor=pointer]:
                  - /url: /user/books/1
                  - heading "Thuyết Phục Không Ép Buộc" [level=3] [ref=e156]
                - paragraph [ref=e157]: Dale Carnegie
                - generic [ref=e158]:
                  - generic [ref=e159]: star
                  - generic [ref=e160]: "4.8"
                  - generic [ref=e161]: (22)
              - generic [ref=e162]:
                - generic [ref=e163]:
                  - generic [ref=e164]:
                    - generic [ref=e165]: "Sách giấy:"
                    - generic [ref=e166]: 125.000 ₫
                  - generic [ref=e167]:
                    - generic [ref=e168]: "Sách nói:"
                    - generic [ref=e169]: 0 ₫
                - generic [ref=e170]:
                  - generic [ref=e172]: Đã bán 0
                  - button "add_shopping_cart" [ref=e173]:
                    - generic [ref=e174]: add_shopping_cart
          - generic [ref=e175]:
            - link "Ký Ức Theo Dòng Đời book Sách giấy headphones Sách nói play_arrow" [ref=e176] [cursor=pointer]:
              - /url: /user/books/2
              - img "Ký Ức Theo Dòng Đời" [ref=e177]
              - generic [ref=e178]:
                - generic [ref=e179]:
                  - generic [ref=e180]: book
                  - text: Sách giấy
                - generic [ref=e181]:
                  - generic [ref=e182]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e183]:
                - generic [ref=e184]: play_arrow
            - generic [ref=e185]:
              - generic [ref=e186]:
                - link "Ký Ức Theo Dòng Đời" [ref=e187] [cursor=pointer]:
                  - /url: /user/books/2
                  - heading "Ký Ức Theo Dòng Đời" [level=3] [ref=e188]
                - paragraph [ref=e189]: Nguyễn Nhật Ánh
                - generic [ref=e190]:
                  - generic [ref=e191]: star
                  - generic [ref=e192]: "4.8"
                  - generic [ref=e193]: (29)
              - generic [ref=e194]:
                - generic [ref=e195]:
                  - generic [ref=e196]:
                    - generic [ref=e197]: "Sách giấy:"
                    - generic [ref=e198]: 140.000 ₫
                  - generic [ref=e199]:
                    - generic [ref=e200]: "Sách nói:"
                    - generic [ref=e201]: 0 ₫
                - generic [ref=e202]:
                  - generic [ref=e204]: Đã bán 2
                  - button "add_shopping_cart" [ref=e205]:
                    - generic [ref=e206]: add_shopping_cart
          - generic [ref=e207]:
            - link "Cách Sống book Sách giấy headphones Sách nói play_arrow" [ref=e208] [cursor=pointer]:
              - /url: /user/books/3
              - img "Cách Sống" [ref=e209]
              - generic [ref=e210]:
                - generic [ref=e211]:
                  - generic [ref=e212]: book
                  - text: Sách giấy
                - generic [ref=e213]:
                  - generic [ref=e214]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e215]:
                - generic [ref=e216]: play_arrow
            - generic [ref=e217]:
              - generic [ref=e218]:
                - link "Cách Sống" [ref=e219] [cursor=pointer]:
                  - /url: /user/books/3
                  - heading "Cách Sống" [level=3] [ref=e220]
                - paragraph [ref=e221]: Dale Carnegie
                - generic [ref=e222]:
                  - generic [ref=e223]: star
                  - generic [ref=e224]: "4.8"
                  - generic [ref=e225]: (36)
              - generic [ref=e226]:
                - generic [ref=e227]:
                  - generic [ref=e228]:
                    - generic [ref=e229]: "Sách giấy:"
                    - generic [ref=e230]: 99.000 ₫
                  - generic [ref=e231]:
                    - generic [ref=e232]: "Sách nói:"
                    - generic [ref=e233]: 0 ₫
                - generic [ref=e234]:
                  - generic [ref=e236]: Đã bán 1
                  - button "add_shopping_cart" [ref=e237]:
                    - generic [ref=e238]: add_shopping_cart
          - generic [ref=e239]:
            - link "Khi Mọi Điều Không Như Ý book Sách giấy headphones Sách nói play_arrow" [ref=e240] [cursor=pointer]:
              - /url: /user/books/4
              - img "Khi Mọi Điều Không Như Ý" [ref=e241]
              - generic [ref=e242]:
                - generic [ref=e243]:
                  - generic [ref=e244]: book
                  - text: Sách giấy
                - generic [ref=e245]:
                  - generic [ref=e246]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e247]:
                - generic [ref=e248]: play_arrow
            - generic [ref=e249]:
              - generic [ref=e250]:
                - link "Khi Mọi Điều Không Như Ý" [ref=e251] [cursor=pointer]:
                  - /url: /user/books/4
                  - heading "Khi Mọi Điều Không Như Ý" [level=3] [ref=e252]
                - paragraph [ref=e253]: Haruki Murakami
                - generic [ref=e254]:
                  - generic [ref=e255]: star
                  - generic [ref=e256]: "4.8"
                  - generic [ref=e257]: (43)
              - generic [ref=e258]:
                - generic [ref=e259]:
                  - generic [ref=e260]:
                    - generic [ref=e261]: "Sách giấy:"
                    - generic [ref=e262]: 115.000 ₫
                  - generic [ref=e263]:
                    - generic [ref=e264]: "Sách nói:"
                    - generic [ref=e265]: 0 ₫
                - generic [ref=e266]:
                  - generic [ref=e268]: Đã bán 0
                  - button "add_shopping_cart" [ref=e269]:
                    - generic [ref=e270]: add_shopping_cart
          - generic [ref=e271]:
            - link "Gian Truân Chỉ Là Thử Thách book Sách giấy headphones Sách nói play_arrow" [ref=e272] [cursor=pointer]:
              - /url: /user/books/5
              - img "Gian Truân Chỉ Là Thử Thách" [ref=e273]
              - generic [ref=e274]:
                - generic [ref=e275]:
                  - generic [ref=e276]: book
                  - text: Sách giấy
                - generic [ref=e277]:
                  - generic [ref=e278]: headphones
                  - text: Sách nói
              - button "play_arrow" [ref=e279]:
                - generic [ref=e280]: play_arrow
            - generic [ref=e281]:
              - generic [ref=e282]:
                - link "Gian Truân Chỉ Là Thử Thách" [ref=e283] [cursor=pointer]:
                  - /url: /user/books/5
                  - heading "Gian Truân Chỉ Là Thử Thách" [level=3] [ref=e284]
                - paragraph [ref=e285]: Tô Hoài
                - generic [ref=e286]:
                  - generic [ref=e287]: star
                  - generic [ref=e288]: "4.8"
                  - generic [ref=e289]: (50)
              - generic [ref=e290]:
                - generic [ref=e291]:
                  - generic [ref=e292]:
                    - generic [ref=e293]: "Sách giấy:"
                    - generic [ref=e294]: 168.000 ₫
                  - generic [ref=e295]:
                    - generic [ref=e296]: "Sách nói:"
                    - generic [ref=e297]: 0 ₫
                - generic [ref=e298]:
                  - generic [ref=e300]: Đã bán 0
                  - button "add_shopping_cart" [ref=e301]:
                    - generic [ref=e302]: add_shopping_cart
    - contentinfo [ref=e303]:
      - generic [ref=e305]:
        - generic [ref=e306]:
          - generic [ref=e307]: mail
          - text: ĐĂNG KÝ NHẬN BẢN TIN
        - generic [ref=e309]:
          - textbox "Nhập địa chỉ email của bạn" [ref=e310]
          - button "Đăng ký" [ref=e311]
      - generic [ref=e312]:
        - generic [ref=e313]:
          - generic [ref=e314]:
            - paragraph [ref=e315]:
              - text: Lầu 5, 387-389 Hai Bà Trưng Quận 3 TP HCM
              - text: Công Ty Cổ Phần Phát Hành Sách TP HCM
              - text: 60 - 62 Lê Lợi, Quận 1, TP. HCM, Việt Nam
            - paragraph [ref=e316]: Nhận đặt hàng trực tuyến và giao hàng tận nơi. KHÔNG hỗ trợ đặt mua và nhận hàng trực tiếp tại văn phòng.
          - generic [ref=e317]:
            - heading "DỊCH VỤ" [level=4] [ref=e318]
            - list [ref=e319]:
              - listitem [ref=e320]:
                - link "Điều khoản sử dụng" [ref=e321] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e322]:
                - link "Chính sách bảo mật thông tin cá nhân" [ref=e323] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e324]:
                - link "Chính sách bảo mật thanh toán" [ref=e325] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e326]:
                - link "Giới thiệu BookStore" [ref=e327] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e328]:
                - link "Hệ thống nhà sách" [ref=e329] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e330]:
            - heading "HỖ TRỢ" [level=4] [ref=e331]
            - list [ref=e332]:
              - listitem [ref=e333]:
                - link "Chính sách đổi - trả - hoàn tiền" [ref=e334] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e335]:
                - link "Chính sách bảo hành - bồi hoàn" [ref=e336] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e337]:
                - link "Chính sách vận chuyển" [ref=e338] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e339]:
                - link "Chính sách khách sỉ" [ref=e340] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e341]:
                - link "Phương thức thanh toán" [ref=e342] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e343]:
            - heading "TÀI KHOẢN CỦA TÔI" [level=4] [ref=e344]
            - list [ref=e345]:
              - listitem [ref=e346]:
                - link "Đăng nhập / Tạo mới tài khoản" [ref=e347] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e348]:
                - link "Thay đổi địa chỉ khách hàng" [ref=e349] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e350]:
                - link "Chi tiết tài khoản" [ref=e351] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e352]:
                - link "Lịch sử mua hàng" [ref=e353] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e354]:
            - generic [ref=e355]:
              - heading "LIÊN HỆ" [level=4] [ref=e356]
              - paragraph [ref=e357]:
                - generic [ref=e358]: location_on
                - text: 60-62 Lê Lợi, Q.1, TP. HCM
              - paragraph [ref=e359]:
                - generic [ref=e360]: mail
                - text: cskh@bookstore.com.vn
              - paragraph [ref=e361]:
                - generic [ref=e362]: call
                - text: 1900 636 467
            - generic [ref=e363]:
              - heading "MẠNG XÃ HỘI" [level=4] [ref=e364]
              - generic [ref=e365]:
                - link "f" [ref=e366] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e367]: f
                - link "i" [ref=e368] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e369]: i
                - link "y" [ref=e370] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e371]: "y"
                - link "t" [ref=e372] [cursor=pointer]:
                  - /url: "#"
                  - generic [ref=e373]: t
        - generic [ref=e374]:
          - generic [ref=e375]:
            - generic [ref=e376]: Giao Hàng Nhanh
            - generic [ref=e377]: Viettel Post
            - generic [ref=e378]: VNPost
            - generic [ref=e379]: Ninja Van
          - generic [ref=e380]:
            - generic [ref=e381]: VNPAY
            - generic [ref=e382]: ZaloPay
            - generic [ref=e383]: Momo
            - generic [ref=e384]: ShopeePay
        - paragraph [ref=e386]: © 2026 BookStore Online. All Rights Reserved.
  - button "Open Next.js Dev Tools" [ref=e392] [cursor=pointer]:
    - generic [ref=e395]:
      - text: Rendering
      - generic [ref=e396]:
        - generic [ref=e397]: .
        - generic [ref=e398]: .
        - generic [ref=e399]: .
  - alert [ref=e400]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Guest User Flows - Kịch bản Khách vãng lai', () => {
  4  | 
  5  |     // TC_G_01: Xem trang chủ
  6  |     test('TC_G_01: Xem trang chủ hiển thị danh sách sách', async ({ page }) => {
  7  |         await page.goto('/');
  8  |         await expect(page.locator('.book-list')).toBeVisible(); // Thay .book-list bằng class thực tế của bạn
  9  |     });
  10 | 
  11 |     // TC_G_02: Tìm kiếm sách
  12 |     test('TC_G_02: Tìm kiếm sách theo từ khóa "Mắt Biếc"', async ({ page }) => {
  13 |         await page.goto('/');
  14 |         await page.fill('input[placeholder="Tìm kiếm sách, tác giả..."]', 'Mắt Biếc');
  15 |         await page.press('input[placeholder="Tìm kiếm sách, tác giả..."]', 'Enter');
> 16 |         await expect(page.locator('text=Mắt Biếc')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  17 |     });
  18 | 
  19 |     // TC_G_03: Xem chi tiết
  20 |     test('TC_G_03: Xem chi tiết thông tin sách', async ({ page }) => {
  21 |         await page.goto('/');
  22 |         await page.click('.book-item >> nth=0'); // Click vào cuốn sách đầu tiên
  23 |         await expect(page.locator('.book-details')).toBeVisible();
  24 |     });
  25 | 
  26 |     // TC_G_04: Giỏ hàng
  27 |     test('TC_G_04: Thêm sách vào giỏ hàng', async ({ page }) => {
  28 |         await page.goto('/book/details/1'); // Cần vào trang chi tiết trước
  29 |         await page.click('button:has-text("Thêm vào giỏ")');
  30 |         // Mong đợi: Hệ thống yêu cầu đăng nhập (theo ghi chú Fail trong Excel của bạn)
  31 |         await expect(page.locator('text=Vui lòng đăng nhập')).toBeVisible();
  32 |     });
  33 | 
  34 |     // TC_G_05: Thanh toán
  35 |     test('TC_G_05: Thanh toán khi chưa đăng nhập', async ({ page }) => {
  36 |         await page.goto('/cart');
  37 |         await page.click('button:has-text("Thanh toán")');
  38 |         await expect(page.locator('text=Vui lòng đăng nhập')).toBeVisible();
  39 |     });
  40 | });
```