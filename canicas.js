/* CANICAS: física simple en canvas (velocidad, fricción, rebote en paredes, caída en hoyos si va lento). */
(() => {
  const { h } = RP, S = 300;
  RP.register({ name: 'Canicas',
    rules: '6 tiros. Arrastra hacia atrás como resortera y suelta, o usa ← → para apuntar, ↑ ↓ para la fuerza y Enter para tirar. La canica rebota y se frena sola; si pasa despacio sobre un hoyo, cae y suma sus puntos. Cada nivel achica los hoyos y pide más puntos.',
    run({ el, lv, end, on }) {
      const R = [20, 15, 11][lv], GOAL = [30, 50, 70][lv], X = 150, Y = 265, V = [10, 20, 30, 20, 10];
      const holes = [[55, 70], [150, 50], [245, 70], [90, 150], [210, 150]].map(([x, y], i) => ({ x, y, v: V[i] }));
      const cv = h('canvas', { width: S, height: S, class: 'ca-cv', tabindex: '0', role: 'img', 'aria-label': 'Mesa de canicas. Flechas para apuntar y fuerza, Enter para tirar.' }), g = cv.getContext('2d');
      const info = h('p', { class: 'g-info', 'aria-live': 'polite' }); el.append(cv, info);
      let m = { x: X, y: Y, vx: 0, vy: 0 }, ang = -Math.PI / 2, pw = 6, shots = 6, score = 0, mv = false, drag = null, raf, dead = false;
      const upd = (t = '') => { info.textContent = `Tiros: ${shots} · Puntos: ${score}/${GOAL} ${t}`; };
      const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * S / r.width, (e.clientY - r.top) * S / r.height]; };
      const shoot = () => { if (mv || shots < 1) return; shots--; m.vx = Math.cos(ang) * pw; m.vy = Math.sin(ang) * pw; mv = true; RP.sound.click(); upd(); };
      cv.addEventListener('pointerdown', e => { if (!mv) { drag = pt(e); cv.setPointerCapture(e.pointerId); } });
      cv.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = pt(e), dx = drag[0] - x, dy = drag[1] - y; ang = Math.atan2(dy, dx); pw = Math.min(9, Math.hypot(dx, dy) / 10); });
      cv.addEventListener('pointerup', () => { if (drag) { drag = null; if (pw > 1.5) shoot(); } });
      on(cv, 'keydown', e => {
        const k = e.key; if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(k)) return; e.preventDefault();
        if (k === 'ArrowLeft') ang -= .08; else if (k === 'ArrowRight') ang += .08;
        else if (k === 'ArrowUp') pw = Math.min(9, pw + .5); else if (k === 'ArrowDown') pw = Math.max(1.5, pw - .5); else shoot();
      });
      const done = t => {
        mv = false; m = { x: X, y: Y, vx: 0, vy: 0 }; upd(t);
        if (score >= GOAL) end(score, true, '¡Alcanzaste la meta!'); else if (shots < 1) end(score, false, `Te faltaron ${GOAL - score} puntos.`);
      };
      const step = () => {
        if (mv) {
          m.x += m.vx; m.y += m.vy; m.vx *= .975; m.vy *= .975;                       // fricción
          if (m.x < 8 || m.x > S - 8) { m.vx *= -.8; m.x = Math.max(8, Math.min(S - 8, m.x)); }  // rebote
          if (m.y < 8 || m.y > S - 8) { m.vy *= -.8; m.y = Math.max(8, Math.min(S - 8, m.y)); }
          const sp = Math.hypot(m.vx, m.vy), hl = holes.find(o => Math.hypot(o.x - m.x, o.y - m.y) < R);
          if (hl && sp < 5) { score += hl.v; RP.sound.hit(); done(`¡Hoyo de ${hl.v}!`); } else if (sp < .15) { RP.sound.miss(); done('Se quedó corto.'); }
        }
        draw(); if (!dead) raf = requestAnimationFrame(step);
      };
      const draw = () => {
        g.fillStyle = '#e6d9b8'; g.fillRect(0, 0, S, S); g.textAlign = 'center'; g.font = 'bold 12px sans-serif';
        holes.forEach(o => { g.fillStyle = '#222'; g.beginPath(); g.arc(o.x, o.y, R, 0, 7); g.fill(); g.fillStyle = '#f5d142'; g.fillText(o.v, o.x, o.y + 4); });
        if (!mv) { g.strokeStyle = '#c94a37'; g.lineWidth = 3; g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x + Math.cos(ang) * pw * 12, m.y + Math.sin(ang) * pw * 12); g.stroke(); }
        g.fillStyle = '#1a5c8a'; g.beginPath(); g.arc(m.x, m.y, 8, 0, 7); g.fill();
      };
      upd(); step();
      return () => { dead = true; cancelAnimationFrame(raf); };
    } });
})();
