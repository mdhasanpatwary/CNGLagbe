"use client";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-primary/10 text-primary-dark border-primary/20",
    CANCELLED: "bg-red-100 text-red-700 border-red-200",
    TIMED_OUT: "bg-amber-100 text-amber-700 border-amber-200",
    PENDING: "bg-blue-100 text-blue-700 border-blue-200",
    ASSIGNED: "bg-blue-50 text-blue-600 border-blue-100",
    ACCEPTED: "bg-blue-50 text-blue-600 border-blue-100",
  };

  const style = styles[status] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full h-6 text-[10px] font-bold border ${style}`}>
      {status}
    </div>
  );
};
