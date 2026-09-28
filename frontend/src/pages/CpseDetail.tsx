import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Boxes, CheckCircle2, Clock, Layers, AlertTriangle } from "lucide-react";
import React from "react";
import { Link, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { KpiCard } from "@/components/KpiCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCPSE, clearCpseMaterials } from "@/services/cpse";
import { listMaterials } from "@/services/materials";
import { useAuth } from "@/auth/AuthContext";

export default function CpseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: cpse } = useQuery({ queryKey: ["cpse", id], queryFn: () => getCPSE(id!), enabled: !!id });
  const { data: materials } = useQuery({
    queryKey: ["materials", "by-cpse", id],
    queryFn: () => listMaterials({ cpse_id: id, page_size: 20 }),
    enabled: !!id,
  });
  
  const { user } = useAuth();
  const isAdmin = user?.role.name === "ADMIN";
  const queryClient = useQueryClient();
  const [clearing, setClearing] = React.useState(false);

  const clearCpseMutation = useMutation({
    mutationFn: (cpseId: string) => clearCpseMaterials(cpseId),
    onSuccess: () => {
      setClearing(false);
      queryClient.invalidateQueries({ queryKey: ["cpse", id] });
      queryClient.invalidateQueries({ queryKey: ["materials", "by-cpse", id] });
    },
  });

  const sectorName = cpse?.sector_name;

  if (!cpse) return <p className="text-sm text-slate-400">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-navy-700 pb-4">
        <div className="space-y-2">
          <Breadcrumbs items={[{ label: "CPSE Network", to: "/cpse" }, { label: cpse.name }]} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{cpse.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {cpse.code} {sectorName && `· ${sectorName}`} {cpse.administrative_ministry && `· ${cpse.administrative_ministry}`}{" "}
            <Badge variant={cpse.is_active ? "success" : "outline"} className="ml-1">
              {cpse.is_active ? "Active" : "Inactive"}
            </Badge>
          </p>
        </div>
        <StatusBadge status={cpse.synchronization_status} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Materials" value={cpse.total_materials} icon={Boxes} accent="brand" />
        <KpiCard label="Active Materials" value={cpse.active_materials} icon={CheckCircle2} accent="success" />
        <KpiCard label="Inactive Materials" value={cpse.inactive_materials} icon={Layers} accent="slate" />
        <KpiCard label="New Materials" value={cpse.new_materials} icon={Clock} accent="warning" />
        
        <KpiCard label="Common Materials" value={cpse.common_materials} icon={CheckCircle2} accent="success" />
        <KpiCard label="Pending Mappings" value={cpse.pending_mappings} icon={Clock} accent="warning" />
        <KpiCard label="Duplicate Materials" value={cpse.duplicates} icon={Layers} accent="brand" />
        <KpiCard label="Legacy Codes" value={cpse.legacy_codes} icon={Layers} accent="slate" />
      </div>

      <div className="bg-slate-50 dark:bg-navy-900 rounded-lg p-6 border border-slate-200 dark:border-navy-800">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Material Database</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Company: {cpse.name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              CPSE Code: {cpse.code}
            </p>
            <p className="mt-2 text-md font-medium text-slate-900 dark:text-slate-100">
              Materials: {cpse.total_materials}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to={`/materials?cpse_id=${cpse.id}`}>
                View Materials
              </Link>
            </Button>
            {isAdmin && cpse.total_materials > 0 && (
              <Button variant="destructive" onClick={() => setClearing(true)}>
                Clear Materials
              </Button>
            )}
            {cpse.total_materials === 0 && (
              <Button variant="outline" asChild>
                <Link to="/cpse/bulk-add">
                  Upload Materials
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Materials</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials?.items.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link to={`/materials/${m.id}`} className="font-medium text-brand-600 hover:underline">
                    {m.original_material_code}
                  </Link>
                </TableCell>
                <TableCell>{m.original_description}</TableCell>
                <TableCell>{m.classification}</TableCell>
                <TableCell>
                  <StatusBadge status={m.status} />
                </TableCell>
              </TableRow>
            ))}
            {(materials?.items.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-400">
                  No materials added yet for this CPSE.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={clearing} onOpenChange={setClearing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
              Clear Materials from {cpse.code}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will permanently remove all material records belonging to <strong>{cpse.name}</strong>.
            </p>
            <p className="text-sm text-slate-600">
              CPSE company information will NOT be deleted.
            </p>
            <p className="text-sm font-medium text-slate-900">
              Current materials: {cpse.total_materials}
            </p>
            <p className="text-sm font-semibold text-danger-600">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearing(false)} disabled={clearCpseMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => clearCpseMutation.mutate(cpse.id)} disabled={clearCpseMutation.isPending}>
              {clearCpseMutation.isPending ? "Clearing..." : "Clear Materials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
