interface Props {
  pct: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({ pct, color = '#6366f1', height = 6 }: Props) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div
      style={{
        width: '100%',
        height,
        background: '#f3f4f6',
        borderRadius: height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clamped}%`,
          background: color,
          borderRadius: height,
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </div>
  );
}