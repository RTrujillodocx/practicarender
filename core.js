/* ============================================================
   CORE.JS — Motor de juegos de Raíces Play
   ------------------------------------------------------------
   API que expone:
     RP.h(tag, attrs, ...children)     → crea elementos DOM
     RP.canvas(w, h, label)            → { c, g } canvas + contexto
     RP.register(def)                  → registra un juego
     RP.mount(game, container)         → monta un juego
     RP.unmount()                      → limpia el juego actual
     RP.sound.{click,hit,miss,card,win,lose}
     RP.store.{get,set,del}            → localStorage
   
   Cada juego usa:
     RP.register({
       id, name, levels, description, rules,
       run(ctx)  // ctx = { el, lv, on, loop, later, end }
     })
   ============================================================ */
(function () {
  'use strict';

  const RP = window.RP = window.RP || {};
  RP.games = RP.games || {};
  RP.currentCleanup = null;
  RP.currentContainer = null;
  RP.currentGame = null;

  /* ============================================================
     RP.h — Helper para crear elementos
     ============================================================ */
  RP.h = function (tag, attrs, ...children) {
    const el = document.createElement(tag);

    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null) continue;

        if (k === 'class') el.className = v;
        else if (k === 'style') el.setAttribute('style', v);
        else if (k === 'hidden') el.hidden = !!v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else {
          el.setAttribute(k, v);
        }
      }
    }

    children.forEach((ch) => {
      if (ch == null || ch === false) return;
      if (typeof ch === 'string' || typeof ch === 'number') {
        el.appendChild(document.createTextNode(String(ch)));
      } else if (ch instanceof Node) {
        el.appendChild(ch);
      }
    });

    return el;
  };

  /* ============================================================
     RP.canvas — Crea un canvas con contexto 2D
     Devuelve { c, g } donde c = canvas, g = contexto 2D
     ============================================================ */
  RP.canvas = function (w, h, label) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', label || 'Juego interactivo');
    c.style.maxWidth = '100%';
    c.style.height = 'auto';
    c.style.display = 'block';
    c.style.margin = '0 auto';
    c.style.borderRadius = '12px';
    c.style.touchAction = 'none';
    c.style.background = '#fff';

    const g = c.getContext('2d');
    return { c, g };
  };

  /* ============================================================
     RP.store — Persistencia en localStorage
     ============================================================ */
  RP.store = {
    get(key, def) {
      try {
        const v = localStorage.getItem('rp:' + key);
        return v === null ? def : JSON.parse(v);
      } catch (e) {
        return def;
      }
    },
    set(key, val) {
      try { localStorage.setItem('rp:' + key, JSON.stringify(val)); } catch (e) {}
    },
    del(key) {
      try { localStorage.removeItem('rp:' + key); } catch (e) {}
    }
  };

  /* ============================================================
     RP.sound — Sonidos con Web Audio API (sin archivos externos)
     ============================================================ */
  RP.sound = (function () {
    let audioCtx = null;

    function ensure() {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    }

    function tone(freq, dur, type, vol) {
      const c = ensure();
      if (!c) return;
      try {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol || 0.12, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start();
        osc.stop(c.currentTime + dur);
      } catch (e) {}
    }

    return {
      click() { tone(400, 0.08, 'sine', 0.08); },
      hit() {
        tone(660, 0.10, 'sine', 0.12);
        setTimeout(() => tone(880, 0.15, 'sine', 0.12), 80);
      },
      miss() {
        tone(220, 0.15, 'sawtooth', 0.10);
        setTimeout(() => tone(150, 0.25, 'sawtooth', 0.10), 120);
      },
      card() {
        [523, 659, 784, 1047].forEach((f, i) =>
          setTimeout(() => tone(f, 0.15, 'sine', 0.10), i * 90)
        );
      },
      win() {
        [523, 659, 784, 1047, 1319].forEach((f, i) =>
          setTimeout(() => tone(f, 0.20, 'sine', 0.12), i * 100)
        );
      },
      lose() {
        [400, 320, 250, 180].forEach((f, i) =>
          setTimeout(() => tone(f, 0.25, 'sawtooth', 0.10), i * 120)
        );
      }
    };
  })();

  /* ============================================================
     RP.register — Registra un juego en el sistema
     ============================================================ */
  RP.register = function (def) {
    if (!def || !def.name) {
      console.warn('[RP] register: falta name', def);
      return;
    }
    RP.games[def.name] = def;
    console.log('🎮 Juego registrado:', def.name);
  };

  /* ============================================================
     RP.mount — Monta un juego en el contenedor
     ============================================================ */
  RP.mount = function (game, container) {
    RP.unmount();

    if (!game || typeof game.run !== 'function') {
      container.innerHTML = '<p style="text-align:center;color:#666;padding:20px;">Juego no disponible.</p>';
      return;
    }

    RP.currentGame = game;
    RP.currentContainer = container;

    const cleanups = [];
    let rafId = null;
    let lastTime = 0;
    let ended = false;

    /* -------- Contexto que se pasa a game.run(ctx) -------- */
    const ctx = {
      el: container,
      lv: 0,

      on(target, event, handler, opts) {
        target.addEventListener(event, handler, opts);
        cleanups.push(() => target.removeEventListener(event, handler, opts));
      },

      loop(fn) {
        const step = (t) => {
          if (ended) return;
          if (!lastTime) lastTime = t;
          const dt = Math.min(0.05, (t - lastTime) / 1000);
          lastTime = t;
          try { fn(dt); } catch (e) { console.error('[RP loop]', e); }
          rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);
      },

      later(fn, ms) {
        const id = setTimeout(() => { if (!ended) fn(); }, ms);
        cleanups.push(() => clearTimeout(id));
      },

      end(score, win, message) {
        if (ended) return;
        ended = true;
        if (rafId) cancelAnimationFrame(rafId);
        showEndScreen(container, game, score, win, message, ctx);
      }
    };

    /* -------- Pantalla de inicio: reglas + dificultad -------- */
    showStartScreen(container, game, ctx);

    /* -------- Cleanup para RP.unmount() -------- */
    RP.currentCleanup = () => {
      ended = true;
      if (rafId) cancelAnimationFrame(rafId);
      cleanups.forEach((fn) => { try { fn(); } catch (e) {} });
      container.innerHTML = '';
    };
  };

  /* ============================================================
     PANTALLA DE INICIO (reglas + elegir dificultad)
     ============================================================ */
  function showStartScreen(container, game, ctx) {
    container.innerHTML = '';

    const title = RP.h('h3', { class: 'g-title' }, game.name);
    const rules = RP.h('p', { class: 'g-rules' }, game.rules || game.description || '');

    container.appendChild(title);
    container.appendChild(rules);

    const levels = game.levels || ['Fácil', 'Medio', 'Difícil'];
    const levelWrap = RP.h('div', {
      class: 'g-levels',
      role: 'group',
      'aria-label': 'Selecciona dificultad'
    });

    levels.forEach((name, i) => {
      const btn = RP.h('button', {
        class: 'g-btn',
        type: 'button',
        onclick: () => {
          RP.sound.click();
          ctx.lv = i;
          container.innerHTML = '';
          try {
            game.run(ctx);
          } catch (e) {
            console.error('[RP run]', e);
            container.innerHTML = '<p style="color:#c94a37;padding:20px;">Error al iniciar el juego. Revisa la consola.</p>';
          }
        }
      }, name);
      levelWrap.appendChild(btn);
    });

    container.appendChild(levelWrap);
  }

  /* ============================================================
     PANTALLA DE FIN DEL JUEGO
     ============================================================ */
  function showEndScreen(container, game, score, win, message, ctx) {
    container.innerHTML = '';

    if (win) RP.sound.win();
    else RP.sound.lose();

    const card = RP.h('div', { class: 'g-end' },
      RP.h('h3', { class: 'g-end-title' }, win ? '🏆 ¡Ganaste!' : '💀 Fin del juego'),
      RP.h('p', { class: 'g-end-msg' }, message || ''),
      RP.h('p', { class: 'g-end-score' }, `Puntaje: ${score}`),
      RP.h('div', { class: 'g-end-actions' },
        RP.h('button', {
          class: 'g-btn', type: 'button',
          onclick: () => {
            RP.sound.click();
            RP.mount(game, container);
          }
        }, '🔁 Jugar otra vez')
      )
    );
    container.appendChild(card);

    document.dispatchEvent(new CustomEvent('rp:end', {
      detail: { game: game.name, score, win, message }
    }));
  }

  /* ============================================================
     RP.unmount — Limpia el juego actual
     ============================================================ */
  RP.unmount = function () {
    if (typeof RP.currentCleanup === 'function') {
      try { RP.currentCleanup(); } catch (e) { console.error('[RP unmount]', e); }
    }
    RP.currentCleanup = null;
    RP.currentGame = null;
    RP.currentContainer = null;
  };

  console.log('%c🎮 RP core.js cargado correctamente', 'color:#0d654f;font-weight:bold;');
})();