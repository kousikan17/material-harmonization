import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { listCPSE } from "@/services/cpse";
import { CPSEDialog } from "./Cpse";

export default function AnalysisModeSelection() {
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMIN";
  const { sector } = useParams<{ sector: string }>();
  
  const sectorName = decodeURIComponent(sector || "Sector");
  const queryClient = useQueryClient();

  const { data: cpses, isLoading, isError } = useQuery({ 
    queryKey: ["cpse", sectorName], 
    queryFn: () => listCPSE(sectorName) 
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cpse", sectorName] });

  const totalMaterials = React.useMemo(() => {
    if (!cpses) return 0;
    return cpses.reduce((acc, cpse) => acc + cpse.total_materials, 0);
  }, [cpses]);

  const isEmpty = !isLoading && (!cpses || cpses.length === 0);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader
        breadcrumbs={[
          { label: "CPSE Network", to: "/cpse/sectors" },
          { label: "Sectors", to: "/cpse/sectors" },
          { label: sectorName }
        ]}
        title={`${sectorName}`}
        subtitle="Select a CPSE company to view its material database and analysis."
        actions={
          isAdmin ? (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add CPSE
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">CPSE Companies in this Sector</h2>
          {!isLoading && cpses && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {cpses.length} CPSE Compan{cpses.length === 1 ? "y" : "ies"} • {totalMaterials} Total Materials
            </p>
          )}
        </div>

        <div className="rounded-md border bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>CPSE Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Loading CPSE companies...
                  </TableCell>
                </TableRow>
              )}
              
              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-red-500">
                    Unable to load CPSE companies. Try again.
                  </TableCell>
                </TableRow>
              )}

              {isEmpty && (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="text-lg font-medium text-slate-900 dark:text-white">No CPSE companies added yet</p>
                      <p className="text-sm text-slate-500">No companies are currently registered under this sector.</p>
                      {isAdmin && (
                        <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4">
                          <Plus className="mr-2 h-4 w-4" />
                          Add CPSE
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && cpses && cpses.map((cpse) => (
                <TableRow key={cpse.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/25">
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {cpse.name}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                    {cpse.code}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {cpse.cognate_group_name || "—"}
                  </TableCell>
                  <TableCell className="text-right text-slate-600 dark:text-slate-400">
                    {cpse.total_materials.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={cpse.is_active ? "success" : "outline"}>
                      {cpse.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/cpse/${cpse.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CPSEDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSaved={invalidate} 
        defaultSector={sectorName} 
      />
    </div>
  );
}
