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
    <div
      style={{
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        fontFamily: 'DM Sans, sans-serif',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#9ca3af',
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          fontFamily: 'DM Mono, monospace',
          color: valueColor ?? '#111827',
          lineHeight: 1,
          marginBottom: sub || delta ? 8 : 0,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>
      )}
      {delta && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: deltaDir === 'up' ? '#ef4444' : '#22c55e',
            marginTop: 2,
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}