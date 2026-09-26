/**
 * loader.js
 * Écran de chargement (trois points qui rebondissent, voir loader.css).
 * Il disparaît quand la page a fini de charger, mais reste visible au
 * moins 1,2 s pour ne pas simplement clignoter sur une connexion rapide.
 */

function initLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  document.body.classList.add("is-loading");

  function hideLoader() {
    document.body.classList.remove("is-loading");
    loader.classList.add("loader--done");
  }

  setTimeout(() => {
    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader);
    }
  }, 1200);

  // Filet de sécurité : si une ressource ne finit jamais de charger, on
  // n'empêche pas le visiteur d'accéder au site.
  setTimeout(hideLoader, 4000);
}

initLoader();
