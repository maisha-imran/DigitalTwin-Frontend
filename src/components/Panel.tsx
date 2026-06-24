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
    <div
      className={className}
      style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid #f0f0f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: '#9ca3af',
          }}
        >
          {title}
        </span>
        {badge && <span>{badge}</span>}
      </div>
      <div className={noPad ? '' : bodyClass} style={noPad ? {} : { padding: 20 }}>
        {children}
      </div>
    </div>
  );
}