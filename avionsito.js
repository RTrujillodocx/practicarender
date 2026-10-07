/* ============================================================
   AVIONSITO ✈️ — Avión de papel de vuelo lateral
   Mantén pulsado (clic / tap / Espacio / ↑) para subir el morro; suelta para picar.
   Subir gasta velocidad; picar la recupera. El viento empuja y las térmicas dan sustentación.
   ============================================================ */
(() => {
  const h = RP.h;
  const W = 480, H = 300, SUELO = H - 32, PX = 130;      // PX = posición horizontal del avión en pantalla
  const G = 380, VMIN = 110, VMAX = 520, ALT_MAX = 240;  // gravedad, pérdida de sustentación, tope de velocidad y de altura

  /* Modelos: v0 = velocidad inicial, giro = agilidad (rad/s), caida = descenso natural (px/s),
     drag = resistencia del aire, viento = cuánto le afecta el viento */
  const MODELOS = [
    { n: 'Clásico',   d: 'Equilibrado y fácil de controlar.',                              v0: 270, giro: 2.2, caida: 20, drag: .060, viento: 1,   color: '#ffffff' },
    { n: 'Dardo',     d: 'Pesado y veloz: gana mucha velocidad al picar, el viento le afecta poco.', v0: 330, giro: 1.7, caida: 32, drag: .032, viento: .5,  color: '#f8d7d0' },
    { n: 'Planeador', d: 'Ligero y ágil: planea mucho, pero el viento lo empuja más.',      v0: 230, giro: 2.8, caida: 12, drag: .085, viento: 1.6, color: '#d8ecf8' }
  ];
  /* Dificultad: meta (m), viento (amplitud px/s), separación entre térmicas y entre aros (px), ancho/fuerza de térmicas */
  const NIV = [
    { meta: 150, vientoAmp: 15, termicas: [380, 520], ancho: 240, fuerza: 190, aros: [260, 380] },
    { meta: 250, vientoAmp: 35, termicas: [500, 700], ancho: 200, fuerza: 160, aros: [320, 460] },
    { meta: 300, vientoAmp: 60, termicas: [620, 860], ancho: 180, fuerza: 140, aros: [380, 540] }
  ];
  const rnd = ([a, b]) => a + Math.random() * (b - a);

  /* ---- Mundo: térmicas y aros se generan según avanza el avión ---- */
  const crearMundo = () => ({ termicas: [], aros: [], sigT: 250, sigA: 320, fase: Math.random() * 6.28 });
  const extender = (m, cfg, hasta) => {
    while (m.sigT < hasta) { m.termicas.push({ x: m.sigT, w: cfg.ancho, f: cfg.fuerza }); m.sigT += rnd(cfg.termicas); }
    while (m.sigA < hasta) { m.aros.push({ x: m.sigA, y: 60 + Math.random() * 150, r: 30, ok: false }); m.sigA += rnd(cfg.aros); }
  };
  const viento = (t, cfg, mundo) => cfg.vientoAmp * Math.sin(t * .7 + mundo.fase);

  /* ---- Física (función pura: fácil de probar y ajustar) ---- */
  const fisica = (a, m, cfg, subir, dt, mundo) => {
    let obj = subir ? .6 : -.38;                          // ángulo objetivo del morro
    if (a.v < VMIN) obj = -.5;                            // pérdida de sustentación: el avión pica solo
    const paso = m.giro * dt;
    a.th += Math.max(-paso, Math.min(paso, obj - a.th));
    a.v += (-G * Math.sin(a.th) - m.drag * a.v * a.v / 100) * dt;   // subir frena, picar acelera, el aire frena
    a.v = Math.max(60, Math.min(VMAX, a.v));
    let vy = a.v * Math.sin(a.th) - m.caida;
    if (a.v < VMIN) vy -= (VMIN - a.v) * 1.6;
    for (const t of mundo.termicas) if (a.x >= t.x && a.x <= t.x + t.w) {
      const k = (a.x - t.x) / t.w; vy += t.f * (1 - Math.abs(k * 2 - 1) * .5);   // más fuerte al centro
    }
    a.x += (a.v * Math.cos(a.th) + viento(a.t, cfg, mundo) * m.viento) * dt;
    a.y += vy * dt;
    if (a.y > ALT_MAX) { a.y = ALT_MAX; if (a.th > 0) a.th = 0; }
    a.t += dt;
  };

  RP.register({
    id: 'avionsito', name: 'Avionsito', levels: ['Fácil', 'Medio', 'Difícil'],
    description: 'Lanza tu avión de papel, aprovecha las térmicas, cruza los aros y llega lo más lejos posible.',
    rules: 'Elige un avión y lánzalo. Mantén pulsado (clic, tap, Espacio o ↑) para subir el morro; suelta para picar. ' +
           'Subir gasta velocidad y picar la recupera: si te quedas sin velocidad, el avión cae. Busca las columnas amarillas (térmicas) para ganar altura ' +
           'y cruza los aros (+50 pts y un empujón). Puntos = metros + aros. Ganas si llegas a la meta antes de aterrizar.',

    /* Expuesto solo para pruebas automáticas */
    _test: { fisica, crearMundo, extender, MODELOS, NIV },

    run(ctx) {
      const cfg = NIV[ctx.lv];

      /* ---- Pantalla de elección de avión ---- */
      ctx.el.append(
        h('p', { class: 'g-rules' }, `Meta: ${cfg.meta} m. Elige tu avión:`),
        h('div', { class: 'g-levels', role: 'group', 'aria-label': 'Modelo de avión' },
          ...MODELOS.map(m => h('button', { class: 'g-btn', type: 'button', style: 'flex:1 1 100%;text-align:left;min-height:56px',
            onclick: () => iniciar(m) }, `✈️ ${m.n} — ${m.d}`))));

      const iniciar = m => {
        ctx.el.replaceChildren();
        const { c, g } = RP.canvas(W, H, 'Vuelo del avión de papel: mantén pulsado para subir');
        const hud = h('p', { class: 'g-info' });
        const btn = h('button', { class: 'g-btn', type: 'button', style: 'width:100%;margin-top:10px;touch-action:none' }, '⬆ Mantén para subir (Espacio)');
        ctx.el.append(c, hud, btn);

        const mundo = crearMundo();
        const a = { x: 0, y: 150, th: .25, v: m.v0, t: 0 };
        let subir = false, aros = 0, metaOk = false, hudT = 0, aviso = '', avisoT = 0;
        const estela = [];
        extender(mundo, cfg, W + 200);
        const dist = () => Math.floor(a.x / 10);
        const decir = t => { aviso = t; avisoT = 1.4; };

        /* ---- Entradas: mantener = subir ---- */
        const arriba = v => () => { subir = v; };
        ctx.on(c, 'pointerdown', e => { e.preventDefault(); subir = true; });
        ctx.on(btn, 'pointerdown', e => { e.preventDefault(); subir = true; });
        ctx.on(window, 'pointerup', arriba(false));
        ctx.on(window, 'pointercancel', arriba(false));
        const tecla = e => e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
        ctx.on(document, 'keydown', e => { if (tecla(e)) { e.preventDefault(); subir = true; } });
        ctx.on(document, 'keyup', e => { if (tecla(e)) subir = false; });

        const aterrizar = () => {
          const d = dist(), score = d + aros * 50, gana = d >= cfg.meta;
          ctx.end(score, gana, `${m.n}: ${d} m recorridos, ${aros} aro${aros === 1 ? '' : 's'}. ` + (gana ? '¡Alcanzaste la meta!' : `Te faltaron ${cfg.meta - d} m para la meta.`));
        };

        /* ---- Dibujo ---- */
        const mod = (v, n) => ((v % n) + n) % n;
        const dibujar = () => {
          const cam = a.x - PX, sy = y => SUELO - y;
          const cielo = g.createLinearGradient(0, 0, 0, SUELO); cielo.addColorStop(0, '#8fd0f0'); cielo.addColorStop(1, '#fff1cf');
          g.fillStyle = cielo; g.fillRect(0, 0, W, H);
          g.fillStyle = 'rgba(255,255,255,.85)';                                  // nubes con parallax
          for (let i = 0; i < 5; i++) { const x = mod(i * 190 - cam * .3, W + 140) - 70, y = 40 + (i * 53) % 110; g.beginPath(); g.ellipse(x, y, 38, 13, 0, 0, 6.3); g.ellipse(x + 22, y - 8, 26, 12, 0, 0, 6.3); g.fill(); }
          for (const t of mundo.termicas) {                                       // térmicas
            const x = t.x - cam; if (x > W || x + t.w < 0) continue;
            g.fillStyle = 'rgba(255,225,110,.28)'; g.fillRect(x, sy(ALT_MAX), t.w, ALT_MAX);
            g.fillStyle = 'rgba(224,169,53,.7)'; g.font = '16px sans-serif'; g.textAlign = 'center';
            for (let k = 0; k < 4; k++) g.fillText('↑', x + t.w * (k + .5) / 4, sy(40 + ((a.t * 60 + k * 50) % ALT_MAX)));
          }
          g.fillStyle = '#7a9b4a'; g.fillRect(0, SUELO, W, H - SUELO);             // suelo
          const cols = ['#c94a37', '#0d654f', '#e0a935'];                          // banderitas de papel picado
          for (let x = -mod(cam, 120), i = Math.floor(cam / 120); x < W + 120; x += 120, i++) {
            g.fillStyle = cols[mod(i, 3)]; g.beginPath(); g.moveTo(x, SUELO); g.lineTo(x + 14, SUELO); g.lineTo(x + 7, SUELO + 16); g.fill();
          }
          const xm = cfg.meta * 10 - cam;                                          // meta
          if (xm > -20 && xm < W + 20) { g.fillStyle = '#4a3a22'; g.fillRect(xm, SUELO - 90, 3, 90); g.fillStyle = '#c94a37'; g.fillRect(xm + 3, SUELO - 90, 34, 22); g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'left'; g.fillText('META', xm + 6, SUELO - 74); }
          for (const r of mundo.aros) {                                            // aros
            const x = r.x - cam; if (x > W + 20 || x < -20) continue;
            g.strokeStyle = r.ok ? '#1fad72' : '#e0a935'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, sy(r.y), 8, r.r, 0, 0, 6.3); g.stroke();
          }
          g.fillStyle = 'rgba(255,255,255,.55)';                                   // estela
          estela.forEach((p, i) => { g.beginPath(); g.arc(p.x - cam, sy(p.y), 1 + i * .12, 0, 6.3); g.fill(); });
          g.save(); g.translate(PX, sy(a.y)); g.rotate(-a.th);                     // avión de papel
          g.fillStyle = m.color; g.strokeStyle = '#555'; g.lineWidth = 1.5;
          g.beginPath(); g.moveTo(24, 0); g.lineTo(-16, -9); g.lineTo(-8, 1); g.lineTo(-16, 8); g.closePath(); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(24, 0); g.lineTo(-8, 1); g.stroke(); g.restore();
          if (avisoT > 0) { g.globalAlpha = Math.min(1, avisoT * 2); g.fillStyle = '#0d654f'; g.textAlign = 'center'; g.font = 'bold 20px DM Sans, sans-serif'; g.fillText(aviso, W / 2, 34); g.globalAlpha = 1; }
        };

        /* ---- Bucle principal ---- */
        ctx.loop(dt => {
          const antes = a.x;
          fisica(a, m, cfg, subir, dt, mundo);
          extender(mundo, cfg, a.x + W + 200);
          estela.push({ x: a.x, y: a.y }); if (estela.length > 22) estela.shift();
          for (const r of mundo.aros) {                                           // ¿cruzó un aro?
            if (!r.ok && antes < r.x && a.x >= r.x && Math.abs(a.y - r.y) <= r.r + 6) {
              r.ok = true; aros++; a.v = Math.min(VMAX, a.v + 35); a.y = Math.min(ALT_MAX, a.y + 25);
              decir('¡Aro! +50'); RP.sound.hit();
            }
          }
          if (!metaOk && dist() >= cfg.meta) { metaOk = true; decir('¡Meta alcanzada!'); RP.sound.card(); }
          avisoT = Math.max(0, avisoT - dt);
          hudT -= dt; if (hudT <= 0) {
            hudT = .15; const w = viento(a.t, cfg, mundo) * m.viento / 10;
            hud.textContent = `Distancia ${dist()} m / ${cfg.meta} · Altura ${Math.round(a.y / 2)} · Aros ${aros} · Viento ${w >= 0 ? '→' : '←'} ${Math.abs(Math.round(w))}`;
          }
          dibujar();
          if (a.y <= 0) { a.y = 0; aterrizar(); } else if (a.t > 150) aterrizar();
        });
      };
    }
  });
})();
