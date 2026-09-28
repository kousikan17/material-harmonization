import * as React from "react";
import { Layers } from "lucide-react";

export function GovLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-brand-900 rounded-lg shrink-0">
          <Layers className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-lg md:text-xl font-bold leading-tight text-slate-900 dark:text-white">
            Material Harmonization Platform
          </span>
          <span className="text-xs md:text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400">
            Enterprise Intelligence System
          </span>
        </div>
      </div>
    </div>
  );
}
