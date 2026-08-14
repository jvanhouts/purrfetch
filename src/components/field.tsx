/** An input that stays exactly as wide as its content, so the readout keeps its shape. */
export function Field({
  value,
  onChange,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      className={`w-auto rounded-md bg-transparent px-1 outline-none transition-colors hover:bg-white/6 focus:bg-white/10 focus:ring-1 focus:ring-cyan/40 ${className ?? ""}`}
      onChange={(event) => onChange(event.target.value)}
      size={Math.max(value.length, 1)}
      spellCheck={false}
      value={value}
    />
  );
}
