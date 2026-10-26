export type HonestyStatus = "BUILT" | "SIMULATED" | "PROPOSED" | "ESTIMATE" | "PLACEHOLDER";

export function HonestyPill({
  status,
  className = "",
  size = "md",
}: {
  status: HonestyStatus | string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const norm = String(status).toUpperCase();
  const base = "inline-flex items-center font-mono uppercase font-bold tracking-wider rounded border";
  
  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[8px] leading-tight",
    md: "px-2 py-0.5 text-[9px] leading-tight",
    lg: "px-2.5 py-1 text-[10px] leading-tight",
  }[size];

  const statusStyles: Record<string, string> = {
    BUILT: "bg-[#eaf4ee] text-[#1b4332] border-[#b7d6c3]",
    SIMULATED: "bg-[#fff8ea] text-[#9a5b00] border-[#f1d89e]",
    PROPOSED: "bg-[#edf3f9] text-[#1f4e79] border-[#c0d4e8]",
    ESTIMATE: "bg-[#eef8f6] text-[#0d6e5e] border-[#b2e2d9]",
    PLACEHOLDER: "bg-[#f3f4f6] text-[#4b5563] border-[#d1d5db]",
  };

  const style = statusStyles[norm] ?? statusStyles.PLACEHOLDER;

  return (
    <span className={`${base} ${sizeStyles} ${style} ${className}`} aria-label={`Status: ${norm}`}>
      {norm}
    </span>
  );
}
