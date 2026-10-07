/* PERSISTENCIA: localStorage con try/catch y codificación mínima (Base64 + JSON).
   OJO: es ofuscación, NO cifrado. Sirve para que no se lea a simple vista ni se edite a mano fácilmente. */
RP.store = {
  get(k, d) { try { const v = localStorage.getItem('rp_' + k); return v === null ? d : JSON.parse(decodeURIComponent(atob(v))); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('rp_' + k, btoa(encodeURIComponent(JSON.stringify(v)))); } catch {} },
  add(k) { this.set(k, this.get(k, 0) + 1); }
};
