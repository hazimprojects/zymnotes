import { useState } from 'react';
import { DARK, LIGHT } from '../tokens';
import { BABS } from '../data';
import { IconSearch } from './Icons';
import BabCard from './BabCard';

export default function HomeTab({ dark, onOpenBab, showTingkatanTag }) {
  const t = dark ? DARK : LIGHT;
  const [search, setSearch] = useState('');

  const filtered = BABS.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    `bab ${b.n}`.includes(search.toLowerCase())
  );

  const attemptedCount = BABS.filter(b => b.quizReady && b.quizScore !== null).length;
  const availableCount = BABS.filter(b => b.quizReady).length;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: t.bg }}>
      <div style={{ padding: '12px 16px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: t.paper, border: `1.5px solid ${t.lineStrong}`,
          borderRadius: 14, padding: '10px 14px',
          boxShadow: t.shadow,
        }}>
          <IconSearch color={t.muted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari bab... (contoh: nasionalisme)"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 13, fontWeight: 600, color: t.ink,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: t.muted, fontSize: 14, fontWeight: 800 }}>✕</span>
          )}
        </div>
      </div>

      <div style={{ padding: '8px 16px 10px' }}>
        {showTingkatanTag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 999,
              background: dark ? 'rgba(129,140,248,0.14)' : 'rgba(79,70,229,0.08)',
              border: `1px solid ${dark ? 'rgba(129,140,248,0.22)' : 'rgba(79,70,229,0.14)'}`,
              fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: t.primary,
            }}>📚 TINGKATAN 4</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 999,
              background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              fontSize: 10, fontWeight: 700, color: t.mutedLight,
            }}>Sejarah KSSM</div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: t.ink, lineHeight: 1.2 }}>
              {search ? `${filtered.length} hasil` : 'Semua Bab'}
            </div>
            <div style={{ fontSize: 11, color: t.muted, marginTop: 2, fontWeight: 500 }}>
              {!search && `${attemptedCount}/${availableCount} kuiz dicuba`}
            </div>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 100px' }}>
          {filtered.map(bab => (
            <BabCard key={bab.n} bab={bab} dark={dark} onOpen={onOpenBab} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: t.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Tiada hasil untuk "{search}"</div>
          <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500 }}>Cuba cari nombor bab atau kata kunci lain</div>
        </div>
      )}
    </div>
  );
}
