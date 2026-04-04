export default function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="d-flex align-items-center gap-1 mt-1" style={{ color: "#c0392b", fontSize: "0.78rem", fontWeight: 500 }}>
      <i className="fa-solid fa-circle-exclamation" style={{ fontSize: "0.75rem" }} />
      <span>{msg}</span>
    </div>
  );
}