import { useEffect } from "react";

/**
 * Toggles the back-to-top button's visibility — imperatively via a ref,
 * so we don't re-render on every scroll pixel.
 */
export function useScrollEffects({ backToTopRef }) {
  useEffect(() => {
    function onScroll() {
      if (backToTopRef.current) {
        backToTopRef.current.classList.toggle("is-visible", window.scrollY > 480);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [backToTopRef]);
}
