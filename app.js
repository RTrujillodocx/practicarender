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
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function updateUserUI() {
  const username = user.username || "Fexa";
  const initial = getInitial(username);

  if (sidebarUsername) sidebarUsername.textContent = username;
  if (welcomeTitle) welcomeTitle.textContent = `Buenas, ${username} 👋`;
  if (profileUsername) profileUsername.textContent = username;
  if (usernameInput) usernameInput.value = username;

  if (user.avatar) {
    if (sidebarAvatar) sidebarAvatar.innerHTML = `<img src="${user.avatar}" alt="Foto de perfil">`;
    if (profileAvatar) profileAvatar.innerHTML = `<img src="${user.avatar}" alt="Foto de perfil">`;
  } else {
    if (sidebarAvatar) sidebarAvatar.innerHTML = `<span>${initial}</span>`;
    if (profileAvatar) profileAvatar.innerHTML = `<span>${initial}</span>`;
  }
}

/* =========================
   REGISTRO DE USUARIO (nueva función)
========================== */
function registrarUsuarioEnLista(nombre, proveedor) {
  const usuarios = JSON.parse(localStorage.getItem("raicesPlayUsuarios") || "[]");

  const yaExiste = usuarios.some(u => u.nombre.toLowerCase() === nombre.toLowerCase());

  if (!yaExiste) {
    usuarios.push({
      nombre: nombre,
      proveedor: proveedor,
      fechaRegistro: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString()
    });
  } else {
    // Actualizar último acceso
    const idx = usuarios.findIndex(u => u.nombre.toLowerCase() === nombre.toLowerCase());
    if (idx !== -1) usuarios[idx].ultimoAcceso = new Date().toISOString();
  }

  localStorage.setItem("raicesPlayUsuarios", JSON.stringify(usuarios));
}

/* =========================
   LOGIN
========================== */
function enterApp(provider = "demo") {
  // Si NO hay usuario guardado, pedimos nombre
  const usuarioGuardado = localStorage.getItem("raicesPlayUser");

  if (!usuarioGuardado) {
    const nombre = prompt("¡Bienvenido a Raíces Play! ¿Cómo te llamas?");

    if (!nombre || nombre.trim() === "") {
      showToast("Necesitas un nombre para entrar");
      return;
    }

    const nuevoUsuario = {
      username: nombre.trim(),
      avatar: "",
      fechaRegistro: new Date().toISOString(),
      proveedor: provider
    };

    localStorage.setItem("raicesPlayUser", JSON.stringify(nuevoUsuario));
    user = nuevoUsuario;
    registrarUsuarioEnLista(nombre.trim(), provider);
  } else {
    user = JSON.parse(usuarioGuardado);
    // Actualizar último acceso
    registrarUsuarioEnLista(user.username, provider);
  }

  localStorage.setItem("raicesPlayLoggedIn", "true");
  authScreen.classList.add("hidden");
  app.classList.add("visible");
  updateUserUI();

  if (provider !== "demo") {
    showToast(`Bienvenido, ${user.username}. Sesión con ${provider}.`);
  } else {
    showToast(`¡Bienvenido, ${user.username}!`);
  }
}

document.querySelectorAll(".social-btn").forEach(button => {
  button.addEventListener("click", () => enterApp(button.dataset.provider));
});

const demoLoginBtn = document.getElementById("demoLogin");
if (demoLoginBtn) {
  demoLoginBtn.addEventListener("click", () => enterApp());
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("raicesPlayLoggedIn");
    // NO borramos el usuario, para que al volver a entrar no pida el nombre otra vez
    app.classList.remove("visible");
    authScreen.classList.remove("hidden");
    showToast("Sesión cerrada.");
  });
}

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

  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");

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
const menuBtn = document.getElementById("menuBtn");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("mobile-open");
  });
}

/* =========================
   FOTO DE PERFIL
========================== */
if (avatarInput) {
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
}

/* =========================
   NOMBRE DE USUARIO
========================== */
const saveUsernameBtn = document.getElementById("saveUsername");
if (saveUsernameBtn) {
  saveUsernameBtn.addEventListener("click", () => {
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
}

if (usernameInput) {
  usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const btn = document.getElementById("saveUsername");
      if (btn) btn.click();
    }
  });
}

/* =========================
   BÚSQUEDA DE AMIGOS
========================== */
const friendSearch = document.getElementById("friendSearch");
if (friendSearch) {
  friendSearch.addEventListener("input", e => {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll(".friend-row").forEach(row => {
      const name = row.dataset.name.toLowerCase();
      row.style.display = name.includes(term) ? "flex" : "none";
    });
  });
}

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
   MODAL DE JUEGO
===================================================== */
const gameDescriptions = {
  "Yoyo": "Encadena trucos, mantén el combo y demuestra tu muñeca. El clásico que nunca pasa de moda.",
  "Canicas": "Calcula tus tiros y demuestra que la puntería también necesita estrategia.",
  "Avionsito": "Dobla el papel, calcula el viento y haz volar tu avión lo más lejos posible.",
  "Balero": "Encadena aciertos y supera las metas para subir tu puntuación.",
  "Cuerda": "Salta al ritmo, sube la velocidad y no te enredes. ¡A ver cuántos aguantas!",
  "Escondidas": "Encuentra el escondite perfecto y evita que te atrapen. ¡El clásico de la escuela!"
};

let currentGame = null;

function openGame(game, icon) {
  currentGame = game;
  modalTitle.textContent = game;
  modalIcon.textContent = icon;
  modalDescription.textContent = gameDescriptions[game] || "Prepárate para comenzar la partida.";

  // Verificar si el juego está registrado en RP.games (core.js)
  const juegoReal = (window.RP && RP.games) ? RP.games[game] : null;
  const demoActions = document.querySelector(".demo-actions");

  if (juegoReal) {
    if (demoActions) demoActions.hidden = true;
    demoTitle.textContent = `${game} · partida real`;
    RP.mount(juegoReal, demoGameBody);
    gameModal.classList.add("open");
    return;
  }

  // Fallback si el juego no está registrado
  if (demoActions) demoActions.hidden = false;
  demoTitle.textContent = "Vista previa de partida";
  demoGameBody.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px 0;">Este juego estará disponible pronto.</p>';
  if (drawCardBtn) drawCardBtn.textContent = "Acción";
  if (resetBoardBtn) resetBoardBtn.textContent = "Reiniciar";

  gameModal.classList.add("open");
}

document.querySelectorAll(".game-launch").forEach(button => {
  button.addEventListener("click", () => {
    openGame(button.dataset.game, button.dataset.icon);
  });
});

function closeGameModal() {
  if (window.RP && typeof RP.unmount === "function") {
    RP.unmount();
  }

  gameModal.classList.remove("open");
  currentGame = null;
}

const closeModalBtn = document.getElementById("closeModal");
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeGameModal);
}

gameModal.addEventListener("click", event => {
  if (event.target === gameModal) closeGameModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && gameModal.classList.contains("open")) {
    closeGameModal();
  }
});

/* =========================
   AGREGAR AMIGO
========================== */
const inviteFriendBtn = document.getElementById("inviteFriendBtn");
if (inviteFriendBtn) {
  inviteFriendBtn.addEventListener("click", () => {
    const name = prompt("Escribe el nombre de usuario del amigo:");
    if (name === null || name.trim() === "") return;
    showToast(`Solicitud enviada a ${name.trim()}`);
  });
}

/* =========================
   CREAR SALA
========================== */
const createRoomBtn = document.getElementById("createRoomBtn");
if (createRoomBtn) {
  createRoomBtn.addEventListener("click", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    showToast(`Sala creada · Código: ${roomCode}`);
  });
}

/* =========================
   ATAJO DE TECLADO
========================== */
document.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement.tagName !== "INPUT") {
    const search = document.getElementById("friendSearch");
    if (search && document.getElementById("section-friends").classList.contains("active")) {
      event.preventDefault();
      search.focus();
    }
  }
});

/* =========================
   LOG DE BIENVENIDA
========================== */
console.log('%c🌵 Raíces Play cargado', 'color: #0d654f; font-size: 1.2rem; font-weight: bold;');
console.log('%cJugador actual:', 'color: #6e756e;', user.username);