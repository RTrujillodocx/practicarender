/* ESCONDIDAS — sigilo por turnos, vista desde arriba. Usa solo la API pública de RP.
   Fase 1: te mueves (cada paso es un turno) hasta un escondite. Fase 2: el buscador revisa escondites. */
(() => {
  const h = RP.h, CS = 40, CO = 9, FI = 7, W = CS * CO, H = CS * FI;
  // Mapas: '#' obstáculo, 'H' escondite, 'P' tu inicio, 'S' inicio del buscador
  const ESC = [
    { n: 'Parque', bg: '#cfe8c4', spot: '🌳', wall: '🪨', mapa: ['..H...H..', '.#.....#.', '....S....', 'H...#...H', '.#.....#.', '....P....', '...H.....'] },
    { n: 'Casa', bg: '#f0dfc4', spot: '🛋️', wall: '🪑', mapa: ['H.......H', '.##...##.', '....S....', '.#.....#.', '....#....', 'H...P...H', '...H.H...'] },
    { n: 'Escuela', bg: '#d6dfee', spot: '🗄️', wall: '🪑', mapa: ['.H.....H.', '.#.#.#.#.', '....S....', 'H.#...#.H', '.........', '...#P#...', '..H...H..'] }];
  // Por nivel: pasos para esconderte, escondites que revisa el buscador y probabilidad de ir al más cercano (IA)
  const NIVELES = [{ mov: 10, k: 2, p: .3 }, { mov: 8, k: 3, p: .6 }, { mov: 6, k: 3, p: .9 }];
  const DIRS = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };

  RP.register({
    id: 'escondidas', name: 'Escondidas', levels: ['Fácil', 'Medio', 'Difícil'],
    description: 'Escóndete antes de que el buscador te encuentre.',
    rules: 'Tres escenarios: parque, casa y escuela. Muévete con flechas o WASD (o toca hacia dónde ir); cada paso gasta un turno. Llega a un escondite antes de quedarte sin pasos. Luego el buscador revisa escondites, casi siempre los más cercanos a él: ¡elige uno lejano! Si te encuentra pierdes una vida (tienes 3) y repites el escenario. Sobrevive a los 3 escenarios para ganar.',

    run(ctx) {
      const cfg = NIVELES[ctx.lv], { c, g } = RP.canvas(W, H, 'Escondidas vista desde arriba. Muévete con flechas o WASD hasta un escondite.');
      c.style.cssText = `display:block;width:100%;max-width:${W}px;margin:10px auto;border-radius:16px;border:1px solid rgba(29,37,32,.09);touch-action:none`;
      const hud = h('p', { class: 'g-info', 'aria-live': 'polite' }); ctx.el.append(c, hud);

      let ronda = 0, vidas = 3, score = 0, st = 'hide', mov = 0, esc, walls, spots, me, sk, tgt, hidden, visto, wait, rev, over = false, banner = '';
      const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      const upd = t => { hud.textContent = `Ronda ${ronda + 1}/3 · ${esc.n} · Vidas ${'❤️'.repeat(vidas)} · Pasos: ${mov} — ${t}`; };

      // Carga el escenario actual leyendo su mapa de texto
      const cargar = () => {
        esc = ESC[ronda]; walls = new Set(); spots = [];
        esc.mapa.forEach((row, y) => [...row].forEach((ch, x) => {
          if (ch === '#') walls.add(x + ',' + y); else if (ch === 'H') spots.push({ x, y, v: false });
          else if (ch === 'P') me = { x, y }; else if (ch === 'S') sk = { x, y };
        }));
        mov = cfg.mov; st = 'hide'; hidden = null; visto = false; rev = 0; banner = '';
        upd('el buscador está contando… ¡escóndete!');
      };

      // IA del buscador: con probabilidad p va al escondite más cercano; si no, a uno al azar
      const elegir = () => {
        const rest = spots.filter(s => !s.v);
        tgt = Math.random() < cfg.p ? rest.sort((a, b) => dist(a, sk) - dist(b, sk))[0] : rest[Math.random() * rest.length | 0];
        wait = 0;
      };
      const perder = txt => {                                     // te encontraron
        vidas--; st = 'fin'; visto = true; banner = txt; RP.sound.miss(); upd(txt);
        if (vidas <= 0) ctx.later(() => { over = true; ctx.end(score, false, `Te encontraron demasiadas veces. Superaste ${ronda} escenario(s).`); }, 1200);
        else ctx.later(cargar, 1500);
      };
      const superar = () => {                                     // sobreviviste al escenario
        score += 100 + vidas * 20 + mov * 5; st = 'fin'; banner = '¡Te salvaste!'; RP.sound.win(); ronda++; upd(banner);
        if (ronda >= 3) ctx.later(() => { over = true; ctx.end(score, true, `Sobreviviste a los 3 escenarios con ${vidas} vida(s).`); }, 1000);
        else ctx.later(cargar, 1500);
      };

      // Un paso del jugador = un turno
      const mover = (dx, dy) => {
        if (st !== 'hide') return;
        const nx = me.x + dx, ny = me.y + dy;
        if (nx < 0 || ny < 0 || nx >= CO || ny >= FI || walls.has(nx + ',' + ny)) return;
        me.x = nx; me.y = ny; mov--; RP.sound.click();
        const sp = spots.find(s => s.x === nx && s.y === ny);
        if (sp) { hidden = sp; st = 'seek'; sk = { ...sk }; elegir(); upd('escondido… el buscador te anda buscando'); }
        else if (mov <= 0) perder('Te quedaste a la vista');
        else upd('busca un escondite');
      };
      ctx.on(document, 'keydown', e => { const d = DIRS[e.key.toLowerCase()]; if (d && st === 'hide') { e.preventDefault(); mover(d[0], d[1]); } });
      ctx.on(c, 'pointerdown', e => {                             // táctil: avanza hacia donde tocas
        e.preventDefault(); if (!me) return; const r = c.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width * W - (me.x + .5) * CS, dy = (e.clientY - r.top) / r.height * H - (me.y + .5) * CS;
        Math.abs(dx) > Math.abs(dy) ? mover(Math.sign(dx), 0) : mover(0, Math.sign(dy));
      });

      const emoji = (t, x, y, s = 26) => { g.font = `${s}px serif`; g.fillText(t, (x + .5) * CS, (y + .5) * CS + 1); };
      const dibujar = () => {
        g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let y = 0; y < FI; y++) for (let x = 0; x < CO; x++) { g.fillStyle = (x + y) % 2 ? esc.bg : '#ffffff55'; g.fillRect(x * CS, y * CS, CS, CS); }
        walls.forEach(k => { const [x, y] = k.split(',').map(Number); emoji(esc.wall, x, y, 22); });
        for (const s of spots) {
          g.globalAlpha = s.v ? .4 : 1; emoji(esc.spot, s.x, s.y); g.globalAlpha = 1;
          if (s.v) { g.fillStyle = '#1d2520'; g.font = 'bold 14px sans-serif'; g.fillText('✔', (s.x + .8) * CS, (s.y + .25) * CS); }
        }
        if (hidden && !visto) { g.strokeStyle = '#3577a7'; g.lineWidth = 3; g.strokeRect(hidden.x * CS + 2, hidden.y * CS + 2, CS - 4, CS - 4); }  // marca tu escondite
        if (!hidden || visto) emoji('🧒', me.x, me.y);
        emoji('🕵️', sk.x, sk.y);
        if (banner) { g.fillStyle = 'rgba(29,37,32,.8)'; g.fillRect(0, H / 2 - 22, W, 44); g.fillStyle = '#fff'; g.font = 'bold 20px sans-serif'; g.fillText(banner, W / 2, H / 2); }
      };

      cargar();
      ctx.loop(dt => {
        if (over) return;
        if (st === 'seek') {                                      // el buscador camina hacia su objetivo y lo revisa
          const dx = tgt.x - sk.x, dy = tgt.y - sk.y, d = Math.hypot(dx, dy);
          if (d > .05) { const s = Math.min(d, 4 * dt); sk.x += dx / d * s; sk.y += dy / d * s; }
          else if ((wait += dt) > .8) {
            tgt.v = true; rev++; RP.sound.click();
            if (tgt === hidden) perder('¡Te encontró!'); else if (rev >= cfg.k) superar(); else elegir();
          }
        }
        dibujar();
      });
    }
  });
})();
