/* =====================================================
   RAÍCES PLAY — App principal
   ===================================================== */

/* =========================
   REFERENCIAS DOM
========================== */
const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const sidebarUsername = document.getElementById("sidebarUsername");
const welcomeTitle = document.getElementById("welcomeTitle");
const profileUsername = document.getElementById("profileUsername");
const usernameInput = document.getElementById("usernameInput");

const sidebarAvatar = document.getElementById("sidebarAvatar");
const profileAvatar = document.getElementById("profileAvatar");
const avatarInput = document.getElementById("avatarInput");

const gameModal = document.getElementById("gameModal");
const modalTitle = document.getElementById("modalTitle");
const modalIcon = document.getElementById("modalIcon");
const modalDescription = document.getElementById("modalDescription");

const demoTitle = document.getElementById("demoTitle");
const demoGameBody = document.getElementById("demoGameBody");
const resetBoardBtn = document.getElementById("resetBoard");
const drawCardBtn = document.getElementById("drawCard");

const toast = document.getElementById("toast");

/* =========================
   ESTADO DEL USUARIO
========================== */
const defaultUser = { username: "Fexa", avatar: "" };

let user = JSON.parse(localStorage.getItem("raicesPlayUser")) || defaultUser;

/* =========================
   UTILIDADES
========================== */
function saveUser() {
  localStorage.setItem("raicesPlayUser", JSON.stringify(user));
}

function getInitial(username) {
  if (!username || username.length === 0) return "?";
  return username.trim().charAt(0).toUpperCase();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function updateUserUI() {
  const username = user.username || "Fexa";
  const initial = getInitial(username);

  sidebarUsername.textContent = username;
  welcomeTitle.textContent = `Buenas, ${username} 👋`;
  profileUsername.textContent = username;
  usernameInput.value = username;

  if (user.avatar) {
    sidebarAvatar.innerHTML = `<img src="${user.avatar}" alt="Foto de perfil">`;
    profileAvatar.innerHTML = `<img src="${user.avatar}" alt="Foto de perfil">`;
  } else {
    sidebarAvatar.innerHTML = `<span>${initial}</span>`;
    profileAvatar.innerHTML = `<span>${initial}</span>`;
  }
}

/* =========================
   LOGIN
========================== */
function enterApp(provider = "demo") {
  localStorage.setItem("raicesPlayLoggedIn", "true");
  authScreen.classList.add("hidden");
  app.classList.add("visible");

  if (provider !== "demo") {
    showToast(`Inicio de sesión simulado con ${provider}.`);
  }
}

document.querySelectorAll(".social-btn").forEach(button => {
  button.addEventListener("click", () => enterApp(button.dataset.provider));
});

document.getElementById("demoLogin").addEventListener("click", () => enterApp());

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("raicesPlayLoggedIn");
  app.classList.remove("visible");
  authScreen.classList.remove("hidden");
  showToast("Sesión cerrada.");
});

if (localStorage.getItem("raicesPlayLoggedIn") === "true") {
  authScreen.classList.add("hidden");
  app.classList.add("visible");
}

updateUserUI();

/* =========================
   NAVEGACIÓN
========================== */
function switchSection(sectionName) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));

  const target = document.getElementById(`section-${sectionName}`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle("active", item.dataset.section === sectionName);
  });

  document.getElementById("sidebar").classList.remove("mobile-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => switchSection(item.dataset.section));
});

document.querySelectorAll("[data-section-target]").forEach(button => {
  button.addEventListener("click", () => switchSection(button.dataset.sectionTarget));
});

/* =========================
   MENÚ MÓVIL
========================== */
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("mobile-open");
});

/* =========================
   FOTO DE PERFIL
========================== */
avatarInput.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Selecciona una imagen válida.");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    user.avatar = e.target.result;
    saveUser();
    updateUserUI();
    showToast("Foto de perfil actualizada.");
  };
  reader.readAsDataURL(file);
});

/* =========================
   NOMBRE DE USUARIO
========================== */
document.getElementById("saveUsername").addEventListener("click", () => {
  const newName = usernameInput.value.trim();
  if (!newName) {
    showToast("El nombre de usuario no puede estar vacío.");
    return;
  }
  user.username = newName;
  saveUser();
  updateUserUI();
  showToast("Nombre de usuario actualizado.");
});

usernameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("saveUsername").click();
});

/* =========================
   BÚSQUEDA DE AMIGOS
========================== */
document.getElementById("friendSearch").addEventListener("input", e => {
  const term = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".friend-row").forEach(row => {
    const name = row.dataset.name.toLowerCase();
    row.style.display = name.includes(term) ? "flex" : "none";
  });
});

/* =========================
   FILTROS DE JUEGOS
========================== */
document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;

    document.querySelectorAll("#allGames .game-card").forEach(card => {
      const categories = card.dataset.category.split(" ");
      card.style.display = (filter === "all" || categories.includes(filter)) ? "" : "none";
    });
  });
});

/* =====================================================
   SISTEMA DE DEMOS POR JUEGO (FALLBACK)
   Los juegos con implementación real usan RP.mount()
===================================================== */

const gameDemos = {

  /* ---------- CANICAS (fallback temporal) ---------- */
  "Canicas": {
    demoTitle: "Vista previa · Canicas",
    actionLabel: "Lanzar canica",
    resetLabel: "Nueva ronda",
    render: () => `
      <div class="demo-canicas">
        <div class="canica-target" id="canicaTarget">
          <div class="canica-hole" style="top:25%;left:30%"></div>
          <div class="canica-hole" style="top:65%;left:20%"></div>
          <div class="canica-hole" style="top:40%;left:70%"></div>
          <div class="canica-hole" style="top:80%;left:60%"></div>
          <div class="canica-hole" style="top:15%;left:65%"></div>
          <div class="canica-ball" id="canicaBall" style="top:50%;left:50%"></div>
        </div>
        <div class="demo-stats">
          <span>Aciertos: <strong id="canicasHits">0</strong></span>
          <span>Tiros: <strong id="canicasShots">0</strong></span>
        </div>
      </div>
    `,
    action: () => {
      const ball = document.getElementById("canicaBall");
      const holes = demoGameBody.querySelectorAll(".canica-hole");
      const hitsEl = document.getElementById("canicasHits");
      const shotsEl = document.getElementById("canicasShots");
      if (!ball || !holes.length) return;

      const availableHoles = Array.from(holes).filter(h => !h.classList.contains("hit"));
      if (!availableHoles.length) {
        showToast("¡Todos los hoyos ya fueron acertados!");
        return;
      }

      const target = availableHoles[Math.floor(Math.random() * availableHoles.length)];
      ball.style.top = target.style.top;
      ball.style.left = target.style.left;

      setTimeout(() => {
        target.classList.add("hit");
        let hits = parseInt(hitsEl.textContent) || 0;
        let shots = parseInt(shotsEl.textContent) || 0;
        hitsEl.textContent = hits + 1;
        shotsEl.textContent = shots + 1;
        showToast("¡Canica dentro del hoyo! 🎯");
      }, 420);
    },
    reset: () => {
      demoGameBody.querySelectorAll(".canica-hole").forEach(h => h.classList.remove("hit"));
      const ball = document.getElementById("canicaBall");
      if (ball) { ball.style.top = "50%"; ball.style.left = "50%"; }
      document.getElementById("canicasHits").textContent = "0";
      document.getElementById("canicasShots").textContent = "0";
      showToast("Nueva ronda de canicas.");
    }
  },

  /* ---------- BALERO (fallback temporal) ---------- */
  "Balero": {
    demoTitle: "Vista previa · Balero",
    actionLabel: "Intentar encestar",
    resetLabel: "Reiniciar",
    render: () => `
      <div class="demo-balero">
        <div class="balero-visual">
          <div class="balero-cup"></div>
          <div class="balero-ball" id="baleroBall"></div>
        </div>
        <div class="demo-stats">
          <span>Encestados: <strong id="baleroHits">0</strong></span>
          <span>Intentos: <strong id="baleroTries">0</strong></span>
        </div>
      </div>
    `,
    action: () => {
      const ball = document.getElementById("baleroBall");
      const hitsEl = document.getElementById("baleroHits");
      const triesEl = document.getElementById("baleroTries");
      if (!ball) return;

      let tries = parseInt(triesEl.textContent) || 0;
      triesEl.textContent = tries + 1;

      const success = Math.random() < 0.4;

      if (success) {
        ball.classList.add("caught");
        let hits = parseInt(hitsEl.textContent) || 0;
        hitsEl.textContent = hits + 1;
        showToast("¡Balero encestado! 🎯");
      } else {
        ball.classList.remove("caught");
        showToast("Casi... ¡intenta otra vez!");
      }
    },
    reset: () => {
      const ball = document.getElementById("baleroBall");
      if (ball) ball.classList.remove("caught");
      document.getElementById("baleroHits").textContent = "0";
      document.getElementById("baleroTries").textContent = "0";
      showToast("Balero reiniciado.");
    }
  },

  /* ---------- SERPIENTES Y ESCALERAS (fallback temporal) ---------- */
  "Serpientes y Escaleras": {
    demoTitle: "Vista previa · Serpientes y Escaleras",
    actionLabel: "Lanzar dado",
    resetLabel: "Reiniciar",
    render: () => {
      const snakes = [7, 12, 18, 22];
      const ladders = [3, 9, 15, 20];
      let cells = "";
      for (let i = 1; i <= 25; i++) {
        let cls = "snakes-cell";
        if (snakes.includes(i)) cls += " snake";
        if (ladders.includes(i)) cls += " ladder";
        if (i === 1) cls += " player";
        cells += `<div class="${cls}" data-cell="${i}">${i}</div>`;
      }
      return `
        <div class="demo-snakes">
          <div class="snakes-board" id="snakesBoard">${cells}</div>
          <div class="demo-stats">
            <span>Posición: <strong id="snakesPos">1</strong></span>
            <span>Tiradas: <strong id="snakesRolls">0</strong></span>
          </div>
        </div>
      `;
    },
    action: () => {
      const posEl = document.getElementById("snakesPos");
      const rollsEl = document.getElementById("snakesRolls");
      if (!posEl || !rollsEl) return;

      let pos = parseInt(posEl.textContent) || 1;
      let rolls = parseInt(rollsEl.textContent) || 0;

      const dice = Math.floor(Math.random() * 6) + 1;
      pos = Math.min(pos + dice, 25);

      const snakesMap = { 7: 3, 12: 5, 18: 10, 22: 14 };
      const laddersMap = { 3: 8, 9: 14, 15: 21, 20: 24 };

      let message = `Dado: ${dice}. Avanzas a ${pos}.`;

      if (laddersMap[pos]) {
        message += ` ¡Escalera! Subes a ${laddersMap[pos]}.`;
        pos = laddersMap[pos];
      } else if (snakesMap[pos]) {
        message += ` ¡Serpiente! Bajas a ${snakesMap[pos]}.`;
        pos = snakesMap[pos];
      }

      posEl.textContent = pos;
      rollsEl.textContent = rolls + 1;

      demoGameBody.querySelectorAll(".snakes-cell").forEach(c => c.classList.remove("player"));
      const cellEl = demoGameBody.querySelector(`[data-cell="${pos}"]`);
      if (cellEl) cellEl.classList.add("player");

      if (pos >= 25) {
        showToast("¡Ganaste! Llegaste a la casilla 25 🏆");
      } else {
        showToast(message);
      }
    },
    reset: () => {
      demoGameBody.querySelectorAll(".snakes-cell").forEach(c => c.classList.remove("player"));
      const first = demoGameBody.querySelector('[data-cell="1"]');
      if (first) first.classList.add("player");
      document.getElementById("snakesPos").textContent = "1";
      document.getElementById("snakesRolls").textContent = "0";
      showToast("Tablero reiniciado.");
    }
  }
};

/* =========================
   MODAL DE JUEGO
========================== */
const gameDescriptions = {
  "Lotería Mexicana": "Completa tu tabla antes que los demás. La partida está pensada para mesas rápidas y grupos de amigos.",
  "Trompo": "Pon a prueba tu precisión, equilibrio y control en distintos desafíos.",
  "Canicas": "Calcula tus tiros y demuestra que la puntería también necesita estrategia.",
  "Balero": "Encadena aciertos y supera las metas para subir tu puntuación.",
  "Pirinola": "Cada giro cambia la partida. Elige cuándo arriesgar y cuándo conservar.",
  "Serpientes y Escaleras": "Avanza por el tablero, aprovecha las escaleras y evita caer donde no debes."
};

let currentGame = null;

function openGame(game, icon) {
  currentGame = game;
  modalTitle.textContent = game;
  modalIcon.textContent = icon;
  modalDescription.textContent = gameDescriptions[game] || "Prepárate para comenzar la partida.";

  const juegoReal = (window.RP && RP.games) ? RP.games[game] : null;
  const demoActions = document.querySelector(".demo-actions");

  if (juegoReal) {
    if (demoActions) demoActions.hidden = true;
    demoTitle.textContent = `${game} · partida real`;
    RP.mount(juegoReal, demoGameBody);
    gameModal.classList.add("open");
    return;
  }

  if (demoActions) demoActions.hidden = false;
  const demo = gameDemos[game];

  if (demo) {
    demoTitle.textContent = demo.demoTitle;
    demoGameBody.innerHTML = demo.render();
    drawCardBtn.textContent = demo.actionLabel;
    resetBoardBtn.textContent = demo.resetLabel;
  } else {
    demoTitle.textContent = "Vista previa de partida";
    demoGameBody.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0;">Este juego estará disponible pronto.</p>';
    drawCardBtn.textContent = "Acción";
    resetBoardBtn.textContent = "Reiniciar";
  }

  gameModal.classList.add("open");
}

document.querySelectorAll(".game-launch").forEach(button => {
  button.addEventListener("click", () => {
    openGame(button.dataset.game, button.dataset.icon);
  });
});

function closeGameModal() {
  RP.unmount();
  // ⬇️ NUEVO: limpiar el juego real si está activo
  if (window.RP && typeof RP.unmount === "function") {
    RP.unmount();
  }

  gameModal.classList.remove("open");
  currentGame = null;
}

document.getElementById("closeModal").addEventListener("click", closeGameModal);

gameModal.addEventListener("click", event => {
  if (event.target === gameModal) closeGameModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && gameModal.classList.contains("open")) {
    closeGameModal();
  }
});

/* =========================
   BOTONES DE ACCIÓN DEL DEMO FALLBACK
========================== */
drawCardBtn.addEventListener("click", () => {
  if (!currentGame) return;
  const demo = gameDemos[currentGame];
  if (demo && demo.action) demo.action();
});

resetBoardBtn.addEventListener("click", () => {
  if (!currentGame) return;
  const demo = gameDemos[currentGame];
  if (demo && demo.reset) demo.reset();
});

/* =========================
   AGREGAR AMIGO
========================== */
document.getElementById("inviteFriendBtn").addEventListener("click", () => {
  const name = prompt("Escribe el nombre de usuario del amigo:");
  if (name === null || name.trim() === "") return;
  showToast(`Solicitud enviada a ${name.trim()}`);
});

/* =========================
   CREAR SALA
========================== */
document.getElementById("createRoomBtn").addEventListener("click", () => {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  showToast(`Sala creada · Código: ${roomCode}`);
});

/* =========================
   ATAJO DE TECLADO
========================== */
document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement.tagName !== "INPUT") {
    const search = document.getElementById("friendSearch");
    if (document.getElementById("section-friends").classList.contains("active")) {
      event.preventDefault();
      search.focus();
    }
  }
});