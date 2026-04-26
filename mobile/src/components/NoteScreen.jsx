import { DARK, LIGHT } from '../tokens';
import { IconBack } from './Icons';

const SECTIONS = [
  {
    label: 'Isi Utama',
    chipStyle: { background: 'linear-gradient(90deg,#fdf1d5,#faebc2)', color: '#7d5a1d' },
    getText: (n) => `Kandungan untuk Bab ${n} disusun berdasarkan buku teks KSSM Sejarah Tingkatan 4. Setiap isi penting diberi penekanan supaya lebih mudah diingat dan difahami.`,
  },
  {
    label: 'Fakta Penting',
    chipStyle: { background: 'linear-gradient(90deg,#dbeaff,#cce0ff)', color: '#1e3a6e' },
    getText: () => '• Poin penting 1 untuk bab ini.\n• Poin penting 2 dengan konteks tambahan.\n• Poin penting 3 yang sering keluar dalam peperiksaan.',
  },
  {
    label: 'Rumusan',
    chipStyle: { background: 'linear-gradient(90deg,#ffe4e9,#ffd6dd)', color: '#8c1f30' },
    getText: () => 'Bab ini menerangkan perkembangan penting dalam sejarah Malaysia yang perlu dikuasai oleh pelajar SPM.',
  },
];

export default function NoteScreen({ bab, dark, onBack }) {
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bg }}>
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        background: t.headerBg, borderBottom: `1px solid ${t.line}`,
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
          borderRadius: 10, color: t.primary, display: 'flex', alignItems: 'center',
        }}>
          <IconBack color={t.primary} />
        </button>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: t.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Sejarah T4
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.ink }}>Bab {bab.n}</div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        <div style={{
          borderRadius: 18, padding: '18px 16px', marginBottom: 14,
          background: `linear-gradient(135deg, ${bab.accentLight}, ${bab.accentLight.replace('0.14', '0.06')})`,
          border: `1px solid ${bab.accentLight}`,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{bab.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.ink, lineHeight: 1.3, marginBottom: 6 }}>{bab.title}</div>
          <div style={{ fontSize: 13, color: t.muted, fontWeight: 500 }}>{bab.short}</div>
        </div>

        {SECTIONS.map((section, i) => (
          <div key={i} style={{
            borderRadius: 16, padding: '14px', marginBottom: 10,
            background: t.paper, border: `1px solid ${t.line}`,
            boxShadow: t.shadow,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
              borderRadius: 6, marginBottom: 10, fontSize: 11, fontWeight: 800,
              ...section.chipStyle,
            }}>{section.label}</div>
            <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.65, fontWeight: 500, whiteSpace: 'pre-line' }}>
              {section.getText(bab.n)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
