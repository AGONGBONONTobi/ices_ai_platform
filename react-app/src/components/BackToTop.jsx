export default function BackToTop({ backToTopRef }) {
  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      ref={backToTopRef}
      className="back-to-top"
      aria-label="Retour en haut de page"
      onClick={scrollToTop}
    >
      <svg className="icon" aria-hidden="true"><use href="#icon-arrow-up"></use></svg>
    </button>
  );
}
