/* BALERO — ritmo estilo Guitar Hero. Usa solo la API pública de RP (h, canvas, register, ctx.*). */
(() => {
  const h = RP.h, W = 280, H = 320, LY = 270;              // tamaño lógico del canvas y línea de golpeo
  const KEYS = ['d', 'f', 'j', 'k'], COL = ['#c94a37', '#0d654f', '#e0a935', '#3577a7'];
  // Por nivel: tiempo de caída (s), separación entre notas (s), ventanas Perfect/Good (s) y % mínimo para ganar
  const NIVELES = [
    { tr: 1.8, gap: .80, pf: .09, gd: .18, need: .6 },
    { tr: 1.4, gap: .62, pf: .07, gd: .14, need: .7 },
    { tr: 1.1, gap: .48, pf: .055, gd: .11, need: .8 }];

  RP.register({
    id: 'balero', name: 'Balero', levels: ['Fácil', 'Medio', 'Difícil'],
    description: 'Ritmo de 4 carriles: golpea cada nota al cruzar la línea.',
    rules: 'Caen notas por 4 carriles durante ~30 segundos. Pulsa D, F, J, K (o toca el carril en pantalla) justo cuando la nota cruce la línea. Perfect = 100, Good = 60, Miss = 0. Cada 10 aciertos seguidos sube el multiplicador (hasta x4). Necesitas 60 % de aciertos en fácil, 70 % en medio y 80 % en difícil.',

    run(ctx) {
      const cfg = NIVELES[ctx.lv], { c, g } = RP.canvas(W, H, 'Balero: cuatro carriles de ritmo. Teclas D, F, J, K.');
      c.style.cssText = `display:block;width:100%;max-width:${W}px;margin:10px auto;border-radius:16px;border:1px solid rgba(29,37,32,.09);touch-action:none`;
      const hud = h('p', { class: 'g-info' }, 'Prepárate…'); ctx.el.append(c, hud);

      // Notas: t = segundo (de la canción) en que cruzan la línea; s = estado (0 pendiente, 1 good, 2 miss, 3 perfect)
      const N = Math.floor(28 / cfg.gap);
      const notas = Array.from({ length: N }, (_, i) => ({ l: Math.random() * 4 | 0, t: cfg.tr + .4 + i * cfg.gap, s: 0 }));
      let T = 0, score = 0, combo = 0, mejor = 0, over = false, fb = '', fbT = 0, fbC = '#fff';
      const cnt = { 3: 0, 1: 0, 2: 0 }, flash = [0, 0, 0, 0];
      const mult = () => Math.min(4, 1 + Math.floor(combo / 10));
      const juicio = (txt, col) => { fb = txt; fbC = col; fbT = .5; hud.textContent = `Perfect ${cnt[3]} · Good ${cnt[1]} · Miss ${cnt[2]} · Mejor racha ${mejor}`; };

      // Golpe en un carril: busca la nota pendiente más cercana dentro de la ventana "Good"
      const golpe = l => {
        if (over) return; flash[l] = .15; let n = null;
        for (const o of notas) if (o.l === l && !o.s && Math.abs(o.t - T) <= cfg.gd && (!n || Math.abs(o.t - T) < Math.abs(n.t - T))) n = o;
        if (!n) { combo = 0; RP.sound.miss(); return; }          // golpe en vacío: rompe la racha
        const perfecto = Math.abs(n.t - T) <= cfg.pf;
        n.s = perfecto ? 3 : 1; cnt[n.s]++; combo++; mejor = Math.max(mejor, combo);
        score += (perfecto ? 100 : 60) * mult(); RP.sound.hit();
        juicio(perfecto ? '¡Perfect!' : 'Good', perfecto ? '#f5d142' : '#9be3c1');
      };

      ctx.on(document, 'keydown', e => { const l = KEYS.indexOf(e.key.toLowerCase()); if (l >= 0 && !e.repeat) golpe(l); });
      ctx.on(c, 'pointerdown', e => {                           // táctil: el carril sale de la posición X del toque
        e.preventDefault(); const r = c.getBoundingClientRect();
        golpe(Math.max(0, Math.min(3, Math.floor((e.clientX - r.left) / r.width * 4))));
      });

      const dibujar = () => {
        g.fillStyle = '#faf7ef'; g.fillRect(0, 0, W, H);
        for (let l = 0; l < 4; l++) {
          g.fillStyle = flash[l] > 0 ? 'rgba(224,169,53,.35)' : l % 2 ? '#f1ead8' : '#faf7ef'; g.fillRect(l * W / 4, 0, W / 4, H);
          g.fillStyle = '#59605b'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText(KEYS[l].toUpperCase(), (l + .5) * W / 4, H - 12);
        }
        g.fillStyle = '#1d2520'; g.fillRect(0, LY - 2, W, 4);   // zona de golpeo
        for (const o of notas) {
          if (o.s) continue; const y = LY * (1 - (o.t - T) / cfg.tr); if (y < -20) continue;
          g.fillStyle = COL[o.l]; g.beginPath(); g.arc((o.l + .5) * W / 4, y, 14, 0, 7); g.fill();
        }
        g.textAlign = 'left'; g.fillStyle = '#1d2520'; g.font = 'bold 13px sans-serif'; g.fillText(`Puntos ${score}  ·  Combo ${combo} (x${mult()})`, 8, 18);
        if (fbT > 0) { g.textAlign = 'center'; g.fillStyle = '#1d2520'; g.font = 'bold 20px sans-serif'; g.fillText(fb, W / 2, 60); g.fillStyle = fbC; g.fillText(fb, W / 2 - 1, 59); }
      };

      ctx.loop(dt => {
        if (over) return; T += dt; fbT -= dt; for (let i = 0; i < 4; i++) flash[i] -= dt;
        for (const o of notas) if (!o.s && T > o.t + cfg.gd) { o.s = 2; cnt[2]++; combo = 0; juicio('Miss', '#e56b55'); }  // nota que se pasó
        dibujar();
        if (T > notas[N - 1].t + cfg.gd + .4) {                  // fin de la canción
          over = true; const acc = (cnt[3] + cnt[1]) / N;
          ctx.end(score, acc >= cfg.need, `Perfect ${cnt[3]}, Good ${cnt[1]}, Miss ${cnt[2]} (${Math.round(acc * 100)} % de aciertos). Mejor racha: ${mejor}.`);
        }
      });
    }
  });
})();
