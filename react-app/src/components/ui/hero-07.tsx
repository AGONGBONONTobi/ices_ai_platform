import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";

export interface Hero07Props {
  tagline: string;
  title: string;
  description: string;
  landscapeImage: string;
  landscapeAlt?: string;
  animation?: "none" | "subtle";
  variant?: "standard" | "compact";
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

function Reveal({
  active,
  variants,
  className,
  children,
}: Readonly<{
  active: boolean;
  variants?: Variants;
  className?: string;
  children: React.ReactNode;
}>) {
  if (!active) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={variants ?? item} className={className}>
      {children}
    </motion.div>
  );
}

export function Hero07({
  tagline,
  title,
  description,
  landscapeImage,
  landscapeAlt = "",
  animation = "none",
}: Readonly<Hero07Props>) {
  const reduce = useReducedMotion();
  const animate = animation === "subtle" && !reduce;

  return (
    <section className="relative isolate w-full overflow-hidden" style={{ minHeight: "92vh" }}>
      {/* Full-bleed background image — untouched */}
      <img
        src={landscapeImage}
        alt={landscapeAlt}
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center -z-20"
      />

      {/*
        Cinematic left-edge gradient:
        On desktop, a rich dark veil covers only the left ~45% of the image,
        fading to fully transparent toward the centre. The right half of the
        photo remains completely unaltered.
        On mobile we use a soft bottom-up veil so text on top stays readable.
      */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: [
            /* Mobile: soft vignette from top */
            "linear-gradient(to bottom, rgba(10,8,6,0.52) 0%, rgba(10,8,6,0.18) 55%, rgba(10,8,6,0.05) 100%)",
          ].join(", "),
        }}
      />
      {/* Desktop-only: lateral gradient — left side dark, right fully clear */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 pointer-events-none hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, rgba(10,8,6,0.82) 0%, rgba(10,8,6,0.70) 22%, rgba(10,8,6,0.38) 42%, rgba(10,8,6,0.08) 58%, transparent 72%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 mx-auto max-w-7xl px-6 flex items-center"
        style={{ minHeight: "92vh" }}
        variants={animate ? container : undefined}
        initial={animate ? "hidden" : false}
        whileInView={animate ? "visible" : undefined}
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Left column — text sits on top of the dark gradient */}
        <div className="w-full lg:max-w-xl py-24 lg:py-0">
          <Reveal active={animate}>
            <p className="font-mono text-xs tracking-[0.22em] uppercase text-[#B8975A] mb-6">
              {tagline}
            </p>
          </Reveal>

          <Reveal active={animate}>
            <h1 className="font-serif font-normal text-white leading-[1.08] tracking-tight mb-6"
              style={{ fontSize: "clamp(2.2rem, 4vw + 0.5rem, 3.6rem)" }}>
              <Balancer>{title}</Balancer>
            </h1>
          </Reveal>

          <Reveal active={animate}>
            <p className="text-white/75 leading-relaxed text-base lg:text-lg mb-10 max-w-md">
              <Balancer>{description}</Balancer>
            </p>
          </Reveal>

          {/* Elegant quote */}
          <Reveal active={animate}>
            <div className="border-l-2 border-[#B8975A] pl-5 max-w-sm">
              <svg className="w-5 h-5 text-[#B8975A]/70 mb-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-white/65 font-serif italic leading-relaxed text-sm">
                La défense de vos intérêts requiert rigueur, réactivité et une confiance absolue. C'est le fondement de notre engagement à vos côtés.
              </p>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero07;
