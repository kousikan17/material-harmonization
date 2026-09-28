import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-600 text-white hover:bg-brand-700",
        destructive: "bg-danger-600 text-white hover:bg-danger-500",
        outline: "border border-slate-300 dark:border-navy-700 dark:border-navy-700 bg-white dark:bg-navy-950 dark:bg-navy-950 text-slate-700 dark:text-slate-300 dark:text-slate-300 hover:bg-slate-50 dark:bg-navy-900 dark:bg-navy-900",
        secondary: "bg-slate-100 dark:bg-navy-800 dark:bg-navy-800 text-slate-900 dark:text-slate-100 dark:text-slate-100 hover:bg-slate-200 dark:bg-navy-700 dark:bg-navy-700",
        ghost: "text-slate-700 dark:text-slate-300 dark:text-slate-300 hover:bg-slate-100 dark:bg-navy-800 dark:bg-navy-800",
        success: "bg-success-600 text-white hover:bg-success-500",
        link: "text-brand-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
