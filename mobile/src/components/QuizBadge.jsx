import { DARK, LIGHT } from '../tokens';

export default function QuizBadge({ bab, dark }) {
  const t = dark ? DARK : LIGHT;
  const attempted = bab.quizReady && bab.quizScore !== null;
  const perfect = attempted && bab.quizScore === bab.quizTotal;

  if (!bab.quizReady) {
    return (
      <div style={{ fontSize: 10, fontWeight: 600, color: t.mutedLight, marginBottom: 8, letterSpacing: '0.01em' }}>
        Kuiz belum ada
      </div>
    );
  }

  if (!attempted) return <div style={{ marginBottom: 8 }} />;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 999,
        background: perfect ? bab.accentLight : (dark ? 'rgba(129,140,248,0.13)' : 'rgba(79,70,229,0.08)'),
        border: `1px solid ${perfect ? bab.accentLight : t.line}`,
        fontSize: 10, fontWeight: 800,
        color: perfect ? bab.label : t.primary,
      }}>
        <span>{perfect ? '🏆' : '✏️'}</span>
        <span>Kuiz · {bab.quizScore}/{bab.quizTotal}</span>
        {perfect && <span style={{ fontSize: 9, opacity: 0.7 }}>Sempurna</span>}
      </div>
    </div>
  );
}
