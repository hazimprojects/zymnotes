import { DARK, LIGHT } from '../tokens';
import { IconMoon, IconSun } from './Icons';

const TAB_TITLES = { home: 'Utama', notes: 'Nota', about: 'Tentang' };

export default function AppHeader({ tab, dark, setDark }) {
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: 52,
      background: t.headerBg, borderBottom: `1px solid ${t.line}`,
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 10,
          background: 'linear-gradient(135deg,#4F46E5,#818CF8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', fontWeight: 800,
        }}>Z</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.ink, lineHeight: 1.1 }}>ZymNotes</div>
          <div style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>{TAB_TITLES[tab]}</div>
        </div>
      </div>
      <button
        onClick={() => setDark(!dark)}
        style={{
          width: 34, height: 34, borderRadius: 10, border: `1px solid ${t.lineStrong}`,
          background: t.paperSoft, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {dark ? <IconSun color={t.muted} /> : <IconMoon color={t.muted} />}
      </button>
    </div>
  );
}
