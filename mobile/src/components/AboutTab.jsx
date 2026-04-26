import { DARK, LIGHT } from '../tokens';

const INFO_ITEMS = [
  { icon: '🎯', label: 'Misi', text: 'Platform sokongan pembelajaran, bukan pengganti buku teks' },
  { icon: '📱', label: 'Mobile-first', text: 'Dioptimumkan untuk telefon pintar, boleh guna offline' },
  { icon: '🧠', label: 'Visual', text: 'Nota disusun semula supaya lebih jelas dan mudah diikuti' },
  { icon: '🔄', label: 'Dikemas kini', text: 'Kandungan ditambah & diperbaiki secara berperingkat' },
];

export default function AboutTab({ dark }) {
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bg, padding: '14px 16px 100px' }}>
      <div style={{
        borderRadius: 20, padding: '20px 18px', marginBottom: 14,
        background: dark
          ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.10))'
          : 'linear-gradient(135deg,rgba(79,70,229,0.07),rgba(6,182,212,0.06))',
        border: `1px solid ${t.line}`,
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: t.ink, marginBottom: 4 }}>ZymNotes</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.primary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          Nota Ulang Kaji Generasi Baharu
        </div>
        <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.6, fontWeight: 500 }}>
          Platform nota visual untuk pelajar SPM Malaysia — fokus pada Sejarah Tingkatan 4 & 5.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {INFO_ITEMS.map((item, i) => (
          <div key={i} style={{
            borderRadius: 16, padding: '14px', background: t.paper,
            border: `1px solid ${t.line}`, boxShadow: t.shadow,
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: t.ink, marginBottom: 3 }}>{item.label}</div>
            <div style={{ fontSize: 11, color: t.muted, lineHeight: 1.4, fontWeight: 500 }}>{item.text}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 16, padding: '14px', background: t.paper, border: `1px solid ${t.line}`, boxShadow: t.shadow, marginBottom: 10 }}>
        <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 6, marginBottom: 10, fontSize: 11, fontWeight: 800, background: 'linear-gradient(90deg,#dbeaff,#cce0ff)', color: '#1e3a6e' }}>
          Skop Semasa
        </div>
        <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.65, fontWeight: 500 }}>
          ✅ Sejarah Tingkatan 4 — Bab 1 hingga Bab 7<br />
          🔜 Sejarah Tingkatan 5 — akan datang<br />
          🔜 Subjek KSSM lain — rancangan masa depan
        </div>
      </div>

      <div style={{ borderRadius: 16, padding: '14px', background: t.paper, border: `1px solid ${t.line}`, boxShadow: t.shadow }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.ink, marginBottom: 4 }}>📧 Hubungi Kami</div>
        <div style={{ fontSize: 13, color: t.primary, fontWeight: 700 }}>hello@zymnotes.com</div>
        <div style={{ fontSize: 11, color: t.muted, marginTop: 4, fontWeight: 500 }}>
          © 2026 ZymNotes · Semua hak cipta terpelihara
        </div>
      </div>
    </div>
  );
}
