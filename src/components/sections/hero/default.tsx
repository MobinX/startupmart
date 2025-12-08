import { type VariantProps } from "class-variance-authority";
import { ArrowRightIcon, Github } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/src/lib/utils";

import { Badge } from "../../ui/badge";
import { Button, buttonVariants } from "../../ui/button";
import Glow from "../../ui/glow";
import { Section } from "../../ui/section";

export interface HeroButtonProps {
  href: string;
  text: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface HeroProps {
  title?: string;
  description?: string;
  badge?: ReactNode | false;
  className?: string;
  buttons?: HeroButtonProps[] | false;
}

export default function Hero({
  title = "Give your big idea the design it deserves",
  description = "Professionally designed blocks and templates built with React, Shadcn/ui and Tailwind that will help your product stand out.",
  badge = (
    <Badge variant="outline" className="animate-appear">
      <span className="text-muted-foreground">
        New version of Launch UI is out!
      </span>
      <a href="https://www.launchuicomponents.com/" className="flex items-center gap-1">
        Get started
        <ArrowRightIcon className="size-3" />
      </a>
    </Badge>
  ),
  buttons = [

    {

      href: "/signup",

      text: "Get Started",

      variant: "default",

    },

    {

      href: "/github",

      text: "Github",

      variant: "glow",

      icon: <Github className="mr-2 size-4" />,

    },

  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0 relative min-h-[80vh] flex flex-col justify-start py-0 sm:py-0 md:py-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-16 pt-8 sm:pt-16 sm:gap-24 relative z-20">
        <div className="flex flex-col items-start gap-6 text-left sm:gap-12">
          {badge !== false && badge}
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-linear-to-r bg-clip-text text-4xl text-[35px] leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            {title}
          </h1>
          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[740px] font-medium text-pretty opacity-0 delay-100 sm:text-xl">
            {description}
          </p>
          {buttons !== false && buttons.length > 0 && (

            <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">

              {buttons.map((button, index) => (

                <Button

                  key={index}

                  variant={button.variant || "default"}

                  size="lg"

                  asChild

                >

                  <a href={button.href}>

                    {button.icon}

                    {button.text}

                    {button.iconRight}

                  </a>

                </Button>

              ))}

            </div>

          )}

        </div>
      </div>
      <div className="relative w-full pt-12">
        <div data-slot="rising-small-illustration" className="relative w-full pt-[20%]">
          <div className="dark:border-brand bg-background/50 border-brand-foreground/80 absolute top-0 -left-[50%] z-10 w-[200%] overflow-hidden rounded-[100%] border-4 pt-[100%] dark:shadow-[0px_0px_12px_var(--brand),0px_0px_64px_var(--brand-foreground),0px_0px_12px_var(--brand)_inset]">
            <div className="animate-pulse-hover bg-brand-foreground/50 absolute top-0 -left-[50%] h-[200%] w-[200%] rounded-[100%]" style={{ maskImage: "radial-gradient(140% 95%, transparent 0%, transparent 35%, black 55%)" }}>
            </div>
            <div className="animate-pulse-hover bg-brand/50 absolute top-0 -left-[50%] h-[200%] w-[200%] rounded-[100%]" style={{ maskImage: "radial-gradient(140% 110%, transparent 0%, transparent 35%, black 55%)" }}>
            </div>
            <div className="animate-pulse-hover bg-brand absolute -top-[5%] -left-[50%] h-[200%] w-[200%] rounded-[100%] dark:bg-white" style={{ maskImage: "radial-gradient(140% 120%, transparent 0%, transparent 38%, black 43%)" }}>
            </div>
          </div>
          <Glow variant="center" />
        </div>
      </div>
    </Section>
  );
}
