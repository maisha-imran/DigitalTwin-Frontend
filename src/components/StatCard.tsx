interface Props {
  label: string;
  value: string | number;
  sub?: string;
  delta?: string;
  deltaDir?: 'up' | 'down';
  valueColor?: string;
}

export default function StatCard({ label, value, sub, delta, deltaDir, valueColor }: Props) {
  return (
    <div className="rounded-xl border p-4 fade-up" style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}>
      <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-2xl font-semibold font-mono leading-none" style={{ color: valueColor ?? 'var(--text)' }}>{value}</div>
      {sub && <div className="text-[11px] mt-1.5" style={{ color: 'var(--text3)' }}>{sub}</div>}
      {delta && (
        <div className="text-[11px] mt-1" style={{ color: deltaDir === 'up' ? 'var(--danger)' : 'var(--accent2)' }}>{delta}</div>
      )}
    </div>
  );
}
