import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Remet la page en haut à chaque changement de route (sauf ancres internes).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
