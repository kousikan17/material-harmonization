import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import * as React from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiErrorMessage } from "@/services/api";
import { createCPSE, updateCPSE, listCPSE, setCPSEStatus, clearCpseMaterials, clearAllMaterials, type CPSEFormPayload } from "@/services/cpse";
import { getHierarchy, getAdministrativeMinistries } from "@/services/masters";
import { type CPSEStats } from "@/types";
import { ALLOWED_CPSE_SECTORS } from "@/constants";

export default function Cpse() {
  const { user } = useAuth();
  const { sector } = useParams<{ sector: string }>();
  const isAdmin = user?.role.name === "ADMIN";
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ 
    queryKey: ["cpse", sector], 
    queryFn: () => listCPSE(sector) 
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCpse, setEditingCpse] = React.useState<CPSEStats | null>(null);
  
  const [clearingCpse, setClearingCpse] = React.useState<CPSEStats | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = React.useState(false);
  const [clearAllConfirmText, setClearAllConfirmText] = React.useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cpse", sector] });

  const statusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => setCPSEStatus(id, is_active),
    onSuccess: invalidate,
  });

  const isAnalysisMode = !!sector;

  const groupedCPSEs = React.useMemo(() => {
    const groups: Record<string, CPSEStats[]> = {};
    ALLOWED_CPSE_SECTORS.forEach(s => groups[s] = []);
    if (!data) return groups;
    data.forEach((cpse) => {
      const s = cpse.sector_name || "Uncategorized";
      if (!groups[s]) groups[s] = [];
      groups[s].push(cpse);
    });
    return groups;
  }, [data]);

  const handleEdit = (cpse: CPSEStats) => {
    setEditingCpse(cpse);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCpse(null);
    setDialogOpen(true);
  };

  const clearCpseMutation = useMutation({
    mutationFn: (id: string) => clearCpseMaterials(id),
    onSuccess: () => {
      setClearingCpse(null);
      invalidate();
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => clearAllMaterials(),
    onSuccess: () => {
      setClearAllDialogOpen(false);
      setClearAllConfirmText("");
      invalidate();
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={
          isAnalysisMode 
            ? [
                { label: "CPSE Network", to: "/cpse/sectors" },
                { label: "Sectors", to: "/cpse/sectors" },
                { label: "Sector Analysis", to: `/cpse/sectors/${sector}/analysis-mode` },
                { label: "Single Analysis" }
              ]
            : [{ label: "CPSE Network", to: "/cpse" }, { label: "Participating CPSEs" }]
        }
        title={isAnalysisMode ? `Sector Analysis - Single` : "Participating CPSEs"}
        subtitle={
          isAnalysisMode 
            ? "Select a CPSE to analyze its materials individually."
            : "Every Central Public Sector Enterprise onboarded to the National Material Master."
        }
        actions={
          isAdmin && !isAnalysisMode ? (
            <div className="flex items-center gap-2">
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" /> Add CPSE
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cpse/bulk-add">
                  <Plus className="h-4 w-4 mr-2" /> Bulk Add CPSE
                </Link>
              </Button>
              <Button variant="destructive" onClick={() => setClearAllDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Clear All Materials
              </Button>
            </div>
          ) : undefined
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CPSE</TableHead>
            <TableHead>Total Materials</TableHead>
            <TableHead>Common Materials</TableHead>
            <TableHead>Ministry</TableHead>
            <TableHead>Pending Mappings</TableHead>
            <TableHead>Sync Status</TableHead>
            <TableHead>Status</TableHead>
            {isAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-slate-400">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!isLoading && (data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-slate-400">
                No CPSEs onboarded yet.
              </TableCell>
            </TableRow>
          )}
          {Object.entries(groupedCPSEs).map(([groupSector, cpses]) => (
            <React.Fragment key={groupSector}>
              <TableRow className="bg-slate-50 dark:bg-navy-900/50 hover:bg-slate-50 dark:hover:bg-navy-900/50">
                <TableCell colSpan={isAdmin ? 8 : 7} className="py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {groupSector} 
                  <span className="ml-2 font-normal text-slate-400">({cpses.length} CPSEs)</span>
                </TableCell>
              </TableRow>
              {cpses.map((cpse) => (
                <TableRow key={cpse.id}>
                  <TableCell>
                    <Link to={`/cpse/${cpse.id}`} className="font-semibold text-brand-600 hover:underline">
                      {cpse.code}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cpse.name}</p>
                  </TableCell>
                  <TableCell>{cpse.total_materials}</TableCell>
                  <TableCell>{cpse.common_materials}</TableCell>
                  <TableCell>{cpse.administrative_ministry || "-"}</TableCell>
                  <TableCell>{cpse.pending_mappings}</TableCell>
                  <TableCell>
                    <StatusBadge status={cpse.synchronization_status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={cpse.is_active ? "success" : "outline"}>{cpse.is_active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-brand-600"
                          onClick={() => handleEdit(cpse)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: cpse.id, is_active: !cpse.is_active })}
                        >
                          {cpse.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setClearingCpse(cpse)}
                        >
                          Clear Materials
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      <CPSEDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={invalidate} editingCpse={editingCpse} />
      
      {/* Clear Single CPSE Dialog */}
      <Dialog open={!!clearingCpse} onOpenChange={(open) => !open && setClearingCpse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
              Clear Materials from {clearingCpse?.code}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will permanently remove all material records belonging to <strong>{clearingCpse?.name}</strong>.
            </p>
            <p className="text-sm text-slate-600">
              CPSE company information will NOT be deleted.
            </p>
            <p className="text-sm font-medium text-slate-900">
              Current materials: {clearingCpse?.total_materials}
            </p>
            <p className="text-sm font-semibold text-danger-600">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearingCpse(null)} disabled={clearCpseMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => clearingCpse && clearCpseMutation.mutate(clearingCpse.id)} disabled={clearCpseMutation.isPending}>
              {clearCpseMutation.isPending ? "Clearing..." : "Clear Materials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All CPSEs Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
              Clear ALL Material Data?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              This will permanently delete material records from <strong>ALL CPSE companies</strong>.
            </p>
            <p className="text-sm text-slate-600">
              CPSE company records will NOT be deleted.
            </p>
            <p className="text-sm font-semibold text-danger-600">
              This action cannot be undone.
            </p>
            <div className="space-y-2">
              <Label>
                Type <strong>CLEAR MATERIALS</strong> to confirm
              </Label>
              <Input 
                value={clearAllConfirmText} 
                onChange={(e) => setClearAllConfirmText(e.target.value)}
                placeholder="CLEAR MATERIALS"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearAllDialogOpen(false)} disabled={clearAllMutation.isPending}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => clearAllMutation.mutate()} 
              disabled={clearAllMutation.isPending || clearAllConfirmText !== "CLEAR MATERIALS"}
            >
              {clearAllMutation.isPending ? "Clearing..." : "Clear All Materials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CPSEDialog({ open, onOpenChange, onSaved, editingCpse, defaultSector }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void; editingCpse?: CPSEStats | null; defaultSector?: string }) {
  const [form, setForm] = React.useState<CPSEFormPayload>({});
  
  const { data: hierarchy } = useQuery({
    queryKey: ["masters", "hierarchy"],
    queryFn: getHierarchy,
    staleTime: Infinity,
  });

  const { data: ministries } = useQuery({
    queryKey: ["masters", "administrative-ministries"],
    queryFn: getAdministrativeMinistries,
    staleTime: Infinity,
  });

  const [selectedSector, setSelectedSector] = React.useState<string>(defaultSector || ALLOWED_CPSE_SECTORS[0]);

  React.useEffect(() => {
    if (open) {
      if (editingCpse) {
        setForm({
          code: editingCpse.code,
          name: editingCpse.name,
          cognate_group_id: editingCpse.cognate_group_id || "",
          administrative_ministry_id: editingCpse.administrative_ministry_id || "",
          description: editingCpse.description || "",
          material_database_available: editingCpse.material_database_available,
          is_active: editingCpse.is_active,
        });
        if (editingCpse.sector_name) setSelectedSector(editingCpse.sector_name);
      } else {
        setForm({
          material_database_available: true,
          is_active: true,
          cognate_group_id: "",
          administrative_ministry_id: "",
        });
        setSelectedSector(defaultSector || ALLOWED_CPSE_SECTORS[0]);
      }
    }
  }, [open, editingCpse, defaultSector]);
  
  // Update cognate_group_id when sector changes if it doesn't match the new sector
  React.useEffect(() => {
    if (!hierarchy || !open) return;
    const sector = hierarchy.find(s => s.name === selectedSector);
    if (sector && sector.cognate_groups.length > 0) {
      const isCurrentGroupValid = sector.cognate_groups.some(cg => cg.id === form.cognate_group_id);
      if (!isCurrentGroupValid) {
        setForm(prev => ({ ...prev, cognate_group_id: sector.cognate_groups[0].id }));
      }
    }
  }, [selectedSector, hierarchy, open, form.cognate_group_id]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (editingCpse) {
        await updateCPSE(editingCpse.id, form);
        if (form.is_active !== undefined && form.is_active !== editingCpse.is_active) {
          await setCPSEStatus(editingCpse.id, form.is_active);
        }
      } else {
        const newCpse = await createCPSE(form);
        if (form.is_active === false) {
          await setCPSEStatus(newCpse.id, false);
        }
      }
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error("CPSE mutation failed:", err);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingCpse ? "Edit CPSE" : "Add CPSE"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CPSE Code *</Label>
              <Input
                required
                value={form.code ?? ""}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. GAIL"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sector *</Label>
              <select
                required
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
              >
                {(hierarchy || []).map(sector => (
                  <option key={sector.id} value={sector.name}>{sector.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cognate Group *</Label>
              <select
                required
                value={form.cognate_group_id ?? ""}
                onChange={(e) => setForm({ ...form, cognate_group_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
              >
                {hierarchy?.find(s => s.name === selectedSector)?.cognate_groups.map(cg => (
                  <option key={cg.id} value={cg.id}>{cg.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Administrative Ministry</Label>
              <select
                value={form.administrative_ministry_id ?? ""}
                onChange={(e) => setForm({ ...form, administrative_ministry_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
              >
                <option value="">Select Ministry...</option>
                {(ministries || []).map(min => (
                  <option key={min.id} value={min.id}>{min.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>CPSE Name *</Label>
            <Input required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. GAIL (India) Limited" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 flex flex-col">
              <Label>Material Database Available</Label>
              <select
                value={form.material_database_available ? "Yes" : "No"}
                onChange={(e) => setForm({ ...form, material_database_available: e.target.value === "Yes" })}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="space-y-1.5 flex flex-col">
              <Label>Status</Label>
              <select
                value={form.is_active ? "Active" : "Inactive"}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === "Active" })}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {mutation.isError && <p className="text-sm text-danger-600">{apiErrorMessage(mutation.error)}</p>}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : (editingCpse ? "Update CPSE" : "Create CPSE")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
