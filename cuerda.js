/* CUERDA — saltar la cuerda con ritmo. Usa solo la API pública de RP. */
(() => {
  const h = RP.h, W = 320, H = 260, GY = 200, PY = GY - 55;  // PY = altura de los puntos donde giran la cuerda
  // Por nivel: periodo inicial de una vuelta (s) y meta de saltos
  const NIVELES = [{ per: 1.1, meta: 30 }, { per: .9, meta: 50 }, { per: .75, meta: 80 }];

  RP.register({
    id: 'cuerda', name: 'Cuerda', levels: ['Fácil', 'Medio', 'Difícil'],
    description: 'Salta justo cuando la cuerda pasa por abajo.',
    rules: 'Dos amigos giran la cuerda. Presiona Espacio, ↑ o toca la pantalla para saltar: tienes que estar en el aire cuando la cuerda pase por abajo. La cuerda se acelera cada 10 saltos. Cada 10 saltos seguidos sube el multiplicador (hasta x4). Tienes 3 vidas; cada tropiezo quita una. Meta: 30 saltos (fácil), 50 (medio) u 80 (difícil).',

    run(ctx) {
      const cfg = NIVELES[ctx.lv], { c, g } = RP.canvas(W, H, 'Saltar la cuerda. Espacio o toque para saltar.');
      c.style.cssText = `display:block;width:100%;max-width:${W}px;margin:10px auto;border-radius:16px;border:1px solid rgba(29,37,32,.09);touch-action:none`;
      const hud = h('p', { class: 'g-info', 'aria-live': 'polite' }); ctx.el.append(c, hud);

      let T = 0, ready = 1, phi = -Math.PI / 2, tj = -9, saltos = 0, combo = 0, vidas = 3, score = 0, over = false, msg = '¡Prepárate!', msgT = 1;
      const mult = () => Math.min(4, 1 + Math.floor(combo / 10));
      const periodo = () => Math.max(.42, cfg.per / (1 + .1 * Math.floor(saltos / 10)));   // +10 % de velocidad cada 10 saltos
      const dur = () => Math.min(.5, periodo() * .8);                                     // duración del salto
      const alto = () => { const k = (T - tj) / dur(); return k >= 0 && k <= 1 ? Math.sin(Math.PI * k) : 0; };  // 0..1
      const upd = () => { hud.textContent = `Saltos ${saltos}/${cfg.meta} · Vidas ${'❤️'.repeat(vidas)} · Combo x${mult()} · Puntos ${score}`; };
      const aviso = t => { msg = t; msgT = .6; };

      const saltar = () => { if (!over && ready <= 0 && T - tj > dur() * .6) { tj = T; RP.sound.click(); } };
      ctx.on(document, 'keydown', e => { if ((e.code === 'Space' || e.key === 'ArrowUp') && !e.repeat) { e.preventDefault(); saltar(); } });
      ctx.on(c, 'pointerdown', e => { e.preventDefault(); saltar(); });

      const fin = win => {
        over = true;
        ctx.end(score, win, win ? `¡${saltos} saltos! Terminaste la meta con ${vidas} vida(s).` : `Te quedaste en ${saltos} de ${cfg.meta} saltos.`);
      };

      const dibujar = () => {
        const off = alto() * 70;                                  // altura del salto en píxeles
        g.fillStyle = '#fff3d6'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#c9b88a'; g.fillRect(0, GY, W, H - GY);   // piso
        // Cuerda: curva cuadrática entre los dos puntos de giro; el punto medio sube/baja con sin(phi)
        g.strokeStyle = '#a93627'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, PY);
        g.quadraticCurveTo(W / 2, PY + 2 * 62 * Math.sin(phi), W - 30, PY); g.stroke();
        g.font = '30px serif'; g.textAlign = 'center'; g.fillText('🧍', 30, PY + 14); g.fillText('🧍', W - 30, PY + 14);   // quienes giran
        // Jugador: monito simple con colores de la bandera
        const x = W / 2, y = GY - off;
        g.fillStyle = '#0d654f'; g.fillRect(x - 9, y - 42, 18, 26);          // cuerpo
        g.fillStyle = '#e0a935'; g.beginPath(); g.arc(x, y - 52, 11, 0, 7); g.fill();   // cabeza
        g.strokeStyle = '#c94a37'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 5, y - 16); g.lineTo(x - 5, y); g.moveTo(x + 5, y - 16); g.lineTo(x + 5, y); g.stroke();
        if (msgT > 0) { g.fillStyle = '#1d2520'; g.font = 'bold 20px sans-serif'; g.fillText(msg, W / 2, 34); }
      };

      ctx.loop(dt => {
        if (over) return; T += dt; msgT -= dt;
        if (ready > 0) { ready -= dt; dibujar(); if (ready <= 0) upd(); return; }   // cuenta de preparación: la cuerda aún no gira
        const antes = phi; phi += 2 * Math.PI * dt / periodo();
        const cruza = Math.floor((phi - Math.PI / 2) / (2 * Math.PI)) > Math.floor((antes - Math.PI / 2) / (2 * Math.PI));  // pasó por abajo
        if (cruza) {
          if (alto() > .3) {                                       // estaba en el aire: salto válido
            saltos++; combo++; score += 10 * mult(); RP.sound.hit(); aviso(saltos % 10 === 0 ? '¡Más rápido!' : '¡Salto!');
            if (saltos >= cfg.meta) { upd(); return fin(true); }
          } else {                                                 // la cuerda lo alcanzó
            vidas--; combo = 0; RP.sound.miss(); aviso('¡Tropezaste!');
            if (vidas <= 0) { upd(); return fin(false); }
          }
          upd();
        }
        dibujar();
      });
    }
  });
})();
