import * as React from "react";

import { cn } from "@/utils/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-slate-300 dark:border-navy-700 dark:border-navy-700 bg-white dark:bg-navy-950 dark:bg-navy-950 px-3 py-1 text-sm shadow-sm dark:shadow-none dark:shadow-none transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
