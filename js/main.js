/**
 * main.js
 * Chaque fonction est une responsabilité isolée :
 *   1. initNav()          — menu mobile (ouvrir/fermer, fermer au clic sur un lien)
 *   2. initTheme()        — bascule thème clair/sombre, mémorisée dans localStorage
 *   3. initClock()        — horloge en direct (heure + fuseau) dans le hero
 *   4. initCursorCoords() — coordonnées X/Y de la souris, en direct
 *   5. initScrollTop()    — bouton "remonter en haut"
 *   6. initSkills()       — onglets de la section Compétences (clic + clavier)
 *
 * Aucune dépendance externe : uniquement des API natives du navigateur.
 * Les animations au scroll vivent dans animations.js (GSAP).
 */

function initNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Ferme le menu mobile dès qu'on clique un lien de navigation
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initTheme() {
  const root = document.documentElement;
  const themeButton = document.getElementById("themeToggle");
  const STORAGE_KEY = "theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeButton) {
      themeButton.textContent = theme === "dark" ? "THÈME[S]" : "THÈME[C]";
    }
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const stored = localStorage.getItem(STORAGE_KEY);
  applyTheme(stored || (prefersDark ? "dark" : "light"));

  if (!themeButton) return;

  themeButton.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  });
}

function initClock() {
  const clockEl = document.getElementById("liveClock");
  if (!clockEl) return;

  function formatUtcOffset(date) {
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const hours = Math.floor(Math.abs(offsetMinutes) / 60);
    const minutes = Math.abs(offsetMinutes) % 60;
    return minutes === 0
      ? `GMT${sign}${hours}`
      : `GMT${sign}${hours}:${String(minutes).padStart(2, "0")}`;
  }

  function tick() {
    const now = new Date();
    const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    clockEl.textContent = `${formatUtcOffset(now)} ${time}`;
  }

  tick();
  setInterval(tick, 1000);
}

function initCursorCoords() {
  const coordsEl = document.getElementById("cursorCoords");
  if (!coordsEl) return;

  function pad(value) {
    return String(value).padStart(4, "0");
  }

  window.addEventListener("mousemove", (event) => {
    coordsEl.textContent = `${pad(event.clientX)} X ${pad(event.clientY)} Y`;
  });
}

function initScrollTop() {
  const scrollTopButton = document.getElementById("scrollTopBtn");
  if (!scrollTopButton) return;

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initSkills() {
  const section = document.getElementById("skills");
  if (!section) return;

  const tabs = Array.from(section.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  if (!tabs.length || panels.includes(null)) return;

  function select(index, moveFocus) {
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      panels[i].hidden = !isActive;
    });

    const panel = panels[index];
    panel.classList.remove("is-entering");
    // Forcer un reflow relance l'animation CSS même si on revient sur un
    // panneau déjà animé.
    void panel.offsetWidth;
    panel.classList.add("is-entering");

    // "nearest" plutôt que "center" : sur ordinateur les pastilles tiennent
    // toutes à l'écran, seul le rail horizontal du mobile doit défiler.
    tabs[index].scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    if (moveFocus) tabs[index].focus();
  }

  const PREVIOUS_KEYS = ["ArrowUp", "ArrowLeft"];
  const NEXT_KEYS = ["ArrowDown", "ArrowRight"];

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index, false));
    tab.addEventListener("keydown", (event) => {
      let target = null;
      if (PREVIOUS_KEYS.includes(event.key)) target = (index - 1 + tabs.length) % tabs.length;
      if (NEXT_KEYS.includes(event.key)) target = (index + 1) % tabs.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target === null) return;
      event.preventDefault();
      select(target, true);
    });
  });

  section.classList.add("is-enhanced");
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    panels[i].hidden = i !== 0;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initTheme();
  initClock();
  initCursorCoords();
  initScrollTop();
  initSkills();
});
