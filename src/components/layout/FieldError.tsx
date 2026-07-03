/*
 * FieldError.tsx
 * Component hien thi thong bao loi cho tung truong nhap lieu trong form.
 * Nhan vao prop "msg" (thong bao loi), neu khong co loi thi khong hien thi gi.
 * Dung kem voi cac ham validate trong validation.ts.
 */

export default function FieldError({ msg }: { msg?: string }) {
  // Neu khong co thong bao loi thi khong render gi ca
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1 mt-1 text-[#c0392b] text-[0.78rem] font-medium">
      <i className="fa-solid fa-circle-exclamation text-[0.75rem]" />
      <span>{msg}</span>
    </div>
  );
}