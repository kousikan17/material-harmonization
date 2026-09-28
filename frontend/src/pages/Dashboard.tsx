import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  FileClock,
  GitCompareArrows,
  Landmark,
  Layers,
  Sparkles,
  Wallet,
  ArrowRight,
  Plus,
} from "lucide-react";
import * as React from "react";
import { Link } from "react-router-dom";

import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPendingApprovals } from "@/services/approvals";
import { getStatistics } from "@/services/dashboard";
import { CPSEDialog } from "@/pages/Cpse";

function timeAgo(iso?: string | null): string {
  if (!iso) return "Never";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { data: stats } = useQuery({ queryKey: ["dashboard", "statistics"], queryFn: getStatistics, refetchInterval: 15000 });
  const { data: pending } = useQuery({ queryKey: ["approvals", "pending", "dashboard-widget"], queryFn: listPendingApprovals });

  return (
    <div className="space-y-10">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="National Material Master Control Center"
        subtitle="Automatically ingested CPSE material data, harmonized by the AI pipeline into a single Common National Material Code."
        actions={
          <>
            <Button variant="outline" className="border-brand-200 text-brand-900 hover:bg-brand-50" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add CPSE Network
            </Button>
            <Button asChild className="bg-brand-900 hover:bg-brand-800 text-white shadow-sm dark:shadow-none">
              <Link to="/common-material-master">Common Materials</Link>
            </Button>
          </>
        }
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-navy-700 pb-2">National Coverage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="CPSEs Connected" value={stats?.cpses_connected ?? "—"} icon={Landmark} accent="brand" />
          <KpiCard label="Total Sectors" value={stats?.total_sectors ?? "—"} icon={Layers} accent="brand" />
          <KpiCard label="Total Materials" value={stats?.total_materials ?? "—"} icon={Layers} accent="brand" />
          <KpiCard label="Common Material Codes" value={stats?.common_material_codes ?? "—"} icon={Layers} accent="success" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-navy-700 pb-2">Harmonization Quality</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-5">
          <Link to="/harmonization/duplicates" className="block outline-none ring-brand-500 focus-visible:ring-2 rounded">
            <KpiCard label="Duplicates Identified" value={stats?.duplicates_identified ?? "—"} icon={Copy} accent="warning" hint="View Duplicates →" />
          </Link>
          <Link to="/harmonization/near-duplicates" className="block outline-none ring-brand-500 focus-visible:ring-2 rounded">
            <KpiCard label="Near Duplicates" value={stats?.near_duplicates ?? "—"} icon={GitCompareArrows} accent="brand" />
          </Link>
          <Link to="/harmonization/functional-equivalence" className="block outline-none ring-brand-500 focus-visible:ring-2 rounded">
            <KpiCard label="Functionally Equivalent" value={stats?.functionally_equivalent ?? "—"} icon={CheckCircle2} accent="success" />
          </Link>
          <Link to="/harmonization/technical-conflicts" className="block outline-none ring-brand-500 focus-visible:ring-2 rounded">
            <KpiCard label="Technical Conflicts" value={stats?.technical_conflicts ?? "—"} icon={AlertTriangle} accent="danger" />
          </Link>
          <Link to="/approvals/pending" className="block outline-none ring-brand-500 focus-visible:ring-2 rounded">
            <KpiCard label="Pending Validation" value={stats?.pending_validation ?? "—"} icon={Clock} accent="warning" />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-navy-700 pb-2">Governance & Procurement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100%-48px)]">
            <KpiCard label="Legacy Codes Rationalized" value={stats?.legacy_codes_rationalized ?? "—"} icon={FileClock} accent="slate" />
            <KpiCard label="New Materials Today" value={stats?.new_materials_today ?? "—"} icon={Sparkles} accent="brand" />
            <div className="md:col-span-2">
              <KpiCard
                label="Potential Procurement Aggregation"
                value={stats ? stats.potential_procurement_aggregation_value.toLocaleString() : "—"}
                icon={Wallet}
                accent="success"
                hint="Estimated quantity - not a savings claim"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-700 pb-2">
             <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Pending Validation</h2>
             <Link to="/approvals/pending" className="text-[13px] font-medium text-brand-700 hover:text-brand-900 flex items-center gap-1">
               View all <ArrowRight className="h-3.5 w-3.5" />
             </Link>
          </div>
          <Card className="border border-slate-200 dark:border-navy-700 shadow-sm dark:shadow-none rounded bg-white dark:bg-navy-950 h-[calc(100%-48px)] overflow-hidden">
            <CardContent className="space-y-3 p-5">
              {(pending ?? []).slice(0, 5).map((mapping) => (
                <Link
                  key={mapping.id}
                  to={`/approvals/${mapping.id}`}
                  className="flex items-center justify-between rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-950 p-3 hover:border-brand-200 hover:bg-brand-50 transition-colors"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{mapping.cpse_material.original_material_code}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">vs {mapping.matched_against?.original_material_code ?? "manual review"}</p>
                  </div>
                  <Badge variant="outline" className="font-medium bg-slate-50 dark:bg-navy-900 text-slate-700 dark:text-slate-300">
                    {mapping.confidence_score ? `${mapping.confidence_score.toFixed(1)}%` : "Manual"}
                  </Badge>
                </Link>
              ))}
              {(pending ?? []).length === 0 && (
                <p className="py-10 text-center text-[15px] text-slate-500 dark:text-slate-400">No pending validations right now.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-navy-700 pb-2">Today's Material Imports</h2>
        <Card className="border border-slate-200 dark:border-navy-700 shadow-sm dark:shadow-none rounded bg-white dark:bg-navy-950 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-navy-900 text-xs uppercase text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">CPSE</th>
                    <th className="px-4 py-3 font-semibold">Sector</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Records</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
                  {stats?.todays_imports?.map((importJob, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-navy-900 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{importJob.cpse_name}</td>
                      <td className="px-4 py-3">{importJob.sector || "N/A"}</td>
                      <td className="px-4 py-3 tabular-nums">{importJob.upload_time}</td>
                      <td className="px-4 py-3 tabular-nums">{importJob.total_records}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={
                          importJob.status === "COMPLETED" ? "border-success-200 text-success-700 bg-success-50" :
                          importJob.status === "FAILED" ? "border-danger-200 text-danger-700 bg-danger-50" :
                          "border-brand-200 text-brand-700 bg-brand-50"
                        }>
                          {importJob.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!stats?.todays_imports || stats.todays_imports.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No materials imported today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <CPSEDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => queryClient.invalidateQueries({ queryKey: ["dashboard", "statistics"] })} />
    </div>
  );
}
