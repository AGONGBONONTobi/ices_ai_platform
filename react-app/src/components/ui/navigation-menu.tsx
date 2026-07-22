import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  name: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "presentation", name: "Présentation", href: "#presentation" },
  { id: "competences", name: "Compétences", href: "#competences" },
  { id: "honoraires", name: "Honoraires", href: "#honoraires" },
  { id: "contact", name: "Contact", href: "#contact" },
];

const EXPAND_SCROLL_THRESHOLD = 80;

const containerVariants = {
  expanded: {
    y: 0,
    opacity: 1,
    width: "auto",
    transition: {
      y: { type: "spring", damping: 18, stiffness: 250 },
      opacity: { duration: 0.3 },
      type: "spring",
      damping: 20,
      stiffness: 300,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
  collapsed: {
    y: 0,
    opacity: 1,
    width: "3rem",
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const logoVariants = {
  expanded: { opacity: 1, x: 0, rotate: 0, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -25, rotate: -180, transition: { duration: 0.3 } },
};

const itemVariants = {
  expanded: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", damping: 15 } },
  collapsed: { opacity: 0, x: -20, scale: 0.95, transition: { duration: 0.2 } },
};

const collapsedIconVariants = {
  expanded: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  collapsed: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 300,
      delay: 0.15,
    },
  },
};

export function AnimatedNavFramer({ activeSection }: { activeSection?: string }) {
  const [isExpanded, setExpanded] = React.useState(true);

  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);
  const scrollPositionOnCollapse = React.useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;

    if (isExpanded && latest > previous && latest > 150) {
      setExpanded(false);
      scrollPositionOnCollapse.current = latest;
    } else if (
      !isExpanded &&
      latest < previous &&
      scrollPositionOnCollapse.current - latest > EXPAND_SCROLL_THRESHOLD
    ) {
      setExpanded(true);
    }

    lastScrollY.current = latest;
  });

  const handleNavClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      setExpanded(true);
    }
  };

  return (
    <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[60]">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        whileHover={!isExpanded ? { scale: 1.1 } : {}}
        whileTap={!isExpanded ? { scale: 0.95 } : {}}
        onClick={handleNavClick}
        aria-label="Navigation principale"
        className={cn(
          "flex items-center overflow-hidden rounded-full border bg-background/80 shadow-lg backdrop-blur-sm h-12",
          !isExpanded && "cursor-pointer justify-center"
        )}
      >
        <motion.a
          href="#accueil"
          aria-label="Maître Moradéké Badirou — Accueil"
          variants={logoVariants}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 flex items-center pl-2.5 sm:pl-3 pr-1 sm:pr-2 no-underline"
        >
          <img src="/assets/img/moradeke-badirou-logo.png" alt="" className="h-5 w-5 sm:h-6 sm:w-6 object-contain" />
        </motion.a>

        <motion.div
          className={cn(
            "flex items-center gap-0 sm:gap-3 pr-3 sm:pr-4",
            !isExpanded && "pointer-events-none"
          )}
        >
          {NAV_ITEMS.map((item) => (
            <motion.a
              key={item.id}
              href={item.href}
              variants={itemVariants}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "no-underline whitespace-nowrap text-[10px] sm:text-sm font-medium transition-colors px-1 sm:px-2 py-1",
                activeSection === item.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.name}
            </motion.a>
          ))}
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div variants={collapsedIconVariants} animate={isExpanded ? "expanded" : "collapsed"}>
            <Menu className="h-5 w-5 text-foreground" />
          </motion.div>
        </div>
      </motion.nav>
    </div>
  );
}
