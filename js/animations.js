/**
 * animations.js
 * GSAP + ScrollTrigger : anime l'entrée du hero, puis fait apparaître
 * chaque bloc de contenu au scroll (titres, paragraphes, listes, grilles,
 * chronologie, tableau) de façon cohérente sur toute la page.
 *
 * Se désactive proprement si GSAP n'a pas chargé (CDN indisponible) ou si
 * l'utilisateur a demandé "prefers-reduced-motion" — le contenu reste alors
 * simplement visible, sans animation, plutôt que caché derrière un opacity:0
 * qui ne se lèverait jamais.
 */

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapReady = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (reduceMotion || !gsapReady) return;

  gsap.registerPlugin(ScrollTrigger);

  // --- Entrée du hero, au chargement -------------------------------------
  gsap.from(["#hero .hero__tagline", "#hero .hero__lead", "#hero .hero__bio"], {
    opacity: 0,
    y: 24,
    duration: 0.7,
    ease: "power2.out",
    stagger: 0.1,
  });

  gsap.from("#hero .hero__headline span", {
    opacity: 0,
    y: 50,
    duration: 0.8,
    ease: "power3.out",
    stagger: 0.1,
    delay: 0.2,
  });

  gsap.from("#hero .hero__bottombar", {
    opacity: 0,
    duration: 0.7,
    ease: "power2.out",
    delay: 0.6,
  });

  // --- Un seul élément qui apparaît au scroll -----------------------------
  function revealEach(selector, opts = {}) {
    gsap.utils.toArray(selector).forEach((target) => {
      gsap.from(target, {
        opacity: 0,
        y: opts.y ?? 18,
        duration: opts.duration ?? 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: target,
          start: opts.start ?? "top 88%",
        },
      });
    });
  }

  // --- Groupes d'éléments : chaque conteneur trouvé anime ses propres
  //     enfants avec un décalage (stagger) indépendant ---------------------
  function revealGroups(containerSelector, itemSelector, opts = {}) {
    document.querySelectorAll(containerSelector).forEach((container) => {
      const items = container.querySelectorAll(itemSelector);
      if (!items.length) return;

      gsap.from(items, {
        opacity: 0,
        y: opts.y ?? 20,
        duration: opts.duration ?? 0.6,
        ease: "power2.out",
        stagger: opts.stagger ?? 0.08,
        scrollTrigger: {
          trigger: container,
          start: opts.start ?? "top 88%",
        },
      });
    });
  }

  // Titres de section et sous-titres directement dans le fil de la page
  // (ceux imbriqués dans une carte, ex. project-card h3, sont gérés par
  // leur propre grille plus bas et donc volontairement exclus ici).
  // "Qui je suis" n'a pas de .container (son texte colle au bord de
  // l'écran, voir la section spacing) donc ses titres sont ciblés à part.
  revealEach("main section > .container > h2, .about__text h2");
  revealEach("main section > .container > h3, .about__text h3");
  revealEach("main section > .container > h4");

  // Statement — le texte est découpé mot par mot pour l'animation, puis
  // chaque mot apparaît avec un léger décalage (effet "manifeste").
  const quote = document.querySelector(".statement__quote");
  if (quote) {
    const wrappedWordsHtml = quote.textContent
      .split(" ")
      .map((word) => `<span class="word">${word}</span>`)
      .join(" ");
    quote.innerHTML = wrappedWordsHtml;

    gsap.from(quote.querySelectorAll(".word"), {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.03,
      scrollTrigger: {
        trigger: quote,
        start: "top 75%",
      },
    });
  }
  revealEach(".statement__body");

  // Qui je suis
  revealEach(".about__portrait");
  revealEach(".about__text > p");
  revealGroups(".timeline", "li");

  // Compétences / Compétences BTS — grilles de cartes
  // (Réalisations a son propre mécanisme : défilement horizontal épinglé,
  // voir initWorkGallery plus bas — pas d'apparition en fondu là-dessus.)
  revealGroups(".skills__grid", ".skill-card");
  revealGroups(".conformite__grid", ".conformite-card");
  revealGroups(".conformite__table tbody", "tr", { y: 0, stagger: 0.05 });
  revealEach(".conformite__note");

  // Veille technologique
  revealEach(".veille .container > p");
  revealGroups(".veille ul", "li", { stagger: 0.06 });

  // Contact
  revealEach(".contact .container > p");
  revealGroups(".socials", "li", { stagger: 0.08 });
  revealEach(".contact .container > .btn");

  // --- Réalisations : galerie épinglée qui défile à l'horizontale --------
  // Le scroll vertical de la page est converti en translation horizontale
  // du rail de cartes (ScrollTrigger "scrub"), pendant que la section reste
  // épinglée à l'écran — même mécanisme que l'ancien portfolio.
  function initWorkGallery() {
    const section = document.getElementById("work");
    const track = section ? section.querySelector(".work__track") : null;
    const dotsList = document.getElementById("workDots");
    const counter = document.getElementById("workCounter");
    if (!section || !track) return;

    const cards = track.querySelectorAll(".project-card");
    if (!cards.length) return;

    const total = cards.length;
    if (dotsList) {
      dotsList.innerHTML = Array.from(
        { length: total },
        (_, i) => `<li>${String(i + 1).padStart(2, "0")}</li>`
      ).join("");
    }
    const dots = dotsList ? dotsList.querySelectorAll("li") : [];

    function setActive(index) {
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      if (counter) {
        counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
      }
    }
    setActive(0);

    // Construit le pin + la translation horizontale une seule fois : un
    // redimensionnement ne rappelle pas cette fonction, il ne fait que
    // recalculer les distances via ScrollTrigger.refresh() plus bas.
    function build() {
      const distance = track.scrollWidth - section.clientWidth;
      if (distance <= 0) return;

      gsap.to(track, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            setActive(Math.round(self.progress * (total - 1)));
          },
        },
      });
    }

    build();

    // Les vignettes se chargent en asynchrone : une fois toutes les images
    // prêtes, la largeur réelle du rail peut avoir changé — on reconstruit.
    const images = track.querySelectorAll("img");
    let pending = images.length;
    if (pending) {
      images.forEach((img) => {
        if (img.complete) {
          pending -= 1;
        } else {
          img.addEventListener(
            "load",
            () => {
              pending -= 1;
              if (pending === 0) ScrollTrigger.refresh();
            },
            { once: true }
          );
        }
      });
      if (pending === 0) ScrollTrigger.refresh();
    }

    window.addEventListener("resize", () => ScrollTrigger.refresh());
  }

  initWorkGallery();
})();
