/* SANITIZACIÓN: quita caracteres de HTML/control y limita longitud. Úsala en TODO texto escrito por el usuario. */
RP.clean = (s, max = 20) => String(s ?? '').replace(/[<>"'`&\u0000-\u001f]/g, '').trim().slice(0, max);
