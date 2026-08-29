type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({
  title = "เชื่อมต่อฐานข้อมูลไม่ได้",
  message,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
      <h2 className="text-base font-black text-rose-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-rose-700">{message}</p>
    </div>
  );
}
