import * as React from "react";

import { cn } from "@/utils/cn";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded border border-slate-200 dark:border-navy-700 dark:border-navy-700 shadow-sm dark:shadow-none dark:shadow-none bg-white dark:bg-navy-950 dark:bg-navy-950">
      <table className={cn("w-full caption-bottom text-[14px]", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-brand-900", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-slate-200 dark:border-navy-700 dark:border-navy-700 transition-colors hover:bg-blue-50/50", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wider text-white",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle text-slate-800 dark:text-slate-200 dark:text-slate-200", className)} {...props} />;
}
