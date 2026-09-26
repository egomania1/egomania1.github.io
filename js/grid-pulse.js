/**
 * grid-pulse.js
 * Grille fine dessinée dans un <canvas> en fond de page : la case sous la
 * souris s'allume, puis s'éteint en fondu. La couleur change avec le temps,
 * ce qui donne un tracé arc-en-ciel quand on bouge la souris.
 *
 * Désactivée sur écran tactile (pas de souris) et si le visiteur a demandé
 * à réduire les animations.
 */

function initGridPulse() {
  const canvas = document.getElementById("gridPulse");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasMouse = window.matchMedia("(hover: hover)").matches;
  if (reduceMotion || !hasMouse) {
    canvas.remove();
    return;
  }

  const CELL_SIZE = 28;
  const FADE_DURATION = 900;
  const context = canvas.getContext("2d");
  let litCells = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawGrid() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    context.strokeStyle = isDark ? "rgba(245, 246, 250, 0.06)" : "rgba(10, 10, 10, 0.07)";

    // Le décalage de 0,5 px aligne les traits de 1 px sur les pixels de
    // l'écran : sans lui, chaque trait est flou et étalé sur 2 px.
    context.beginPath();
    for (let x = 0.5; x < canvas.width; x += CELL_SIZE) {
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
    }
    for (let y = 0.5; y < canvas.height; y += CELL_SIZE) {
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
    }
    context.stroke();
  }

  function drawLitCells(now) {
    litCells = litCells.filter((cell) => now - cell.litAt < FADE_DURATION);

    litCells.forEach((cell) => {
      const opacity = 0.85 * (1 - (now - cell.litAt) / FADE_DURATION);
      context.fillStyle = `hsla(${cell.hue}, 90%, 62%, ${opacity})`;
      context.fillRect(cell.x + 1, cell.y + 1, CELL_SIZE - 1, CELL_SIZE - 1);
    });
  }

  function draw(now) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawLitCells(now);
    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", (event) => {
    const now = performance.now();
    const x = Math.floor(event.clientX / CELL_SIZE) * CELL_SIZE;
    const y = Math.floor(event.clientY / CELL_SIZE) * CELL_SIZE;

    litCells = litCells.filter((cell) => cell.x !== x || cell.y !== y);
    litCells.push({ x, y, litAt: now, hue: (now * 0.12) % 360 });
  });

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(draw);
}

initGridPulse();
