type View = 'dashboard' | 'map' | 'evaluation' | 'maintenance' | 'forecast' | 'budget';

interface NavItem {
  id: View;
  label: string;
  icon: JSX.Element;
}

const s = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  { id: 'map', label: 'Map', icon: s('M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z') },
  { id: 'evaluation', label: 'Evaluation', icon: s('M22 12 18 12 15 21 9 3 6 12 2 12') },
  { id: 'maintenance', label: 'Maintenance', icon: s('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z') },
  { id: 'forecast', label: 'Forecast', icon: s('M3 17 9 11 13 15 21 7M14 7h7v7') },
  { id: 'budget', label: 'Budget', icon: s('M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2') },
];

interface Props {
  active: View;
  onNavigate: (v: View) => void;
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <nav
      className="fixed top-0 left-0 h-screen z-50 flex flex-col items-center py-4 gap-1"
      style={{ width: 56, background: 'var(--bg2)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg mb-5 flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ background: 'var(--accent)' }}>R</div>

      {NAV.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          title={item.label}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0"
          style={{
            background: active === item.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: active === item.id ? 'var(--accent)' : 'var(--text3)',
            border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => { if (active !== item.id) (e.currentTarget as HTMLElement).style.background = 'var(--panel)'; }}
          onMouseLeave={e => { if (active !== item.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}

export type { View };
