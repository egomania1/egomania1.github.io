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
  // Chaque ligne de texte est d'abord recouverte par un bloc de couleur qui
  // s'étire de gauche à droite ; le texte apparaît à mi-course, puis le bloc
  // se retire vers la droite.

  // Découpe un bloc de texte en lignes telles qu'affichées à l'écran : les
  // mots sont d'abord isolés pour mesurer leur position verticale, puis
  // regroupés par ligne. Les <br> du HTML sont respectés.
  function splitIntoLines(element) {
    const words = [];
    const fragment = document.createDocumentFragment();

    element.childNodes.forEach((node) => {
      if (node.nodeName === "BR") {
        fragment.append(document.createElement("br"));
        return;
      }
      node.textContent.split(/\s+/).forEach((text) => {
        if (!text) return;
        const word = document.createElement("span");
        word.textContent = text;
        fragment.append(word, " ");
        words.push(word);
      });
    });
    element.replaceChildren(fragment);

    const lines = [];
    words.forEach((word) => {
      const previous = lines[lines.length - 1];
      if (previous && previous.top === word.offsetTop) {
        previous.words.push(word.textContent);
      } else {
        lines.push({ top: word.offsetTop, words: [word.textContent] });
      }
    });

    element.replaceChildren(
      ...lines.map((line) => {
        const wrapper = document.createElement("span");
        wrapper.className = "reveal-line";
        const text = document.createElement("span");
        text.className = "reveal-line__text";
        text.textContent = line.words.join(" ");
        wrapper.append(text);
        return wrapper;
      })
    );
    return Array.from(element.querySelectorAll(".reveal-line"));
  }

  function addBlock(line, color) {
    const block = document.createElement("span");
    block.className = "reveal-line__block";
    block.setAttribute("aria-hidden", "true");
    block.style.backgroundColor = color;
    line.append(block);
    return block;
  }

  function blockReveal(lines, color, { delay = 0, duration = 0.6, stagger = 0.1 } = {}) {
    const blocks = lines.map((line) => addBlock(line, color));
    const texts = lines.map((line) => line.firstElementChild);
    gsap.set(texts, { opacity: 0 });

    gsap
      .timeline({ delay, defaults: { ease: "expo.inOut" } })
      .fromTo(blocks, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration, stagger })
      .set(texts, { opacity: 1, stagger }, `<${duration / 2}`)
      .to(blocks, { scaleX: 0, transformOrigin: "right center", duration, stagger }, `<${duration * 0.4}`);
  }

  // Le loader masque la page pendant au moins 1,2 s : on démarre juste
  // après pour que l'effet soit vu.
  const HERO_DELAY = 1.3;
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim();
  const accentBlue = styles.getPropertyValue("--accent-blue").trim();

  ["#hero .hero__tagline", "#hero .hero__lead", "#hero .hero__bio"].forEach((selector, index) => {
    const element = document.querySelector(selector);
    if (!element) return;
    blockReveal(splitIntoLines(element), accentBlue, {
      delay: HERO_DELAY + index * 0.15,
      stagger: 0.05,
    });
  });

  const headlineLines = Array.from(document.querySelectorAll("#hero .hero__headline .line"));
  blockReveal(headlineLines, accent, { delay: HERO_DELAY + 0.3, duration: 0.8, stagger: 0.12 });

  gsap.from("#hero .hero__bottombar", {
    opacity: 0,
    filter: "blur(8px)",
    duration: 0.8,
    ease: "power2.out",
    delay: 0.6,
  });

  // --- Un seul élément qui apparaît au scroll -----------------------------
  // blur:false désactive la mise au point (utile sur les rangées de tableau,
  // où un flou parasiterait la lecture d'une grille de texte déjà dense).
  function revealEach(selector, opts = {}) {
    const blurPx = opts.blur === false ? 0 : opts.blur ?? 10;
    gsap.utils.toArray(selector).forEach((target) => {
      gsap.from(target, {
        opacity: 0,
        y: opts.y ?? 24,
        ...(blurPx ? { filter: `blur(${blurPx}px)` } : {}),
        duration: opts.duration ?? 0.9,
        ease: opts.ease ?? "power3.out",
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
    const blurPx = opts.blur === false ? 0 : opts.blur ?? 10;
    document.querySelectorAll(containerSelector).forEach((container) => {
      const items = container.querySelectorAll(itemSelector);
      if (!items.length) return;

      gsap.from(items, {
        opacity: 0,
        y: opts.y ?? 24,
        ...(blurPx ? { filter: `blur(${blurPx}px)` } : {}),
        duration: opts.duration ?? 0.9,
        ease: opts.ease ?? "power3.out",
        stagger: opts.stagger ?? 0.08,
        scrollTrigger: {
          trigger: container,
          start: opts.start ?? "top 88%",
        },
      });
    });
  }

  // Titres de section et sous-titres directement dans le fil de la page
  // (ceux imbriqués dans une carte, ex. les titres des projets, sont gérés par
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
      y: 20,
      filter: "blur(6px)",
      duration: 0.6,
      ease: "power3.out",
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
  revealEach(".section-intro");
  revealEach(".skills__layout");
  revealGroups(".realisations tbody", "tr", { y: 0, blur: false, stagger: 0.06 });
  revealGroups(".conformite__table tbody", "tr", { y: 0, blur: false, stagger: 0.05 });
  revealEach(".conformite__note");

  // Veille technologique : pile de cartes. Chaque carte rétrécit de 5 %
  // par carte qui viendra se poser dessus, au fil du défilement jusqu'à la
  // fin de la pile. Les éléments sont sticky : leurs positions sont donc
  // calculées depuis la liste (qui, elle, ne bouge pas).
  function initVeilleStack() {
    const list = document.querySelector(".stack");
    if (!list) return;
    const items = gsap.utils.toArray(".stack__item", list);
    const listTop = () => list.getBoundingClientRect().top + window.scrollY;

    items.forEach((item, index) => {
      const coveredBy = items.length - 1 - index;
      if (!coveredBy) return;
      gsap.to(item.querySelector(".stack__card"), {
        scale: 1 - coveredBy * 0.05,
        ease: "none",
        scrollTrigger: {
          start: () => listTop() + index * item.offsetHeight,
          end: () => listTop() + list.offsetHeight - window.innerHeight,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
  }
  initVeilleStack();

  // Contact
  revealEach(".contact__card");
  revealGroups(".contact__list", "li", { stagger: 0.08 });

  // --- Réalisations : un projet par écran, empilés au scroll -------------
  // L'empilement est fait en CSS (position: sticky, activé par .is-stacked) :
  // chaque bloc reste collé pendant que le suivant remonte par-dessus. Un
  // bloc plus haut que l'écran colle par son bas (top négatif) pour que son
  // contenu reste lisible en entier. GSAP ne gère que la bascule : chaque
  // bloc arrive incliné de 30° depuis son coin bas-gauche et se redresse.
  function initWorkStory() {
    const section = document.getElementById("work");
    const flows = gsap.utils.toArray("#work .flow");
    if (!section || !flows.length) return;

    function updateStickyOffsets() {
      flows.forEach((flow) => {
        const overflow = Math.min(0, window.innerHeight - flow.offsetHeight);
        flow.style.setProperty("--flow-top", `${overflow}px`);
      });
    }

    section.classList.add("is-stacked");
    updateStickyOffsets();
    window.addEventListener("resize", updateStickyOffsets);

    // Un élément sticky change de position pendant qu'il est collé : on ne
    // peut pas s'en servir comme déclencheur. On recalcule donc sa position
    // "naturelle" (haut de la section + hauteur des blocs précédents).
    function naturalTop(index) {
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      return flows
        .slice(0, index)
        .reduce((top, flow) => top + flow.offsetHeight, sectionTop);
    }

    flows.forEach((flow, index) => {
      if (index === 0) return;
      gsap.fromTo(
        flow.querySelector(".flow__inner"),
        { rotation: 30 },
        {
          rotation: 0,
          ease: "none",
          scrollTrigger: {
            start: () => naturalTop(index) - window.innerHeight,
            end: () => naturalTop(index) - window.innerHeight * 0.25,
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    });

    // Les captures se chargent en différé : leur hauteur réelle change la
    // taille des blocs, donc leur décalage sticky et les déclencheurs.
    section.querySelectorAll("img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener(
          "load",
          () => {
            updateStickyOffsets();
            ScrollTrigger.refresh();
          },
          { once: true }
        );
      }
    });
  }

  initWorkStory();
})();
