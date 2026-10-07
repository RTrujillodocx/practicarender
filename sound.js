/* SONIDO con Web Audio API (sin archivos). Se crea el AudioContext al primer uso (política de autoplay). */
(() => {
  let ctx;
  const t = (f, d, type = 'sine', v = .15, at = 0) => { try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain(), s = ctx.currentTime + at;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(.001, s + d);
    o.connect(g).connect(ctx.destination); o.start(s); o.stop(s + d); } catch {} };
  RP.sound = {
    click: () => t(520, .06, 'square', .06), hit: () => t(880, .1, 'triangle'), miss: () => t(160, .15, 'sawtooth', .08),
    card: () => { t(660, .1, 'triangle'); t(880, .12, 'triangle', .12, .1); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => t(f, .22, 'triangle', .15, i * .12)),
    lose: () => [392, 330, 262].forEach((f, i) => t(f, .25, 'sawtooth', .09, i * .18))
  };
  RP.say = txt => { try { const u = new SpeechSynthesisUtterance(txt); u.lang = 'es-MX'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch {} };
})();
