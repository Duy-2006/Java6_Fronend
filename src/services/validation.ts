/*
 * validation.ts
 * Tap hop cac ham kiem tra (validate) du lieu dau vao cho cac form tren giao dien Admin.
 * Moi thuc the (Author, Category, Book, User, Promotion) co ham validate rieng.
 * Khi nguoi dung nhap du lieu sai, ham tra ve object chua ten truong va thong bao loi tuong ung.
 */

// Kieu du lieu tra ve cua ham validate: object voi key la ten truong, value la thong bao loi
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

// Cac ham kiem tra co ban - dung chung cho nhieu loai form
export const isBlank        = (v?: string | null) => !v || !v.trim();                                          // Kiem tra chuoi rong hoac chi chua khoang trang
export const isValidEmail   = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());                     // Kiem tra dinh dang email hop le
export const isValidPrice   = (v: string | number) => !isNaN(Number(v)) && Number(v) >= 0;                     // Kiem tra gia tien (so khong am)
export const isValidQty     = (v: string | number) => !isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v)); // Kiem tra so luong (so nguyen khong am)
export const isValidPercent = (v: string | number) => !isNaN(Number(v)) && Number(v) > 0 && Number(v) <= 100;  // Kiem tra phan tram (1-100)
export const isValidISBN    = (v: string) => v === "" || /^[\d\-]{10,17}$/.test(v.trim());                     // Kiem tra ma ISBN (10-17 ky tu so va gach ngang)
export const isValidDate    = (v: string) => v !== "" && !isNaN(Date.parse(v));                                 // Kiem tra ngay thang hop le

// Validate du lieu form tac gia (Author)
export interface AuthorFields { name: string; email?: string }
export function validateAuthor(f: AuthorFields): FieldErrors<AuthorFields> {
  const e: FieldErrors<AuthorFields> = {};
  if (isBlank(f.name))                             e.name  = "Tên tác giả không được để trống.";
  else if (f.name.trim().length < 2)               e.name  = "Tên phải có ít nhất 2 ký tự.";
  else if (f.name.trim().length > 100)             e.name  = "Tên không được vượt quá 100 ký tự.";
  if (f.email?.trim() && !isValidEmail(f.email))   e.email = "Email không đúng định dạng.";
  return e;
}

// Validate du lieu form the loai (Category)
export interface CategoryFields { name: string }
export function validateCategory(f: CategoryFields): FieldErrors<CategoryFields> {
  const e: FieldErrors<CategoryFields> = {};
  if (isBlank(f.name))                e.name = "Tên thể loại không được để trống.";
  else if (f.name.trim().length < 2)  e.name = "Tên phải có ít nhất 2 ký tự.";
  else if (f.name.trim().length > 50) e.name = "Tên không được vượt quá 50 ký tự.";
  return e;
}

// Validate du lieu form sach (Book)
export interface BookFields { title: string; isbn?: string; price: string|number; quantity: string|number }
export function validateBook(f: BookFields): FieldErrors<BookFields> {
  const e: FieldErrors<BookFields> = {};
  if (isBlank(f.title))                     e.title    = "Tên sách không được để trống.";
  else if (f.title.trim().length < 2)       e.title    = "Tên sách phải có ít nhất 2 ký tự.";
  else if (f.title.trim().length > 200)     e.title    = "Tên sách không được vượt quá 200 ký tự.";
  if (f.isbn && !isValidISBN(f.isbn))       e.isbn     = "ISBN chỉ gồm số và dấu gạch ngang (10–17 ký tự).";
  if (f.price === "")                        e.price    = "Giá bán không được để trống.";
  else if (!isValidPrice(f.price))           e.price    = "Giá bán phải là số không âm.";
  else if (Number(f.price) > 100_000_000)   e.price    = "Giá bán không hợp lý (tối đa 100 triệu).";
  if (f.quantity === "")                     e.quantity = "Số lượng không được để trống.";
  else if (!isValidQty(f.quantity))          e.quantity = "Số lượng phải là số nguyên không âm.";
  return e;
}

// Validate du lieu form tai khoan nguoi dung (User/Admin)
export interface UserFields { username: string; password?: string; fullname?: string; email?: string; isEdit: boolean }
export function validateUser(f: UserFields): FieldErrors<Omit<UserFields,"isEdit">> {
  const e: FieldErrors<Omit<UserFields,"isEdit">> = {};
  if (isBlank(f.username))                          e.username = "Username không được để trống.";
  else if (f.username.trim().length < 3)            e.username = "Username phải có ít nhất 3 ký tự.";
  else if (f.username.trim().length > 30)           e.username = "Username không được vượt quá 30 ký tự.";
  else if (!/^[a-zA-Z0-9_]+$/.test(f.username))    e.username = "Username chỉ được chứa chữ cái, số và dấu gạch dưới.";
  if (!f.isEdit && isBlank(f.password))             e.password = "Mật khẩu không được để trống.";
  else if (f.password && f.password.length > 0 && f.password.length < 6)
                                                    e.password = "Mật khẩu phải có ít nhất 6 ký tự.";
  if (f.fullname && f.fullname.trim().length > 100) e.fullname = "Họ tên không được vượt quá 100 ký tự.";
  if (f.email?.trim() && !isValidEmail(f.email))   e.email    = "Email không đúng định dạng.";
  return e;
}

// Validate du lieu form khuyen mai (Promotion)
export interface PromotionFields { name: string; discountValue: string|number; startDate: string; endDate: string; applyType: string; selBooks: number; selCats: number; usageLimit?: string|number }
export function validatePromotion(f: PromotionFields): FieldErrors<PromotionFields> {
  const e: FieldErrors<PromotionFields> = {};
  if (isBlank(f.name))                        e.name          = "Tên khuyến mãi không được để trống.";
  else if (f.name.trim().length > 100)        e.name          = "Tên không được vượt quá 100 ký tự.";
  if (f.discountValue === "")                 e.discountValue = "Giá trị giảm không được để trống.";
  else if (!isValidPercent(f.discountValue))  e.discountValue = "Giá trị giảm phải từ 1 đến 100.";
  else if (Number(f.discountValue) > 50)      e.discountValue = "Mức giảm giá tối đa không được vượt quá 50%.";
  if (!isValidDate(f.startDate))             e.startDate     = "Ngày bắt đầu không hợp lệ.";
  if (!isValidDate(f.endDate))               e.endDate       = "Ngày kết thúc không hợp lệ.";
  if (isValidDate(f.startDate) && isValidDate(f.endDate) && new Date(f.endDate) <= new Date(f.startDate))
                                              e.endDate       = "Ngày kết thúc phải sau ngày bắt đầu.";
  if (f.applyType === "BOOK"     && f.selBooks === 0) e.applyType = "Vui lòng chọn ít nhất 1 sách.";
  if (f.applyType === "CATEGORY" && f.selCats  === 0) e.applyType = "Vui lòng chọn ít nhất 1 thể loại.";
  if (f.usageLimit !== undefined && f.usageLimit !== "") {
    if (!isValidQty(f.usageLimit) || Number(f.usageLimit) <= 0) {
      e.usageLimit = "Giới hạn phải là số nguyên lớn hơn 0.";
    }
  }
  return e;
}