import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import * as React from "react";
import { Loader2, Plus } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { listCPSE } from "@/services/cpse";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CPSEDialog } from "@/pages/Cpse";
import { ALLOWED_CPSE_SECTORS } from "@/constants";

function getSectorMetadata(sectorName: string) {
  const s = sectorName.toLowerCase();
  if (s.includes("oil") || s.includes("gas")) return { icon: "🏭", desc: "Petroleum and Natural Gas" };
  if (s.includes("mining") || s.includes("exploration")) return { icon: "⛏️", desc: "Coal, Minerals, and Oil Exploration" };
  if (s.includes("manufacturing") || s.includes("processing") || s.includes("power")) return { icon: "⚡", desc: "Heavy Industries, Steel, and Power" };
  if (s.includes("agriculture")) return { icon: "🌾", desc: "Farming, Seeds, and Fertilizers" };
  if (s.includes("service")) return { icon: "🏢", desc: "Consulting, IT, and Financial Services" };
  return { icon: "🏢", desc: "General CPSE Sector" };
}

export default function SectorSelection() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMIN";
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Fetch all CPSEs to calculate counts per sector
  const { data: cpses, isLoading, refetch } = useQuery({
    queryKey: ["cpses"],
    queryFn: () => listCPSE()
  });

  const sectors = React.useMemo(() => {
    const sectorMap = new Map<string, number>();
    ALLOWED_CPSE_SECTORS.forEach(s => sectorMap.set(s, 0));
    
    if (cpses) {
      for (const c of cpses) {
        const s = c.sector_name;
        if (s && sectorMap.has(s)) {
          sectorMap.set(s, sectorMap.get(s)! + 1);
        }
      }
    }
    
    return ALLOWED_CPSE_SECTORS.map((name) => {
      const meta = getSectorMetadata(name);
      return {
        id: name,
        name,
        count: sectorMap.get(name) || 0,
        icon: meta.icon,
        description: meta.desc
      };
    });
  }, [cpses]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        breadcrumbs={[{ label: "CPSE Network", to: "/cpse/sectors" }, { label: "Sectors" }]}
        title="CPSE Sector Organization"
        subtitle="Select a sector to analyze its CPSE companies for material harmonization."
        actions={
          isAdmin ? (
            <div className="flex gap-2">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add CPSE
              </Button>
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {sectors.map((sector) => {
            const count = sector.count;
            return (
              <Link key={sector.id} to={`/cpse/sectors/${encodeURIComponent(sector.id)}/analysis-mode`}>
                <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-brand-900/20" />
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl shadow-sm dark:bg-slate-800 transition-transform duration-300 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-700">
                        {sector.icon}
                      </div>
                      <Badge variant={count > 0 ? "default" : "outline"} className="font-semibold shadow-sm uppercase">
                        {count} CPSE{count === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {sector.name}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                      {sector.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <CPSEDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => refetch()} />
    </div>
  );
}
