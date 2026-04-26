import { useState } from 'react';
import { DARK, LIGHT } from './tokens';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import HomeTab from './components/HomeTab';
import NotesTab from './components/NotesTab';
import AboutTab from './components/AboutTab';
import NoteScreen from './components/NoteScreen';

export default function App() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState('home');
  const [openBab, setOpenBab] = useState(null);
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: t.bg,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      overflow: 'hidden',
      transition: 'background 0.35s ease',
      position: 'relative',
    }}>
      {openBab ? (
        <NoteScreen bab={openBab} dark={dark} onBack={() => setOpenBab(null)} />
      ) : (
        <>
          <AppHeader tab={tab} dark={dark} setDark={setDark} />
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: tab === 'home' ? 'block' : 'none', height: '100%' }}>
              <HomeTab dark={dark} onOpenBab={setOpenBab} showTingkatanTag={false} />
            </div>
            <div style={{ display: tab === 'notes' ? 'block' : 'none', height: '100%' }}>
              <NotesTab dark={dark} onOpenBab={setOpenBab} />
            </div>
            <div style={{ display: tab === 'about' ? 'block' : 'none', height: '100%' }}>
              <AboutTab dark={dark} />
            </div>
          </div>
          <BottomNav tab={tab} setTab={setTab} dark={dark} />
        </>
      )}
    </div>
  );
}
