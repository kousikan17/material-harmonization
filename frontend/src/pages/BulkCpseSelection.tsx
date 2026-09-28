import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate } from "react-router-dom";
import * as React from "react";
import { Loader2, CheckSquare, Square, Zap } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bulkAnalyzeCPSE, listCPSE, getAnalysisStatus } from "@/services/cpse";
import { apiErrorMessage } from "@/services/api";

export default function BulkCpseSelection() {
  const { sector } = useParams<{ sector: string }>();
  const sectorName = decodeURIComponent(sector || "Sector");
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ["cpse", sector],
    queryFn: () => listCPSE(sector),
  });

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (!companies) return;
    if (selectedIds.size === companies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(companies.map((c) => c.id)));
    }
  };

  const [jobId, setJobId] = React.useState<string | null>(null);

  const { data: jobStatus } = useQuery({
    queryKey: ["analysisJob", jobId],
    queryFn: () => getAnalysisStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === "queued" || status === "processing") ? 1000 : false;
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: () => bulkAnalyzeCPSE(Array.from(selectedIds)),
    onSuccess: (data) => {
      setJobId(data.job_id);
    },
  });

  if (jobStatus) {
    if (jobStatus.status === "completed") {
      return (
        <div className="space-y-6 max-w-xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-lg border bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-600 mb-4">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analysis Complete</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Companies Analyzed: {jobStatus.company_ids.length}<br/>
              Materials Analyzed: {jobStatus.total_materials}
            </p>
            <Button
              onClick={() => navigate(`/harmonization/recommendations?company_ids=${jobStatus.company_ids.join(",")}`)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              View Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 max-w-xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-lg border bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-600 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Analysis in Progress</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">Processing {jobStatus.company_ids.length} CPSE databases...</p>
          <div className="w-full bg-slate-100 rounded-full h-2.5 dark:bg-slate-800 mb-2">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${jobStatus.total_materials > 0 ? (jobStatus.processed_materials / jobStatus.total_materials) * 100 : 0}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Materials processed: {jobStatus.processed_materials} / {jobStatus.total_materials}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        breadcrumbs={[
          { label: "CPSE Network", to: "/cpse/sectors" },
          { label: "Sectors", to: "/cpse/sectors" },
          { label: sectorName, to: `/cpse/sectors/${sector}/analysis-mode` },
          { label: "Bulk Analysis" },
        ]}
        title="Bulk CPSE Analysis"
        subtitle={`Select multiple companies in the ${sectorName} sector to harmonize their material databases together.`}
        actions={
          <Button 
            disabled={selectedIds.size === 0 || analyzeMutation.isPending} 
            onClick={() => analyzeMutation.mutate()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Run Bulk Analysis ({selectedIds.size})
          </Button>
        }
      />

      {analyzeMutation.isError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger-900 dark:border-danger-900/50 dark:bg-danger-900/20 dark:text-danger-200">
          {apiErrorMessage(analyzeMutation.error)}
        </div>
      )}

      <div className="rounded-md border bg-white dark:border-slate-800 dark:bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <button onClick={toggleAll} className="flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 w-full h-full">
                  {companies && selectedIds.size === companies.length && companies.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
              </TableHead>
              <TableHead>CPSE Code</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Pending Materials</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                  Loading companies...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && (companies ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                  No CPSEs found in this sector.
                </TableCell>
              </TableRow>
            )}
            {companies?.map((cpse) => (
              <TableRow 
                key={cpse.id} 
                className={`cursor-pointer transition-colors ${selectedIds.has(cpse.id) ? "bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                onClick={() => toggleSelection(cpse.id)}
              >
                <TableCell className="text-center">
                  {selectedIds.has(cpse.id) ? (
                    <CheckSquare className="inline-block h-5 w-5 text-indigo-600" />
                  ) : (
                    <Square className="inline-block h-5 w-5 text-slate-400" />
                  )}
                </TableCell>
                <TableCell className="font-semibold text-brand-600 dark:text-brand-400">
                  {cpse.code}
                </TableCell>
                <TableCell>{cpse.name}</TableCell>
                <TableCell>
                  <span className={cpse.pending_mappings > 0 ? "text-amber-600 font-medium" : "text-slate-500"}>
                    {cpse.pending_mappings} materials
                  </span>
                </TableCell>
                <TableCell>
                  {cpse.material_database_available ? (
                    <span className="text-success-600 text-sm font-medium flex items-center">
                      <span className="h-2 w-2 rounded-full bg-success-500 mr-2" /> Ready
                    </span>
                  ) : (
                    <span className="text-slate-400 text-sm flex items-center">
                      <span className="h-2 w-2 rounded-full bg-slate-300 mr-2" /> Unavailable
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
