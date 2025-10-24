// Happy22_Seesaw_InteractiveSite - single-file React app (App.jsx)
// Updated full version: includes
// - corrected entrance text: "mysterious"
// - background piano BGM with play/pause floating control
// - 4 games: Memory Match, Password Lock, Birthday Roulette, Heart Detector
// - Message board with auto-reply
// - Summary page: THE YEARS WE WALK TOGETHER (aggregates game results)
// - LocalStorage persistence for messages and game progress
//
// Usage:
// - Create a React app (Vite recommended) and paste this into src/App.jsx
// - Install dependencies: framer-motion, tailwindcss (optional)
// - Place a BGM file at public/audio/bgm.mp3 or change the path below
// - Replace placeholder images/videos with your uploads

import React, { useEffect, useState, useRef } from 'react';
import * as Framer from 'framer-motion';

/* Theme colors (gray-purple):
   --main: #b200b5ff
   --accent: #fbc949ff
   --deep: #d834f9ff
   --soft: #5b025bff
*/

const PASSWORD = '1025';
const BGM_BASE = '/audio/the1999_pagagnini'; // base path without extension

export default function App() {
  // allow quick dev preview by visiting /?dev=1
  const getInitial = (key, fallback) => {
    try {
      if (typeof window === 'undefined') return fallback;
      const params = new URLSearchParams(window.location.search);
      if (key === 'unlocked') {
        if (params.get('dev') === '1') return true;
        const stored = localStorage.getItem('happy22_unlocked');
        if (stored === 'true') return true;
        return false;
      }
      if (key === 'tab') {
        if (params.get('dev') === '1') return 'games';
        const t = params.get('tab');
        return t || fallback;
      }
    } catch {
      return fallback;
    }
  };

  const [unlockedState, setUnlockedState] = useState(() => getInitial('unlocked', false));
  const [tab, setTab] = useState(() => getInitial('tab', 'home'));
  const [nick] = useState('hqq');

  // audio controls
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState(() => {
    try {
      return localStorage.getItem('happy22_bgm') || null;
    } catch {
      return null;
    }
  });
  const lastBlobRef = useRef(null);

  // prefer mp3 if available on the server; fall back to flac
  const [bgmExt, setBgmExt] = useState('flac');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch(`${BGM_BASE}.mp3`, { method: 'HEAD' });
        if (mounted && resp && resp.ok) setBgmExt('mp3');
      } catch {
        // keep default flac
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // cleanup blob URL on unmount
    return () => {
      if (lastBlobRef.current && lastBlobRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobRef.current);
    };
  }, []);

  useEffect(() => {
    // sync initial unlocked state with localStorage unless dev param forces it
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      if (!(params && params.get('dev') === '1')) {
        const stored = localStorage.getItem('happy22_unlocked');
        if (stored === 'true') setUnlockedState(true);
      }
      const p = localStorage.getItem('happy22_playing');
      if (p === 'true') setPlaying(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('happy22_unlocked', unlockedState ? 'true' : 'false');
  }, [unlockedState]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      const p = audioRef.current.play();
      if (p && p.catch) p.catch(()=>{/* autoplay might be blocked; user can press play */});
    } else {
      audioRef.current.pause();
    }
    localStorage.setItem('happy22_playing', playing ? 'true' : 'false');
  }, [playing]);

  return (
  <div className="min-h-screen bg-gradient-to-b from-[#9d07abff] to-[#07d8f9ff] text-white font-sans" style={{background: 'linear-gradient(#9d07abff, #07d8f9ff)'}}>
  {/* Hidden audio element */}
  <audio ref={audioRef} src={audioSrc || `${BGM_BASE}.${bgmExt}`} loop />

      <div className="max-w-6xl mx-auto p-6">
        {!unlockedState ? (
          <PasswordPage onUnlock={() => setUnlockedState(true)} />
        ) : (
          <div>
            <Header nick={nick} onNav={setTab} />

            <div className="mt-6">
              <Framer.AnimatePresence mode="wait" initial={false}>
                {tab === 'home' && (
                  <Framer.motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <Home heroName={nick} />
                  </Framer.motion.div>
                )}

                {tab === 'memories' && (
                  <Framer.motion.div key="memories" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <Album />
                  </Framer.motion.div>
                )}

                {tab === 'games' && (
                  <Framer.motion.div key="games" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <GamesBundle nick={nick} />
                  </Framer.motion.div>
                )}

                {tab === 'messages' && (
                  <Framer.motion.div key="messages" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <MessageBoard nick={nick} />
                  </Framer.motion.div>
                )}

                {tab === 'final' && (
                  <Framer.motion.div key="final" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <FinalChapter nick={nick} />
                  </Framer.motion.div>
                )}
              </Framer.AnimatePresence>
            </div>

            {/* Floating audio control + upload */}
            <div className="fixed right-6 bottom-6 flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <label className="px-3 py-2 rounded bg-white/90 text-[#3B3F66] cursor-pointer shadow-lg flex items-center gap-2">
                  上传音乐
                  <input type="file" accept="audio/*" onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    // use blob URL for immediate playback
                    const url = URL.createObjectURL(f);
                    // revoke previous blob if any
                    if (lastBlobRef.current && lastBlobRef.current.startsWith('blob:')) URL.revokeObjectURL(lastBlobRef.current);
                    lastBlobRef.current = url;
                    setAudioSrc(url);
                    setPlaying(true);

                    // try to persist as base64 if small
                    try {
                      if (f.size <= 2 * 1024 * 1024) { // 2MB limit
                        const reader = new FileReader();
                        reader.onload = () => {
                          try { localStorage.setItem('happy22_bgm', reader.result); } catch { /* ignore */ }
                        };
                        reader.readAsDataURL(f);
                      } else {
                        // too large to persist; remove any stored value
                        try { localStorage.removeItem('happy22_bgm'); } catch { /* ignore */ }
                      }
                    } catch { /* ignore */ }
                    // reset input so same file can be reselected later
                    e.target.value = null;
                  }} className="hidden" />
                </label>

                <button onClick={() => { 
                  // stop playback and reset to default
                  setPlaying(false);
                  if (lastBlobRef.current && lastBlobRef.current.startsWith('blob:')) {
                    URL.revokeObjectURL(lastBlobRef.current);
                    lastBlobRef.current = null;
                  }
                  setAudioSrc(null);
                  try { localStorage.removeItem('happy22_bgm'); } catch { /* ignore */ };
                }} className="px-3 py-2 rounded bg-white/10">重置音乐</button>
              </div>

              <button onClick={() => setPlaying(p => !p)} className="w-12 h-12 rounded-full bg-white/90 text-[#3B3F66] flex items-center justify-center shadow-lg">
                {playing ? '⏸' : '▶'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordPage({ onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function tryUnlock() {
    if (input.trim() === PASSWORD) {
      onUnlock();
    } else {
      setError('密码不对，请再试一次。Hint: 生日数字哦～');
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
  <Framer.motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-semibold">Welcome to the mysterious web, detective seesaw</h1>
          <p className="mt-3 text-sm text-[#F3E8FF]">欢迎来到神秘网站，解锁专属回忆（输入生日数字）</p>
        </div>
  </Framer.motion.div>

      <div className="mt-6 w-full max-w-md">
        <input
          className="w-full p-3 rounded-md bg-white/10 border border-white/20 placeholder:text-white/60"
          placeholder="输入密码"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(''); }}
        />
        <div className="flex gap-3 mt-3">
          <button onClick={tryUnlock} className="px-4 py-2 rounded bg-[#F3E8FF] text-[#3B3F66] font-medium">解锁</button>
          <button onClick={() => { setInput('1025'); tryUnlock(); }} className="px-4 py-2 rounded border border-white/30">试试默认</button>
        </div>
        {error && <p className="mt-2 text-sm text-red-200">{error}</p>}
      </div>

  <Framer.motion.div animate={{opacity:[0.6,1,0.6]}} transition={{duration:3, repeat:Infinity}} className="mt-8 text-xs text-white/80">
        Tip: 这个网站为seesaw的22岁生日准备，记得在10.25那天打开看哦～
  </Framer.motion.div>
    </div>
  );
}

function Header({ nick, onNav }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold">Happy 22, <span className="italic">{nick}</span></h2>
  <p className="text-sm text-white/80">From your best friend Carrot LUO</p>
      </div>

      <nav className="flex gap-3">
        <button onClick={() => onNav('home')} className="px-3 py-2 rounded bg-white/10">Home</button>
        <button onClick={() => onNav('memories')} className="px-3 py-2 rounded bg-white/10">Memories</button>
        <button onClick={() => onNav('games')} className="px-3 py-2 rounded bg-white/10">Games</button>
        <button onClick={() => onNav('messages')} className="px-3 py-2 rounded bg-white/10">Messages</button>
        <button onClick={() => onNav('final')} className="px-3 py-2 rounded bg-white/10">Final Chapter</button>
      </nav>
    </div>
  );
}

function Home({ heroName }) {
  return (
    <div className="mt-6 p-6 rounded-2xl bg-white/5 backdrop-blur-sm">
  <Framer.motion.div initial={{scale:0.98}} animate={{scale:1}} transition={{duration:0.6}}>
        <h3 className="text-xl font-semibold">Welcome to the mysterious web, detective {heroName}</h3>
        <p className="mt-3 text-white/80">这里藏着我们走过的时光记忆，回首再盼，忽而六年飞逝。</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded bg-white/6">
            <h4 className="font-medium">Today's Mission</h4>
            <p className="text-sm mt-2">Complete the mini-games to unlock the final chapter: "THE YEARS WE WALK TOGETHER".</p>
          </div>

          <div className="p-4 rounded bg-white/6">
            <h4 className="font-medium">Tips</h4>
            <p className="text-sm mt-2">留言区支持自动回复关键词，快来尝试！</p>
          </div>
        </div>
  </Framer.motion.div>
    </div>
  );
}

function Album() {
  // allow user to upload images and persist them in localStorage as data URLs
  const [photos, setPhotos] = useState(() => {
    try {
      const raw = localStorage.getItem('happy22_photos');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('happy22_photos', JSON.stringify(photos));
    } catch {
      // ignore quota errors
    }
  }, [photos]);

  const carouselRef = useRef(null);

  // enable drag-to-scroll with mouse for desktop
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    function onMouseDown(e) {
      isDown = true;
      el.classList.add('dragging');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      e.preventDefault();
    }

    function onMouseLeave() {
      isDown = false;
      el.classList.remove('dragging');
    }

    function onMouseUp() {
      isDown = false;
      el.classList.remove('dragging');
    }

    function onMouseMove(e) {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;
      el.scrollLeft = scrollLeft - walk;
    }

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, [photos]);

  // Resize image files to reduce size before storing in localStorage
  async function resizeFileToDataURL(file, maxDim = 1024, quality = 0.8) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('File read error'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxDim / Math.max(width, height));
          width = Math.round(width * scale);
          height = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          // fill white background to avoid transparent -> black when JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch {
            // fallback to original data URL
            resolve(reader.result);
          }
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const dataUrls = await Promise.all(files.map(f => resizeFileToDataURL(f, 1024, 0.8)));
      const next = [...photos, ...dataUrls].slice(-30); // keep last 30
      setPhotos(next);
    } catch (err) {
      console.error('Error processing images', err);
    }
    // reset input
    e.target.value = null;
  }

  // photo removal handled via clearing or lightbox controls; helper removed to avoid unused lint warnings

  // pagination for gallery pages
  const PAGE_SIZE = 4;
  const pages = [];
  for (let i = 0; i < photos.length; i += PAGE_SIZE) pages.push(photos.slice(i, i + PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(0);

  function nextPage() {
    setCurrentPage(p => (p + 1) % Math.max(1, pages.length));
  }
  function prevPage() {
    setCurrentPage(p => (p - 1 + Math.max(1, pages.length)) % Math.max(1, pages.length));
  }

  // lightbox
  const [lightboxIndex, setLightboxIndex] = useState(null);
  function openLightbox(index) { setLightboxIndex(index); }
  function closeLightbox() { setLightboxIndex(null); }
  function nextLightbox() { if (lightboxIndex === null) return; setLightboxIndex((lightboxIndex + 1) % photos.length); }
  function prevLightbox() { if (lightboxIndex === null) return; setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length); }

  // idle autoplay: when user is idle (no mouse move/keys) start auto-advancing pages
  const IDLE_MS = 3000;
  const AUTOPLAY_INTERVAL = 2500;
  useEffect(() => {
    let idleTimer = null;
    let autoplayTimer = null;
    let isIdle = false;

    function onMove() {
      if (idleTimer) clearTimeout(idleTimer);
      if (isIdle) {
        isIdle = false;
        if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
      }
      idleTimer = setTimeout(() => {
        isIdle = true;
        // start autoplay (only if multiple pages and lightbox is not open)
        if (pages.length > 1 && lightboxIndex === null) {
          autoplayTimer = setInterval(() => {
            setCurrentPage(p => (p + 1) % pages.length);
          }, AUTOPLAY_INTERVAL);
        }
      }, IDLE_MS);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onMove);
    window.addEventListener('keydown', onMove);
    // start initial timer
    onMove();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onMove);
      window.removeEventListener('keydown', onMove);
      if (idleTimer) clearTimeout(idleTimer);
      if (autoplayTimer) clearInterval(autoplayTimer);
    };
  }, [pages.length, lightboxIndex]);

  // clamp currentPage when pages change
  useEffect(() => {
    if (currentPage >= pages.length) setCurrentPage(Math.max(0, pages.length - 1));
  }, [pages.length]);

  // keyboard navigation: left/right for pages or lightbox, Esc to close lightbox
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') {
        if (lightboxIndex !== null) prevLightbox(); else prevPage();
      } else if (e.key === 'ArrowRight') {
        if (lightboxIndex !== null) nextLightbox(); else nextPage();
      } else if (e.key === 'Escape') {
        if (lightboxIndex !== null) closeLightbox();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex]);

  return (
    <div className="mt-6 p-6 rounded-2xl bg-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">回忆相册 / Memories</h3>
          <p className="text-sm text-white/80">上传你的照片来替换占位。图片会保存在你的浏览器（localStorage）。</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="px-3 py-2 rounded bg-[#F3E8FF] text-[#3B3F66] cursor-pointer">
            上传照片
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          </label>
          <button onClick={() => setPhotos([])} className="px-3 py-2 rounded bg-white/10">清空</button>
        </div>
      </div>

      <div className="mt-4">
        {photos.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-2 rounded bg-white/6 cursor-pointer hover:scale-105 transform transition">
                <div className="h-36 bg-gradient-to-br from-white/6 to-white/3 flex items-center justify-center rounded">📷</div>
                <p className="mt-2 text-sm">Memory {i + 1}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Page grid: show a grid of photos per page, and allow auto-advance when idle */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-white/80">共 {photos.length} 张照片</div>
              <div className="flex gap-2">
                <button onClick={() => prevPage()} className="px-3 py-1 rounded bg-white/10">上一页</button>
                <button onClick={() => nextPage()} className="px-3 py-1 rounded bg-white/10">下一页</button>
              </div>
            </div>

            <div className="overflow-hidden">
              <Framer.motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {pages[currentPage].map((src, i) => {
                    const globalIndex = currentPage * PAGE_SIZE + i;
                    return (
                      <div key={globalIndex} className="p-2 rounded bg-white/6 cursor-pointer hover:scale-105 transform transition" onClick={() => openLightbox(globalIndex)}>
                        <img src={src} alt={`memory-${globalIndex}`} className="w-full h-36 object-cover rounded" />
                      </div>
                    );
                  })}
                </div>
              </Framer.motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => closeLightbox()}>
          <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightboxIndex]} alt={`light-${lightboxIndex}`} className="w-full max-h-[80vh] object-contain rounded" />
            <button onClick={() => prevLightbox()} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded px-3 py-2">‹</button>
            <button onClick={() => nextLightbox()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded px-3 py-2">›</button>
            <button onClick={() => closeLightbox()} className="absolute top-2 right-2 bg-black/40 text-white rounded px-2 py-1">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Games Bundle: contains 4 mini-games and manages their progress summary in localStorage
function GamesBundle({ nick }) {
  // Persisted progress
  const [progress, setProgress] = useState(() => {
    const raw = localStorage.getItem('happy22_progress');
    return raw ? JSON.parse(raw) : { memory:false, lock:false, roulette:0, heart:null };
  });

  useEffect(() => {
    localStorage.setItem('happy22_progress', JSON.stringify(progress));
  }, [progress]);

  function update(key, value) {
    setProgress(prev => ({...prev, [key]: value}));
  }

  // split games across three interactive pages
  const [page, setPage] = useState('page1');

  return (
    <div className="mt-6 p-6 rounded-2xl bg-white/5">
      <h3 className="text-lg font-semibold">Games / 小游戏</h3>
      <p className="text-sm text-white/80">选择下面的页面进入单独的互动页面（每页仅显示一个主要游戏）。</p>

      <div className="mt-4 flex gap-3">
        <Framer.motion.button
          onClick={() => setPage('page1')}
          className="px-3 py-1 rounded"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            backgroundColor: page === 'page1' ? '#F3E8FF' : 'rgba(255,255,255,0.08)',
            color: page === 'page1' ? '#3B3F66' : 'rgba(255,255,255,0.95)'
          }}
          transition={{ duration: 0.18 }}
        >
          Page 1 · Memory
  </Framer.motion.button>

        <Framer.motion.button
          onClick={() => setPage('page2')}
          className="px-3 py-1 rounded"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            backgroundColor: page === 'page2' ? '#F3E8FF' : 'rgba(255,255,255,0.08)',
            color: page === 'page2' ? '#3B3F66' : 'rgba(255,255,255,0.95)'
          }}
          transition={{ duration: 0.18 }}
        >
          Page 2 · Lock
  </Framer.motion.button>

        <Framer.motion.button
          onClick={() => setPage('page3')}
          className="px-3 py-1 rounded"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={{
            backgroundColor: page === 'page3' ? '#F3E8FF' : 'rgba(255,255,255,0.08)',
            color: page === 'page3' ? '#3B3F66' : 'rgba(255,255,255,0.95)'
          }}
          transition={{ duration: 0.18 }}
        >
          Page 3 · Roulette
  </Framer.motion.button>
      </div>

      <div className="mt-6">
  <Framer.AnimatePresence mode="wait">
          <Framer.motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32 }}
          >
            {page === 'page1' && (
              <div>
                <MemoryMatch onComplete={() => update('memory', true)} completed={progress.memory} nick={nick} />
                <div className="mt-3 text-sm text-white/70">Progress: Memory {progress.memory ? '✓' : '✗'}</div>
              </div>
            )}

            {page === 'page2' && (
              <div>
                <PasswordLock onComplete={() => update('lock', true)} completed={progress.lock} />
                <div className="mt-3 text-sm text-white/70">Progress: Lock {progress.lock ? '✓' : '✗'}</div>
              </div>
            )}

            {page === 'page3' && (
              <div>
                <BirthdayRoulette onSpin={(result)=> update('roulette', result)} result={progress.roulette} />
                <div className="mt-6">
                  <HeartDetector onFinish={(res)=> update('heart', res)} result={progress.heart} />
                </div>
                <div className="mt-3 text-sm text-white/70">Progress: Roulette {progress.roulette ? '✓' : '✗'} · Heart {progress.heart ? '✓' : '✗'}</div>
              </div>
            )}
          </Framer.motion.div>
        </Framer.AnimatePresence>
      </div>
    </div>
  );
}

// 1) Memory Match (pairing game)
function MemoryMatch({ onComplete, completed, nick }) {
  // simplified: 6 pairs -> 12 cards
  const icons = ['📷','🎞️','🎁','✉️','🔍','🕯️'];
  const base = [...icons, ...icons];
  const shuffle = (arr) => arr.sort(()=>Math.random()-0.5);
  const [cards, setCards] = useState(() => shuffle(base.map((c,i)=>({id:i, icon:c, matched:false, revealed:false}))));
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [matches, setMatches] = useState(0);
  const [disabled, setDisabled] = useState(false);

  function reveal(card) {
    if (disabled || card.revealed || card.matched) return;
    setCards(prev => prev.map(c => c.id===card.id ? {...c, revealed:true} : c));
    if (!first) setFirst(card);
    else setSecond(card);
  }

  useEffect(()=>{
    if (first && second) {
      setDisabled(true);
      const a = cards.find(c=>c.id===first.id);
      const b = cards.find(c=>c.id===second.id);
      if (a.icon === b.icon) {
        setTimeout(()=>{
          setCards(prev => prev.map(c => c.icon===a.icon ? {...c, matched:true, revealed:true} : c));
          setMatches(m => m+1);
          setFirst(null); setSecond(null); setDisabled(false);
        }, 600);
      } else {
        setTimeout(()=>{
          setCards(prev => prev.map(c => (c.id===a.id||c.id===b.id) ? {...c, revealed:false} : c));
          setFirst(null); setSecond(null); setDisabled(false);
        }, 800);
      }
    }
  }, [first, second]);

  useEffect(()=>{
    if (matches >= icons.length) {
      onComplete();
    }
  }, [matches]);

  function reset() {
    setCards(shuffle(base.map((c,i)=>({id:i, icon:c, matched:false, revealed:false}))));
    setFirst(null); setSecond(null); setMatches(0); setDisabled(false);
  }

  return (
    <div className="p-4 rounded bg-white/6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Find Our Moments（九宫格配对）</h4>
        <div className="text-sm">{completed ? 'Completed' : 'Try it!'}</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 memory-grid">
        {cards.map(c => (
          <div key={c.id} className="h-20 flex items-center justify-center rounded bg-white/8 cursor-pointer" onClick={()=>reveal(c)}>
            {c.revealed || c.matched ? <div className="text-2xl">{c.icon}</div> : <div className="text-2xl">❔</div>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={reset} className="px-3 py-1 rounded bg-white/10">Reset</button>
        <div className="flex-1 text-sm text-white/80">Matches: {matches} / {icons.length}</div>
      </div>
      {matches >= icons.length && (
        <div className="mt-3 p-3 rounded bg-gradient-to-r from-[#F3E8FF]/20 to-white/10">
          <div className="font-medium">You’ve pieced the past together, detective {nick}.</div>
        </div>
      )}
    </div>
  );
}

// 2) Password Lock: three questions (customizable in code)
function PasswordLock({ onComplete, completed }) {
  const questions = [
    {q: '我们第一次去旅行的年月？ (数字)', a: '202307'},
    {q: '你最喜欢的口味？ (我说的是喝的，希望我没说错hhh)', a: '抹茶'},
    {q: '你收到的十八岁生日礼物？（当然是说我送的嘿嘿）', a: '便携式咖啡机'}
  ];
  const [answers, setAnswers] = useState(['','','']);
  const [done, setDone] = useState(completed);
  const [msg, setMsg] = useState('');

  function submit() {
    const ok = questions.every((q,i)=> answers[i].trim().toLowerCase() === q.a.toLowerCase());
    if (ok) {
      setDone(true);
      setMsg('密码全部正确，历史之门已打开。');
      onComplete();
    } else {
      setMsg('有一处不对，回忆或许藏在更深的地方。');
    }
  }

  return (
    <div className="p-4 rounded bg-white/6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Unlock the Past（回忆密码锁）</h4>
        <div className="text-sm">{done ? 'Unlocked' : 'Locked'}</div>
      </div>
      <div className="mt-3 space-y-2">
        {questions.map((qq,idx)=> (
          <div key={idx}>
            <div className="text-sm text-white/80">{idx+1}. {qq.q}</div>
            <input value={answers[idx]} onChange={(e)=>{setAnswers(a=>{const n=[...a]; n[idx]=e.target.value; return n;}); setMsg('');}} className="w-full mt-1 p-2 rounded bg-white/8" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={submit} className="px-3 py-1 rounded bg-[#F3E8FF] text-[#3B3F66]">提交</button>
        <button onClick={()=>{setAnswers(['','','']); setMsg('');}} className="px-3 py-1 rounded bg-white/10">重填</button>
      </div>
      {msg && <div className="mt-2 text-sm">{msg}</div>}
    </div>
  );
}

// 3) Birthday Roulette: spin for a random blessing
function BirthdayRoulette({ onSpin, result }) {
  const options = [
    "今天的你，是世界主角。",
    "誕生日おめでとう。",
    "生辰喜乐，旅行者。今日风里带着枫叶的暖意，想来是为你的新岁送来了祝福。愿你往后的旅途，常有清风相伴，所见皆为心之所向。",
    "Wishing you a lovely birthday. Time moves fast, but today, let it gift you simple, pure happiness.",
    "课程如鱼得水，考试门门赛高！学习生活一切顺利！",
    "友情值 +1025！",
    "Timekeeper，continue your journey in the storm.The world is waiting for you to save!",
    "新的篇章等待你继续书写。"
  ];
  const [out, setOut] = useState(result || null);
  const [spinning, setSpinning] = useState(false);

  function spin() {
    setSpinning(true);
    setOut(null);
    setTimeout(()=>{
      const pick = options[Math.floor(Math.random()*options.length)];
      setOut(pick);
      setSpinning(false);
      onSpin(pick);
    }, 1200);
  }

  return (
    <div className="p-4 rounded bg-white/6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Birthday Roulette（生日转盘）</h4>
        <div className="text-sm">{out ? 'Result ready' : 'Spin it'}</div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-center p-3 ${spinning ? 'animate-pulse' : ''}`}>
          {spinning ? '...' : (out ? out : 'Spin')}
        </div>
        <div>
          <button onClick={spin} className="px-3 py-1 rounded bg-[#F3E8FF] text-[#3B3F66]">旋转</button>
          {out && <div className="mt-2 text-sm text-white/80">签文：{out}</div>}
        </div>
      </div>
    </div>
  );
}

// 4) Heart Detector: five-question small quiz that returns a short profile
function HeartDetector({ onFinish, result }) {
  const questions = [
    '未来的版图探索地点？更想去什么地方？',
    '遇到困难时你更想要：安静倾听 / 激烈讨论？',
    '你觉得我们友谊里最重要的是？',
    '最喜欢和Carrot LUO一起做的事是什么？',
    '给未来的自己一句话：'
  ];
  const [answers, setAnswers] = useState(result ? result.answers : Array(questions.length).fill(''));
  const [submitted, setSubmitted] = useState(!!result);

  function submit() {
    setSubmitted(true);
    const profile = {
      answers,
      summary: `Your answers show a heart that values ${answers[2] || 'companionship'} and memories.`
    };
    onFinish(profile);
  }

  return (
    <div className="p-4 rounded bg-white/6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Heart Detector（心理问答）</h4>
        <div className="text-sm">{submitted ? 'Submitted' : 'Tell me'}</div>
      </div>
      <div className="mt-3 space-y-2">
        {questions.map((q, idx) => (
          <div key={idx}>
            <div className="text-sm text-white/80">{idx+1}. {q}</div>
            <input value={answers[idx]} onChange={(e)=>{setAnswers(a=>{const n=[...a]; n[idx]=e.target.value; return n;});}} className="w-full mt-1 p-2 rounded bg-white/8" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={submit} className="px-3 py-1 rounded bg-[#F3E8FF] text-[#3B3F66]">提交</button>
        <button onClick={()=>{setAnswers(Array(questions.length).fill('')); setSubmitted(false);}} className="px-3 py-1 rounded bg-white/10">重置</button>
      </div>
    </div>
  );
}

// Message board with auto-reply
function MessageBoard({ nick }) {
  const [messages, setMessages] = useState(() => {
    const raw = localStorage.getItem('happy22_messages');
    return raw ? JSON.parse(raw) : [{id:0, author:'System', text:`欢迎来到留言板！来和我对话吧！`}];
  });
  const [text, setText] = useState('');

  useEffect(()=>{
    localStorage.setItem('happy22_messages', JSON.stringify(messages));
  }, [messages]);

  function post() {
    if (!text.trim()) return;
    const next = { id: Date.now(), author: 'You', text: text.trim() };
    setMessages(prev => [...prev, next]);
    setText('');

    // auto reply
    setTimeout(()=>{
      const reply = autoReply(text, nick);
      setMessages(prev => [...prev, { id: Date.now()+1, author: 'AutoReply', text: reply }]);
    }, 700);
  }

  return (
    <div className="mt-6 p-6 rounded-2xl bg-white/5">
      <h3 className="text-lg font-semibold">留言信笺 / Messages</h3>
      <div className="mt-4 max-h-64 overflow-auto space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`p-3 rounded ${m.author==='System'?'bg-white/6':'bg-white/8'}`}>
            <div className="text-xs text-white/70">{m.author}</div>
            <div className="mt-1">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="写下你的祝福或问题...（例如：生日快乐）" className="flex-1 p-3 rounded bg-white/10" />
        <button onClick={post} className="px-4 py-2 rounded bg-[#F3E8FF] text-[#3B3F66]">发送</button>
      </div>

  <p className="mt-3 text-xs text-white/70">还有好多好多没有探索啊，快来跟我对话！</p>
    </div>
  );
}

function autoReply(text) {
  const BOT_NAME = 'Carrot LUO';
  const t = (text || '').toLowerCase();
  if (t.includes('谢谢') || t.includes('thank')) return `嘿，你不许这么快感动～💜`;
  if (t.includes('生日') || t.includes('birthday')) return `生日这天，你是主角，也是光。——From ${BOT_NAME}`;
  if (t.includes('灰原') || t.includes('ai') || t.includes('haibara')) return `哀酱可是这个网页的灵感缪斯。`;
  if (t.includes('bestie') || t.includes('朋友')) return `嘿嘿，被你发现了，我们可是超级搭子。`;

  // 新增自动回复候选（随机返回）
  const fallbacks = [
    `我在看着你打字呢，${BOT_NAME}～`,
    `我写了超级长的代码，你快说我什么都特别好，你快说呀！`
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Final chapter / summary page
function FinalChapter({ nick }) {
  // aggregate progress
  const progress = JSON.parse(localStorage.getItem('happy22_progress') || '{}');
  const messages = JSON.parse(localStorage.getItem('happy22_messages') || '[]');

  // create a gentle summary using available data
  const memoryDone = progress.memory ? true : false;
  const lockDone = progress.lock ? true : false;
  const roulette = progress.roulette || null;
  const heart = progress.heart || null;

  return (
    <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[#3B3F66]/40 to-[#7E7BA5]/30">
  <Framer.motion.h3 initial={{opacity:0}} animate={{opacity:1}} className="text-2xl font-semibold">THE YEARS WE WALK TOGETHER</Framer.motion.h3>
      <p className="text-sm text-white/80 mt-2">A journey written in light and laughter.</p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded bg-white/6">
          <h4 className="font-medium">Moments We Shared</h4>
          <p className="mt-2 text-sm text-white/80">{memoryDone ? 'You completed the memory match — our photos are pieced back together.' : 'Some memories waiting to be found.'}</p>
          <p className="mt-2 text-sm">{lockDone ? 'The past has been unlocked.' : 'Answer the lock to reveal more.'}</p>
          {roulette && <p className="mt-2 text-sm">Last roulette: {roulette}</p>}
        </div>

        <div className="p-4 rounded bg-white/6">
          <h4 className="font-medium">What You’ve Solved</h4>
          <p className="mt-2 text-sm text-white/80">Detective Score</p>
          <div className="mt-2 text-lg">{(memoryDone?1:0) + (lockDone?1:0) + (heart?1:0) + (roulette?1:0)} / 4</div>
          <p className="mt-2 text-sm">Based on the mini-games you completed.</p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded bg-white/8">
        <h4 className="font-medium">Messages Snapshot</h4>
        <div className="mt-2 max-h-40 overflow-auto space-y-2">
          {messages.slice(-5).map(m=> (
            <div key={m.id} className="text-sm"><strong className="text-xs text-white/70">{m.author}</strong>: {m.text}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-4 rounded bg-gradient-to-r from-[#F3E8FF]/20 to-white/10">
        <div className="font-medium">Final Note</div>
        <p className="mt-2">To detective {nick} —</p>
  <p className="mt-1 italic">从学校食堂吃到异国小店，从南方世遗古镇到大阪高塔风情，我们在世界上创造了超级多共同的回忆……新的一年要继续带着满满的好奇心探索这个世界！坚定不移朝着选择的方向前进，我与你共同在路上，高考是战友考研依旧是战友嘿嘿~From every laugh we shared to every problems we solved, these are the years we walk together. Happy 22nd Birthday, my best Seesaw.我们还要一起走遍世界更多的角落，探索更多的文明，听更多的演唱会，看更多的音乐剧，吃更多的同人饭，产更多的产品粮，逛更多的漫展！！！</p>
        <p className="mt-2 text-sm text-white/70">— from your best friend, [Carrot LUO]</p>
      </div>

      <div className="mt-4">
        <button onClick={()=>window.scrollTo({top:0, behavior:'smooth'})} className="px-4 py-2 rounded bg-white/10">Back to Top</button>
      </div>
    </div>
  );
}

/*
Deployment guide (brief):
1. Create a React app (Vite):
   npm create vite@latest happy22 -- --template react
   cd happy22
2. Install dependencies (optional):
   npm install framer-motion
3. Add Tailwind if desired (follow Tailwind docs), or use the provided simple CSS.
4. Put your bgm file at public/audio/bgm.mp3
5. Replace placeholder images (public/images/...)
6. Start locally: npm install && npm run dev
7. Deploy to Vercel:
   - Create an account on vercel.com
   - Import the GitHub repo (push your code)
   - Vercel auto-detects React; click Deploy

Notes:
- Autoplay may be blocked by browsers; the floating play button allows user to start music.
- All user data (messages and progress) stored in localStorage. For multi-user or remote persistence, you'll need a backend API.
*/
