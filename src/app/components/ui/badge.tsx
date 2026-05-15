import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white [a&]:hover:bg-primary/90",
        secondary:
          "border-stone-200 bg-stone-100 text-stone-700 [a&]:hover:bg-stone-200",
        destructive:
          "border-transparent bg-danger text-white [a&]:hover:bg-danger/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // ─── Semantic variants ──────────────────────────────────────────
        success:
          "border-transparent bg-success-100 text-success-700",
        warning:
          "border-transparent bg-warning-100 text-warning-700",
        danger:
          "border-transparent bg-danger-100 text-danger-700",
        info:
          "border-transparent bg-info-100 text-info-700",
        stone:
          "border-stone-200 bg-stone-100 text-stone-600",
        ai:
          "border-transparent bg-ai-100 text-ai-700",
        primary:
          "border-transparent bg-primary-100 text-primary-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
