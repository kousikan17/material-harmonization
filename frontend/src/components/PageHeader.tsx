import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/Breadcrumbs";

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ breadcrumbs, title, subtitle, description, actions }: PageHeaderProps) {
  const displaySubtitle = subtitle || description;
  return (
    <div className="mb-6 space-y-3 pb-5 border-b border-slate-200 dark:border-navy-700">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-950 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-brand-700 rounded-sm inline-block"></span>
              {title}
            </h1>
            <span 
              className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 bg-amber-100 border border-amber-200 rounded-sm uppercase cursor-help"
              title="CPSE onboarding and material uploads are manually managed. Automatic external synchronization is disabled."
            >
              Manual Prototype Mode
            </span>
          </div>
          {displaySubtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 ml-4">{displaySubtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
