/**
 * animations.js
 * Animations GSAP : l'entrée du hero au chargement, puis l'apparition en
 * fondu de chaque bloc de texte quand on le fait défiler à l'écran.
 *
 * Si GSAP n'a pas pu charger, ou si le visiteur a demandé à réduire les
 * animations dans son système, on ne fait rien : le contenu reste
 * simplement visible.
 */

function initAnimations() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gsapLoaded = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (reduceMotion || !gsapLoaded) return;

  gsap.registerPlugin(ScrollTrigger);

  // Le loader reste affiché 1,2 s : le hero démarre juste après.
  gsap.from(".hero__top p, .hero__headline .line, .hero__bottombar", {
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.12,
    ease: "power3.out",
    delay: 1.3,
  });

  function revealOnScroll(selector) {
    gsap.utils.toArray(selector).forEach((element) => {
      gsap.from(element, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
        },
      });
    });
  }

  revealOnScroll(".container > h2, .container > h3, .about__text > *");
  revealOnScroll(".about__portrait, .section-intro, .skills__layout");
  revealOnScroll(".statement__quote, .statement__body");
  revealOnScroll(".conformite tbody tr, .conformite__note");
  revealOnScroll(".contact__card");
}

initAnimations();
