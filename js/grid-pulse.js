/**
 * grid-pulse.js
 * Grille fine en fond de page : les cases survolées par le pointeur
 * s'allument (teinte qui défile dans le temps, d'où l'effet arc-en-ciel le
 * long du tracé) puis s'éteignent en fondu.
 *
 * Dessinée dans un seul <canvas> fixe ; la boucle d'animation ne tourne que
 * tant qu'une case est allumée. Désactivée si l'utilisateur a demandé
 * "prefers-reduced-motion" ou sur un écran sans souris.
 */
(function () {
  const canvas = document.getElementById("gridPulse");
  if (!canvas) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasPointer = window.matchMedia("(hover: hover)").matches;
  if (reduceMotion || !hasPointer) {
    canvas.remove();
    return;
  }

  const CELL = 28;
  const FADE_MS = 900;
  const HUE_SPEED = 0.12;

  const context = canvas.getContext("2d");
  const litCells = new Map();
  let lastCell = null;
  let frameRequested = false;
  let gridColor = "";

  function readGridColor() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    gridColor = isDark ? "rgba(245, 246, 250, 0.06)" : "rgba(10, 10, 10, 0.07)";
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  function drawGrid() {
    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 0.5; x < window.innerWidth; x += CELL) {
      context.moveTo(x, 0);
      context.lineTo(x, window.innerHeight);
    }
    for (let y = 0.5; y < window.innerHeight; y += CELL) {
      context.moveTo(0, y);
      context.lineTo(window.innerWidth, y);
    }
    context.stroke();
  }

  function draw(now) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawGrid();

    litCells.forEach((cell, key) => {
      const progress = (now - cell.litAt) / FADE_MS;
      if (progress >= 1) {
        litCells.delete(key);
        return;
      }
      context.fillStyle = `hsla(${cell.hue}, 90%, 62%, ${0.85 * (1 - progress)})`;
      context.fillRect(cell.col * CELL + 1, cell.row * CELL + 1, CELL - 1, CELL - 1);
    });
  }

  function loop(now) {
    draw(now);
    if (litCells.size) {
      requestAnimationFrame(loop);
    } else {
      frameRequested = false;
    }
  }

  function light(col, row, now) {
    litCells.set(`${col}:${row}`, { col, row, litAt: now, hue: (now * HUE_SPEED) % 360 });
  }

  // Un mouvement rapide saute plusieurs cases entre deux événements : on
  // allume aussi les cases intermédiaires pour que le tracé reste continu.
  function lightPath(from, to, now) {
    const steps = Math.max(Math.abs(to.col - from.col), Math.abs(to.row - from.row));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      light(
        Math.round(from.col + (to.col - from.col) * t),
        Math.round(from.row + (to.row - from.row) * t),
        now
      );
    }
  }

  window.addEventListener("pointermove", (event) => {
    const now = performance.now();
    const cell = {
      col: Math.floor(event.clientX / CELL),
      row: Math.floor(event.clientY / CELL),
    };

    if (lastCell) {
      lightPath(lastCell, cell, now);
    } else {
      light(cell.col, cell.row, now);
    }
    lastCell = cell;

    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(loop);
    }
  });

  document.addEventListener("pointerleave", () => {
    lastCell = null;
  });

  // Le thème peut changer via le bouton THÈME[S] : on suit l'attribut.
  new MutationObserver(() => {
    readGridColor();
    draw(performance.now());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  readGridColor();
  resize();
  window.addEventListener("resize", resize);
})();
