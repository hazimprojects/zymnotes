import { DARK, LIGHT } from '../tokens';
import { IconHome, IconBook, IconInfo } from './Icons';

const NAV_ITEMS = [
  { id: 'home', label: 'Utama', Icon: IconHome },
  { id: 'notes', label: 'Nota', Icon: IconBook },
  { id: 'about', label: 'Tentang', Icon: IconInfo },
];

export default function BottomNav({ tab, setTab, dark }) {
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 72, display: 'flex', alignItems: 'center',
      background: t.navBg, borderTop: `1px solid ${t.navBorder}`,
      backdropFilter: 'blur(16px)',
      paddingBottom: 8,
    }}>
      {NAV_ITEMS.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, border: 'none', background: 'none',
              cursor: 'pointer', padding: '8px 0', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => !active && (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ position: 'relative' }}>
              <Icon active={active} color={active ? t.primary : t.muted} />
              {active && (
                <div style={{
                  position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: 999,
                  background: t.primary, marginTop: -8,
                }} />
              )}
            </div>
            <span style={{
              fontSize: 10, fontWeight: active ? 800 : 600,
              color: active ? t.primary : t.muted,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              letterSpacing: '0.02em',
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
