import { useEffect, useRef, useState } from "react";

/**
 * Reveal — animation d'entrée au scroll.
 * @param {string}  variant  "fade" (défaut) | "clip" (wipe clip-path)
 * @param {string}  delay    "1" | "2" | "3" | "4" — stagger pour les grilles
 */
export default function Reveal({
  as: Tag = "div",
  className = "",
  variant = "fade",
  delay,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseClass = variant === "clip" ? "reveal-clip" : "reveal";
  const delayClass = delay ? `reveal-delay-${delay}` : "";
  const classes = [baseClass, visible ? "is-visible" : "", delayClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={classes} {...rest}>
      {children}
    </Tag>
  );
}
