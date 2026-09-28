import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "brand" | "success" | "warning" | "danger" | "slate";
  hint?: string;
}

const ACCENT_STYLES: Record<NonNullable<KpiCardProps["accent"]>, { icon: string }> = {
  brand: { icon: "text-brand-700" },
  success: { icon: "text-emerald-600" },
  warning: { icon: "text-amber-600" },
  danger: { icon: "text-rose-600" },
  slate: { icon: "text-slate-500 dark:text-slate-400" },
};

export function KpiCard({ label, value, icon: Icon, accent = "brand", hint }: KpiCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <Card className="rounded shadow-sm dark:shadow-none border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 hover:shadow-md transition-shadow">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className={cn("flex shrink-0 items-center justify-center p-2 rounded-full bg-slate-50 dark:bg-navy-900", styles.icon)}>
          <Icon className="h-5 w-5 opacity-90" strokeWidth={1.5} />
        </div>
      </CardContent>
    </Card>
  );
}
