import { useQuery } from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { listCPSE } from "@/services/cpse";
import type { CPSEBrief } from "@/types";
import { cn } from "@/utils/cn";

interface MultiOrganizationSelectProps {
  selected: CPSEBrief[];
  onChange: (selected: CPSEBrief[]) => void;
  className?: string;
}

export function MultiOrganizationSelect({ selected, onChange, className }: MultiOrganizationSelectProps) {
  const { data: orgs, isLoading } = useQuery({ queryKey: ["cpse"], queryFn: () => listCPSE() });
  const [search, setSearch] = React.useState("");

  const activeCpses = (orgs ?? []).filter((org) => org.is_active);

  const filteredCpses = React.useMemo(() => {
    if (!search.trim()) return activeCpses;
    const lowerSearch = search.toLowerCase();
    return activeCpses.filter(
      (org) => org.code.toLowerCase().includes(lowerSearch) || org.name.toLowerCase().includes(lowerSearch)
    );
  }, [activeCpses, search]);

  const toggleCpse = (cpse: CPSEBrief) => {
    const isSelected = selected.some((s) => s.id === cpse.id);
    if (isSelected) {
      onChange(selected.filter((s) => s.id !== cpse.id));
    } else {
      onChange([...selected, cpse]);
    }
  };

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-md border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950", className)}>
      <div className="flex items-center border-b border-slate-200 dark:border-navy-700 px-3 py-2">
        <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          placeholder="Search CPSEs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200"
        />
      </div>
      
      <div className="max-h-60 overflow-y-auto p-1">
        {isLoading && <div className="p-4 text-center text-sm text-slate-500">Loading organizations...</div>}
        
        {!isLoading && filteredCpses.length === 0 && (
          <div className="p-4 text-center text-sm text-slate-500">No organizations found.</div>
        )}

        {filteredCpses.map((cpse) => {
          const isSelected = selected.some((s) => s.id === cpse.id);
          return (
            <div
              key={cpse.id}
              onClick={() => toggleCpse(cpse)}
              className={cn(
                "flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors",
                isSelected && "bg-slate-50 dark:bg-navy-900"
              )}
            >
              <div
                className={cn(
                  "mr-3 flex h-4 w-4 items-center justify-center rounded-sm border",
                  isSelected
                    ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500"
                    : "border-slate-300 dark:border-navy-600"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span className="flex-1 text-slate-700 dark:text-slate-300">
                <span className="font-semibold">{cpse.code}</span> — {cpse.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
