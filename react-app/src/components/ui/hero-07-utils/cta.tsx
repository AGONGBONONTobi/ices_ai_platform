import type { ReactNode } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export interface CtaProps {
  ctaEnabled: boolean;
  text: string;
  link: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
}

export function Cta({ cta }: { cta: CtaProps }) {
  return (
    <Button asChild variant={cta.variant ?? "default"}>
      <a href={cta.link} className="gap-2">
        {cta.icon}
        {cta.text}
      </a>
    </Button>
  );
}
