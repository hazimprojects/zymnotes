import { DARK, LIGHT } from '../tokens';
import { BABS } from '../data';
import { IconChevron } from './Icons';

export default function NotesTab({ dark, onOpenBab }) {
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bg, padding: '14px 16px 100px' }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: t.ink, marginBottom: 4 }}>Senarai Nota</div>
        <div style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>Semua bab tersusun mengikut urutan</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {BABS.map(bab => (
          <div
            key={bab.n}
            onClick={() => onOpenBab(bab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 16,
              background: t.paper, border: `1px solid ${t.line}`,
              boxShadow: t.shadow, cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: bab.accentLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>{bab.emoji}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: t.ink, marginBottom: 2 }}>
                Bab {bab.n} · {bab.title}
              </div>
              <div style={{ fontSize: 11, color: t.muted, fontWeight: 500 }}>{bab.short}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <IconChevron color={t.mutedLight} />
              {bab.quizReady && (
                <div style={{
                  fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 999,
                  background: dark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.08)',
                  color: t.primary,
                }}>Kuiz ✓</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
