/* ============================================================
   YOYO 🪀 — Juego de timing estilo "Guitar Hero"
   Un indicador va y viene por una barra; una zona verde se mueve.
   Pulsa (clic / tap / Espacio) cuando el indicador esté dentro de la zona.
   Contrato con core.js: RP.register({ name, rules, run(ctx) }) — run() dibuja y
   usa ctx.loop / ctx.later / ctx.on, así RP.unmount() limpia todo solo.
   ============================================================ */
(() => {
  const h = RP.h;

  /* Trucos desbloqueables: se ejecutan al llegar al combo indicado y dan puntos extra.
     El primer desbloqueo de cada uno se guarda en localStorage (persistence.js). */
  const TRUCOS = [
    { n: 'Dormilón',        combo: 3,  bonus: 100 },
    { n: 'Paseíto',         combo: 6,  bonus: 200 },
    { n: 'Tobogán',         combo: 10, bonus: 300 },
    { n: 'Columpio',        combo: 14, bonus: 400 },
    { n: 'Vuelta al mundo', combo: 18, bonus: 600 }
  ];

  /* Dificultad: vel = anchos de barra por segundo; zona = semiancho de la zona (fracción de la barra);
     mov = rapidez con que se mueve la zona; amp = cuánto se desplaza la zona; vidas = fallos permitidos */
  const NIVELES = [
    { vel: .55, zona: .12,  mov: .7,  amp: .14, vidas: 5 },
    { vel: .85, zona: .09,  mov: 1.0, amp: .24, vidas: 4 },
    { vel: 1.15, zona: .065, mov: 1.4, amp: .30, vidas: 3 }
  ];
  const TOTAL = 20;                        // jugadas por partida
  const W = 480, H = 270, BX0 = 30, BX1 = 450, BY = 222, BH = 26;

  RP.register({
    id: 'yoyo', name: 'Yoyo', levels: ['Fácil', 'Medio', 'Difícil'],
    description: 'Domina el timing: pulsa justo cuando el indicador cruce la zona verde y encadena trucos.',
    rules: `Un indicador rojo recorre la barra y una zona verde se mueve. Pulsa ¡AHORA! (o Espacio, o toca la pantalla) cuando el indicador esté dentro de la zona. ` +
           `Centro de la zona = PERFECTO (100 pts); resto = Bien (60 pts). Los aciertos seguidos suben el combo (hasta ×4) y desbloquean trucos con puntos extra. ` +
           `Cada fallo te quita una vida. Completa ${TOTAL} jugadas sin quedarte sin vidas para ganar.`,

    run(ctx) {
      const cfg = NIVELES[ctx.lv];
      const { c, g } = RP.canvas(W, H, 'Juego del yoyo: pulsa cuando el indicador rojo esté dentro de la zona verde');
      const hud = h('p', { class: 'g-info', role: 'status', 'aria-live': 'polite' });
      const trucosEl = h('p', { class: 'g-info', style: 'font-size:.72rem' });
      const btn = h('button', { class: 'g-btn', type: 'button', style: 'width:100%;margin-top:10px' }, '¡AHORA! (Espacio)');
      ctx.el.append(c, hud, btn, trucosEl);

      let desbloq = RP.store.get('yoyo:trucos', []);   // trucos ya desbloqueados en partidas previas
      const st = { t: 0, fase: 0, zt: 0, score: 0, combo: 0, maxCombo: 0, vidas: cfg.vidas, jugada: 0,
                   fin: false, bloqueo: 0, msg: '', msgT: 0, msgCol: '#0d654f', truco: null, trucoT: 0 };

      /* ---- Utilidades de estado ---- */
      const mult = () => 1 + Math.min(3, Math.floor(st.combo / 4) * .5);        // multiplicador de combo (1 a 4)
      const marcador = () => { const p = st.fase % 2; return p < 1 ? p : 2 - p; }; // ping-pong 0..1
      const centro = () => .5 + cfg.amp * Math.sin(st.zt);                       // centro de la zona (móvil)
      const msg = (t, col) => { st.msg = t; st.msgCol = col; st.msgT = 1; };
      const pintarHud = () => {
        hud.textContent = `Puntos ${st.score} · Combo ${st.combo} (×${mult()}) · Vidas ${'❤'.repeat(st.vidas)} · Jugada ${Math.min(st.jugada + 1, TOTAL)}/${TOTAL}`;
      };
      const pintarTrucos = () => {
        trucosEl.textContent = 'Trucos: ' + TRUCOS.map(t => `${desbloq.includes(t.n) ? '✅' : '🔒'} ${t.n} (combo ${t.combo})`).join(' · ');
      };

      /* ---- Acción principal: el jugador pulsa ---- */
      const tap = () => {
        if (st.fin || st.bloqueo > 0) return;
        st.bloqueo = .18;                                   // evita pulsaciones dobles accidentales
        const d = Math.abs(marcador() - centro());
        st.jugada++;
        if (d <= cfg.zona) {                                // ACIERTO
          const perfecto = d <= cfg.zona * .35;
          st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
          const pts = Math.round((perfecto ? 100 : 60) * mult());
          st.score += pts;
          msg(perfecto ? `¡PERFECTO! +${pts}` : `¡Bien! +${pts}`, perfecto ? '#0d654f' : '#3577a7');
          RP.sound.hit();
          const i = TRUCOS.findIndex(t => t.combo === st.combo);   // ¿toca truco?
          if (i >= 0) {
            const tr = TRUCOS[i]; st.score += tr.bonus; st.truco = i; st.trucoT = 0;
            msg(`🪀 ${tr.n}! +${tr.bonus}`, '#c94a37'); RP.sound.card();
            if (!desbloq.includes(tr.n)) {                          // primer desbloqueo → se guarda
              desbloq = [...desbloq, tr.n]; RP.store.set('yoyo:trucos', desbloq); pintarTrucos();
              document.dispatchEvent(new CustomEvent('rp:trick', { detail: { game: 'Yoyo', trick: tr.n } })); // gancho p/ logros
            }
          }
        } else {                                            // FALLO
          st.combo = 0; st.vidas--; msg('¡Fallaste!', '#c94a37'); RP.sound.miss();
        }
        pintarHud();
        if (st.vidas <= 0) {
          st.fin = true;
          ctx.later(() => ctx.end(st.score, false, `Te quedaste sin vidas en la jugada ${st.jugada}. Mejor combo: ${st.maxCombo}.`), 700);
        } else if (st.jugada >= TOTAL) {
          st.fin = true;
          ctx.later(() => ctx.end(st.score, true, `¡${TOTAL} jugadas completadas! Mejor combo: ${st.maxCombo}. Vidas restantes: ${st.vidas}.`), 700);
        }
      };

      /* ---- Dibujo ---- */
      const dibujar = () => {
        const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#fff6e0'); gr.addColorStop(1, '#f6e3b8');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);

        // Posición del yoyo (reposo: sube y baja; truco: trayectoria especial 1.4 s)
        const cx = W / 2, mano = 28;
        let x = cx, y = 95 + (Math.sin(st.t * 4) + 1) * 30, giro = st.t * 8;
        if (st.truco !== null) {
          const T = st.trucoT, p = T / 1.4;
          switch (st.truco) {
            case 0: y = 175; giro = st.t * 30; break;                                   // Dormilón: gira abajo
            case 1: x = cx + Math.sin(T * 6) * 100; y = 160; break;                     // Paseíto: camina de lado
            case 2: x = cx - 110 + p * 220; y = 80 + p * 90; break;                     // Tobogán: diagonal
            case 3: { const a = Math.sin(T * 5) * 1.1; x = cx + Math.sin(a) * 130; y = mano + Math.cos(a) * 130; break; } // Columpio
            default: { const a = T * 7; x = cx + Math.cos(a) * 100; y = 110 + Math.sin(a) * 70; }                         // Vuelta al mundo
          }
        }
        g.strokeStyle = '#6e4a24'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, mano); g.lineTo(x, y); g.stroke();
        g.fillStyle = '#8a5a2b'; g.beginPath(); g.arc(cx, mano, 10, 0, 6.3); g.fill();
        g.fillStyle = '#c94a37'; g.beginPath(); g.arc(x, y, 22, 0, 6.3); g.fill();
        g.strokeStyle = '#e0a935'; g.lineWidth = 4; g.stroke();
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath();
        g.moveTo(x + Math.cos(giro) * 14, y + Math.sin(giro) * 14); g.lineTo(x - Math.cos(giro) * 14, y - Math.sin(giro) * 14); g.stroke();

        // Barra, zona y marcador
        const ancho = BX1 - BX0, zc = centro();
        g.fillStyle = '#e9e1cf'; g.fillRect(BX0, BY, ancho, BH);
        g.fillStyle = '#1fad72'; g.fillRect(BX0 + (zc - cfg.zona) * ancho, BY, cfg.zona * 2 * ancho, BH);
        g.fillStyle = '#0d654f'; g.fillRect(BX0 + (zc - cfg.zona * .35) * ancho, BY, cfg.zona * .7 * ancho, BH);
        g.fillStyle = '#c94a37'; g.fillRect(BX0 + marcador() * ancho - 3, BY - 8, 6, BH + 16);

        // Combo y mensaje
        g.textAlign = 'left'; g.fillStyle = '#6e4a24'; g.font = 'bold 15px DM Sans, sans-serif';
        g.fillText(`Combo ×${mult()}`, 14, 24);
        if (st.msgT > 0) {
          g.globalAlpha = Math.min(1, st.msgT * 2); g.fillStyle = st.msgCol; g.textAlign = 'center';
          g.font = 'bold 20px DM Sans, sans-serif'; g.fillText(st.msg, W / 2, H - 8); g.globalAlpha = 1;
        }
      };

      /* ---- Entradas (todas rastreadas por ctx.on → se limpian solas) ---- */
      ctx.on(document, 'keydown', e => {
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); }
      });
      ctx.on(btn, 'pointerdown', e => { e.preventDefault(); tap(); });
      ctx.on(c, 'pointerdown', e => { e.preventDefault(); tap(); });

      pintarHud(); pintarTrucos();
      ctx.loop(dt => {
        st.t += dt; st.zt += dt * cfg.mov;
        st.fase += dt * cfg.vel * (1 + st.jugada * .02);    // acelera 2% por jugada
        st.bloqueo = Math.max(0, st.bloqueo - dt); st.msgT = Math.max(0, st.msgT - dt);
        if (st.truco !== null) { st.trucoT += dt; if (st.trucoT > 1.4) st.truco = null; }
        dibujar();
      });
    }
  });
})();
