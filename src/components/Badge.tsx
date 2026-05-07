import { ReactNode } from 'react';

type Variant = 'blue' | 'green' | 'warn' | 'red' | 'ghost';

const styles: Record<Variant, { background: string; color: string }> = {
  blue:  { background: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  green: { background: 'rgba(34,197,94,0.1)',   color: '#16a34a' },
  warn:  { background: 'rgba(234,179,8,0.1)',   color: '#ca8a04' },
  red:   { background: 'rgba(239,68,68,0.1)',   color: '#dc2626' },
  ghost: { background: '#f3f4f6',               color: '#9ca3af' },
};

interface Props {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Badge({ variant = 'ghost', children, className = '', onClick }: Props) {
  const s = styles[variant];
  return (
    <span
      onClick={onClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: s.background,
        color: s.color,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'DM Sans, sans-serif',
        letterSpacing: '0.01em',
        transition: 'all 0.15s',
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  );
}