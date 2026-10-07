/* FX.JS — efectos visuales (archivo NUEVO; no modifica tus .js). Todo vanilla y con respeto a prefers-reduced-motion. */
(() => {
  const root = document.documentElement, $ = (s, c = document) => c.querySelector(s);
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* 1) Skeleton de carga: la clase "loading" oculta el contenido ~0,7 s */
  root.classList.add('loading'); setTimeout(() => root.classList.remove('loading'), calma ? 0 : 700);

  /* 2) Modo día/noche con preferencia guardada (usa la del sistema la primera vez) */
  try {
    const guardado = localStorage.getItem('rp_theme');
    root.dataset.theme = guardado || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch { root.dataset.theme = 'light'; }
  const tg = $('#themeToggle');
  if (tg) tg.addEventListener('click', () => {
    root.classList.add('theme-anim'); setTimeout(() => root.classList.remove('theme-anim'), 500);
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('rp_theme', root.dataset.theme); } catch {}
    tg.setAttribute('aria-pressed', root.dataset.theme === 'dark');
  });

  /* 3) Ripple en botones + spinner breve al abrir un juego */
  const BTN = '.btn-primary,.btn-light,.guest-btn,.play-btn,.add-friend,.save-name-btn,.demo-action-btn,.g-btn,.social-btn';
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest?.(BTN); if (!b || calma) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.append(s); setTimeout(() => s.remove(), 600);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest?.('.game-launch'); if (!b || calma) return;
    b.classList.add('is-loading'); setTimeout(() => b.classList.remove('is-loading'), 450);
  });

  /* 4) Tilt 3D + foco de luz en tarjetas, y botones magnéticos (solo mouse) */
  let tarjeta = null; const mag = () => document.querySelectorAll('.hero .btn-primary,.hero .btn-light,.guest-btn');
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || calma) return;
    const c = e.target.closest?.('.game-card');
    if (tarjeta && tarjeta !== c) { tarjeta.style.removeProperty('--rx'); tarjeta.style.removeProperty('--ry'); tarjeta = null; }
    if (c) {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--ry', `${(x - .5) * 12}deg`); c.style.setProperty('--rx', `${(.5 - y) * 12}deg`);
      c.style.setProperty('--mx', `${x * 100}%`); c.style.setProperty('--my', `${y * 100}%`); tarjeta = c;
    }
    mag().forEach(b => {
      const r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      b.style.transform = Math.hypot(dx, dy) < 90 ? `translate(${dx * .25}px,${dy * .25}px)` : '';
    });
  });

  /* 5) Cursor personalizado (punto + aro) solo en escritorio */
  if (fino && !calma) {
    const dot = Object.assign(document.createElement('div'), { className: 'cursor-dot' }), ring = Object.assign(document.createElement('div'), { className: 'cursor-ring' });
    document.body.append(dot, ring); root.classList.add('has-cursor');
    let mx = 0, my = 0, rx = 0, ry = 0;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; ring.classList.toggle('hot', !!e.target.closest?.('a,button,label,.game-card')); });
    (function seguir() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(seguir); })();
  }

  /* 6) Partículas de confeti flotantes en el hero (canvas, sin librerías) */
  const hero = $('.hero');
  if (hero && !calma) {
    const cv = Object.assign(document.createElement('canvas'), { className: 'hero-fx' }), g = cv.getContext('2d'), COL = ['#e0a935', '#c94a37', '#e56b8b', '#ffffff', '#5ccaa6'];
    hero.prepend(cv); let P = [];
    const medir = () => { cv.width = hero.clientWidth; cv.height = hero.clientHeight; P = Array.from({ length: Math.round(cv.width / 14) }, () => ({ x: Math.random() * cv.width, y: Math.random() * cv.height, s: 3 + Math.random() * 4, v: .2 + Math.random() * .5, r: Math.random() * 6, c: COL[Math.random() * 5 | 0] })); };
    medir(); new ResizeObserver(medir).observe(hero);
    (function anim() {
      if (hero.offsetParent && !document.hidden) {                // solo anima si el hero está visible
        g.clearRect(0, 0, cv.width, cv.height);
        for (const p of P) { p.y -= p.v; p.r += .02; if (p.y < -10) { p.y = cv.height + 10; p.x = Math.random() * cv.width; } g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = .6; g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }
      }
      requestAnimationFrame(anim);
    })();
  }

  /* 7) Confeti de victoria: escucha "rp:gameend" y, por si tu core no lo emite, detecta el texto de victoria en el modal */
  let ultimo = 0;
  const confeti = () => {
    if (calma || Date.now() - ultimo < 2500) return; ultimo = Date.now();
    const cv = Object.assign(document.createElement('canvas'), { className: 'confetti', width: innerWidth, height: innerHeight }), g = cv.getContext('2d');
    document.body.append(cv); const COL = ['#e0a935', '#c94a37', '#0d654f', '#e56b8b', '#ffffff'];
    const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * .55, vx: (Math.random() - .5) * 16, vy: -6 - Math.random() * 11, r: Math.random() * 6, c: COL[Math.random() * 5 | 0] }));
    let t = 0; (function f() {
      g.clearRect(0, 0, cv.width, cv.height); t++;
      for (const p of P) { p.vy += .3; p.x += p.vx; p.y += p.vy; p.r += .2; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-4, -2, 8, 4); g.restore(); }
      t < 150 ? requestAnimationFrame(f) : cv.remove();
    })();
  };
  document.addEventListener('rp:gameend', e => { if (e.detail?.won) confeti(); });
  const cuerpo = $('#demoGameBody');
  if (cuerpo) new MutationObserver(() => { if (/victoria|ganaste/i.test(cuerpo.textContent)) confeti(); }).observe(cuerpo, { childList: true });
})();
