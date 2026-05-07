import { ReactNode } from 'react';

interface Props {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClass?: string;
  noPad?: boolean;
}

export default function Panel({ title, badge, children, className = '', bodyClass = '', noPad }: Props) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text2)' }}>{title}</span>
        {badge && <span>{badge}</span>}
      </div>
      <div className={noPad ? '' : `p-4 ${bodyClass}`}>{children}</div>
    </div>
  );
}
