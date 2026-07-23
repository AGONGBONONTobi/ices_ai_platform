"use client";

import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Quote className="size-4 text-gold-light" />,
  title = "Client",
  description = "Témoignage...",
  date = "",
  iconClassName = "text-gold",
  titleClassName = "text-gold",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[12rem] w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 border-[rgba(184,151,90,0.15)] bg-parchment-warm/90 backdrop-blur-sm px-6 py-5 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-[''] hover:border-[rgba(184,151,90,0.4)] hover:bg-parchment-warm [&>*]:flex [&>*]:items-center [&>*]:gap-2 shadow-xl",
        className
      )}
    >
      <div>
        <span className="relative flex items-center justify-center rounded-full bg-[rgba(184,151,90,0.1)] p-2">
          {icon}
        </span>
        <p className={cn("text-lg font-serif font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="text-base italic leading-relaxed text-muted-ink mt-2 mb-2 line-clamp-4">"{description}"</p>
      <p className="text-xs font-mono uppercase tracking-widest text-gold-light">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration:700 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
