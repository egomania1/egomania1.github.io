/**
 * main.js
 * Les petites fonctionnalités de la page, une fonction par fonctionnalité :
 *   - initNav()          menu mobile
 *   - initTheme()        bouton thème clair / sombre
 *   - initClock()        horloge du hero
 *   - initCursorCoords() coordonnées de la souris dans le hero
 *   - initScrollTop()    bouton "remonter en haut"
 *   - initSkills()       onglets de la section Compétences
 *   - initWorkStack()    projets empilés de la section Réalisations
 */

function initNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    menu.classList.toggle("is-open");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("is-open");
    });
  });
}

function initTheme() {
  const button = document.getElementById("themeToggle");
  const root = document.documentElement;
  if (!button) return;

  // Le thème de départ est déjà posé par le petit script du <head>.
  function updateLabel() {
    const isDark = root.getAttribute("data-theme") === "dark";
    button.textContent = isDark ? "THÈME[S]" : "THÈME[C]";
  }

  button.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateLabel();
  });

  updateLabel();
}

function initClock() {
  const clock = document.getElementById("liveClock");
  if (!clock) return;

  function showTime() {
    clock.textContent = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }

  showTime();
  setInterval(showTime, 1000);
}

function initCursorCoords() {
  const coords = document.getElementById("cursorCoords");
  if (!coords) return;

  window.addEventListener("mousemove", (event) => {
    const x = String(event.clientX).padStart(4, "0");
    const y = String(event.clientY).padStart(4, "0");
    coords.textContent = `${x} X ${y} Y`;
  });
}

function initScrollTop() {
  const button = document.getElementById("scrollTopBtn");
  if (!button) return;

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function initSkills() {
  const section = document.getElementById("skills");
  if (!section) return;

  const tabs = section.querySelectorAll(".skills__tab");
  const panels = section.querySelectorAll(".skill");

  function showSkill(clickedTab) {
    tabs.forEach((tab) => tab.classList.remove("is-active"));
    clickedTab.classList.add("is-active");

    panels.forEach((panel) => {
      panel.hidden = panel.id !== clickedTab.dataset.skill;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => showSkill(tab));
  });

  // Sans JavaScript, toutes les compétences restent affichées l'une sous
  // l'autre : les onglets n'apparaissent qu'une fois ce script lancé.
  section.classList.add("is-enhanced");
  showSkill(tabs[0]);
}

function initWorkStack() {
  const projects = document.querySelectorAll("#work .flow");

  // Un projet plus haut que l'écran se colle par le bas (top négatif),
  // sinon le projet suivant recouvrirait la fin de son contenu.
  function updateStickyTop() {
    projects.forEach((project) => {
      const overflow = window.innerHeight - project.offsetHeight;
      project.style.top = `${Math.min(0, overflow)}px`;
    });
  }

  updateStickyTop();
  window.addEventListener("resize", updateStickyTop);
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initTheme();
  initClock();
  initCursorCoords();
  initScrollTop();
  initSkills();
  initWorkStack();
});
