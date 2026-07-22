import { useEffect, useState } from "react";

/**
 * Watches the given section refs and returns the id of whichever one is
 * currently in the "active reading" band of the viewport, for nav-link
 * highlighting.
 */
export function useScrollSpy(sectionRefs) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const elements = sectionRefs.map((ref) => ref.current).filter(Boolean);
    if (!elements.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionRefs]);

  return activeId;
}
