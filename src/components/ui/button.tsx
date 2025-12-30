import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold font-body uppercase tracking-wider ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 neon-glow hover:neon-glow-strong rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:neon-glow rounded-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md",
        ghost:
          "hover:bg-accent/10 hover:text-accent rounded-md",
        link:
          "text-primary underline-offset-4 hover:underline",
        hero:
          "bg-primary text-primary-foreground font-display text-lg clip-corner-sm neon-glow hover:neon-glow-strong hover:scale-105",
        heroOutline:
          "border-2 border-primary/50 bg-transparent text-foreground font-display text-lg clip-corner-sm hover:border-primary hover:bg-primary/10 hover:neon-glow",
        neon:
          "bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground neon-glow rounded-md",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
