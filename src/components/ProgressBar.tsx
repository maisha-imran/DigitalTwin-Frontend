interface Props {
  pct: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({ pct, color = 'var(--accent)', height = 6 }: Props) {
  return (
    <div className="rounded-full overflow-hidden w-full" style={{ background: 'var(--bg3)', height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}
