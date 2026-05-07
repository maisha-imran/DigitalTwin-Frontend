import { ReactNode } from 'react';

type Variant = 'blue' | 'green' | 'warn' | 'red' | 'ghost';

const styles: Record<Variant, string> = {
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-green-500/15 text-green-400',
  warn: 'bg-yellow-500/15 text-yellow-400',
  red: 'bg-red-500/15 text-red-400',
  ghost: 'bg-white/5 text-[var(--text3)]',
};

interface Props {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Badge({ variant = 'ghost', children, className = '', onClick }: Props) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${styles[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >{children}</span>
  );
}
