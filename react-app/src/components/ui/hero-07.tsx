import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Balancer from "react-wrap-balancer";

import { cn } from "@/lib/utils";
import { Cta, type CtaProps } from "@/components/ui/hero-07-utils/cta";

export interface Hero07Props {
  tagline: string;
  title: string;
  description: string;
  landscapeImage: string;
  landscapeAlt?: string;
  animation?: "none" | "subtle";
  primaryCTA?: CtaProps;
  secondaryCTA?: CtaProps;
  variant?: "standard" | "compact";
}

const variantStyles = {
  standard: {
    copy: "pb-20 pt-10 sm:pb-28 sm:pt-12 lg:pb-32",
    tagline: "text-sm sm:text-base",
    title: "text-3xl sm:text-4xl md:text-5xl",
    description: "text-sm sm:text-base",
    header: "gap-6 sm:gap-8",
    grid: "gap-10",
  },
  compact: {
    copy: "pb-14 pt-8 sm:pb-20 sm:pt-10 lg:pb-24",
    tagline: "text-sm",
    title: "text-2xl sm:text-3xl md:text-4xl",
    description: "text-sm",
    header: "gap-4 sm:gap-5",
    grid: "gap-8",
  },
} as const;

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
};

const mediaItem: Variants = {
  hidden: { opacity: 0, y: -20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
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
  primaryCTA,
  secondaryCTA,
  variant = "standard",
}: Readonly<Hero07Props>) {
  const reduce = useReducedMotion();
  const animate = animation === "subtle" && !reduce;
  const vs = variantStyles[variant];

  const taglineElement = tagline && (
    <p className={cn("text-muted-foreground max-w-xs leading-relaxed tracking-tight", vs.tagline)}>
      <Balancer>{tagline}</Balancer>
    </p>
  );

  const titleElement = title && (
    <h1 className={cn("text-foreground font-serif font-normal tracking-tight text-balance", vs.title)}>
      <Balancer>{title}</Balancer>
    </h1>
  );

  const descriptionElement = description && (
    <p className={cn("text-muted-foreground max-w-xl leading-relaxed", vs.description)}>
      <Balancer>{description}</Balancer>
    </p>
  );

  const ctasElement = (primaryCTA?.ctaEnabled || secondaryCTA?.ctaEnabled) && (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {primaryCTA?.ctaEnabled && <Cta cta={primaryCTA} />}
      {secondaryCTA?.ctaEnabled && <Cta cta={{ ...secondaryCTA, variant: secondaryCTA.variant ?? "link" }} />}
    </div>
  );

  return (
    <section className="relative isolate w-full min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      {landscapeImage && (
        <div className="absolute inset-0 -z-10">
          <img
            src={landscapeImage}
            alt={landscapeAlt}
            className="w-full h-full object-cover object-center"
          />
          {/* Strong dark overlay for readability */}
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <motion.div
        className={cn("relative z-10 mx-auto w-full max-w-7xl px-6", vs.copy)}
        variants={animate ? container : undefined}
        initial={animate ? "hidden" : false}
        whileInView={animate ? "visible" : undefined}
        viewport={{ once: true, margin: "-80px" }}
      >
        {/* Left-aligned content */}
        <Reveal active={animate} className={cn("flex flex-col max-w-3xl lg:items-start lg:text-left", vs.header)}>
          {/* Force text color to white/light for readability against dark overlay */}
          <div className="text-white/90">
            {taglineElement && (
              <p className={cn("max-w-xs leading-relaxed tracking-widest uppercase font-mono text-[#B8975A] mb-4", vs.tagline)}>
                <Balancer>{tagline}</Balancer>
              </p>
            )}
            {titleElement && (
              <h1 className={cn("font-serif font-normal tracking-tight text-balance text-white mb-6", vs.title)}>
                <Balancer>{title}</Balancer>
              </h1>
            )}
            {descriptionElement && (
              <p className={cn("max-w-xl leading-relaxed text-white/80 text-lg mb-8", vs.description)}>
                <Balancer>{description}</Balancer>
              </p>
            )}
            {ctasElement && (
              <div className="dark flex flex-wrap items-center gap-x-4 gap-y-3 mt-4">
                {primaryCTA?.ctaEnabled && <Cta cta={{...primaryCTA, variant: "default"}} />}
                {secondaryCTA?.ctaEnabled && <Cta cta={{ ...secondaryCTA, variant: "outline" }} />}
              </div>
            )}
          </div>
        </Reveal>
      </motion.div>
    </section>
  );
}

export default Hero07;
