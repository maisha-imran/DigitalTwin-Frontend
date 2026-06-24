type View = 'dashboard' | 'map' | 'evaluation' | 'maintenance' | 'forecast' | 'budget';

interface NavItem {
  id: View;
  label: string;
  shortLabel: string;
  icon: JSX.Element;
}

const s = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
    <path d={d} />
  </svg>
);

const NAV: NavItem[] = [
  {
    id: 'dashboard', label: 'Dashboard', shortLabel: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  { id: 'map',         label: 'Map',         shortLabel: 'Map',     icon: s('M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z') },
  { id: 'evaluation',  label: 'Evaluation',  shortLabel: 'Eval',    icon: s('M22 12 18 12 15 21 9 3 6 12 2 12') },
  { id: 'maintenance', label: 'Maintenance', shortLabel: 'Repairs', icon: s('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z') },
  { id: 'forecast',    label: 'Forecast',    shortLabel: 'Trends',  icon: s('M3 17 9 11 13 15 21 7M14 7h7v7') },
  { id: 'budget',      label: 'Budget',      shortLabel: 'Budget',  icon: s('M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2') },
];

interface Props {
  active: View;
  onNavigate: (v: View) => void;
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: 64,
        background: '#ffffff',
        borderRight: '1px solid #f0f0f0',
        boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
        gap: 4,
        zIndex: 50,
        fontFamily: 'DM Sans, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 800,
          color: '#fff',
          marginBottom: 20,
          boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          flexShrink: 0,
          letterSpacing: '-0.02em',
        }}
      >
        R
      </div>

      {/* Divider */}
      <div style={{ width: 32, height: 1, background: '#f3f4f6', marginBottom: 8 }} />

      {NAV.map(item => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            style={{
              width: 48,
              height: 44,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              border: 'none',
              cursor: 'pointer',
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: isActive ? '#6366f1' : '#9ca3af',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = '#f9fafb';
                (e.currentTarget as HTMLElement).style.color = '#6b7280';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#9ca3af';
              }
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  left: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  background: '#6366f1',
                  borderRadius: '0 3px 3px 0',
                }}
              />
            )}
            {item.icon}
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.01em' }}>{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}

export type { View };