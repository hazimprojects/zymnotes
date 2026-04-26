import { useState } from 'react';
import { DARK, LIGHT } from '../tokens';
import QuizBadge from './QuizBadge';

export default function BabCard({ bab, dark, onOpen }) {
  const t = dark ? DARK : LIGHT;
  const [pressed, setPressed] = useState(false);
  const isLocked = !bab.quizReady;

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => { setPressed(false); onOpen(bab); }}
      onClick={() => onOpen(bab)}
      style={{
        borderRadius: 20,
        background: dark
          ? `linear-gradient(145deg, ${t.paper}, ${t.paperSoft})`
          : `linear-gradient(145deg, #ffffff, ${bab.accentLight.replace('0.14', '0.06')})`,
        border: `1px solid ${dark ? t.line : bab.accentLight}`,
        boxShadow: t.shadow,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: bab.accentLight,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{bab.emoji}</div>
        <div style={{
          padding: '3px 9px', borderRadius: 999,
          background: bab.accentLight,
          fontSize: 10, fontWeight: 800,
          color: bab.label,
          letterSpacing: '0.04em',
        }}>Bab {bab.n}</div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: t.ink, lineHeight: 1.3, marginBottom: 4 }}>
        {bab.title}
      </div>
      <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.4, marginBottom: 10, fontWeight: 500 }}>
        {bab.short}
      </div>

      <QuizBadge bab={bab} dark={dark} />

      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{
          flex: 1, padding: '7px 0', borderRadius: 10,
          background: bab.accentLight,
          textAlign: 'center', fontSize: 11, fontWeight: 800,
          color: bab.label,
        }}>📄 Nota</div>

        <div style={{
          flex: 1, padding: '7px 0', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          background: isLocked
            ? (dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')
            : (dark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.08)'),
          border: isLocked
            ? `1px dashed ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`
            : '1px solid transparent',
          fontSize: 11, fontWeight: 800,
          color: isLocked ? t.mutedLight : t.primary,
          opacity: isLocked ? 0.7 : 1,
        }}>
          <span style={{ fontSize: 10 }}>{isLocked ? '🔒' : '✏️'}</span>
          <span>Kuiz</span>
          {isLocked && (
            <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.04em', color: t.mutedLight, opacity: 0.7 }}>
              SOON
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
