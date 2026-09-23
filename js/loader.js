/**
 * loader.js
 * Écran de chargement : trois points qui rebondissent (animation CSS pure,
 * voir loader.css), affichés au moins MIN_VISIBLE ms puis masqués dès que la
 * page a fini de charger (événement "load"), avec un filet de sécurité pour
 * ne jamais bloquer l'utilisateur trop longtemps.
 */
(function () {
  const loader = document.getElementById("loader");
  if (!loader) return;

  const SAFETY_TIMEOUT = 4000;
  // Durée plancher : sur un fichier local ou un serveur rapide, la page peut
  // finir de charger en quelques dizaines de ms — sans ce minimum, le loader
  // n'aurait pas le temps d'être visible à l'écran.
  const MIN_VISIBLE = 1200;
  const start = performance.now();

  document.body.classList.add("is-loading");

  function hide() {
    document.body.classList.remove("is-loading");
    loader.classList.add("loader--done");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  }

  function hideWhenReady() {
    const elapsed = performance.now() - start;
    setTimeout(hide, Math.max(0, MIN_VISIBLE - elapsed));
  }

  window.addEventListener("load", hideWhenReady, { once: true });
  setTimeout(hideWhenReady, SAFETY_TIMEOUT);
})();
