import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EvidenceChecklist } from "@/components/EvidenceChecklist";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalysis, triggerAnalysis } from "@/services/ai";
import { getCommonMaterial } from "@/services/commonCodes";
import { getMaterial } from "@/services/materials";

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: material, isLoading } = useQuery({
    queryKey: ["material", id],
    queryFn: () => getMaterial(id!),
    enabled: !!id,
  });

  const { data: analysis } = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis(id!),
    enabled: !!id,
    retry: false,
  });

  const analyzeMutation = useMutation({
    mutationFn: () => triggerAnalysis(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material", id] });
      queryClient.invalidateQueries({ queryKey: ["analysis", id] });
    },
  });

  const commonCode = material?.active_common_material?.common_code;
  const { data: commonDetail } = useQuery({
    queryKey: ["common-material", commonCode],
    queryFn: () => getCommonMaterial(commonCode!),
    enabled: !!commonCode,
  });

  if (isLoading || !material) {
    return <p className="text-sm text-slate-400">Loading material...</p>;
  }

  const common = commonDetail;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-slate-300 dark:border-navy-700 pb-4">
        <div className="space-y-2">
          <Breadcrumbs items={[{ label: "Material Master", to: "/materials" }, { label: material.original_material_code }]} />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{material.original_material_code}</h1>
            <StatusBadge status={material.status} />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{material.original_description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
            <Sparkles className="h-4 w-4" />
            {analyzeMutation.isPending ? "Analyzing..." : "Run AI Analysis"}
          </Button>
          <Button asChild>
            <Link to={`/materials/${id}/analysis`}>View Full AI Details</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
            <CardTitle className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Section A: Original CPSE Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <Field label="CPSE" value={`${material.cpse.name} (${material.cpse.code})`} />
            <Field label="Original Code" value={material.original_material_code} />
            <Field label="Original Description" value={material.original_description} />
            <Field label="Original Technical Specification" value={material.technical_specification} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Original Classification" value={material.classification} />
              <Field label="Original UOM" value={material.uom} />
            </div>
            
            {material.attributes.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Original Attributes</p>
                <div className="flex flex-wrap gap-2">
                  {material.attributes.map((attr) => (
                    <Badge key={attr.id} variant="outline">
                      {attr.attr_key}: {attr.attr_value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-brand-50 border-b border-brand-100">
            <CardTitle className="text-sm uppercase tracking-wide text-brand-700">Section B: AI Standardized Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            {common ? (
              <>
                <Field label="Standardized Description" value={common.standardized_description} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Classification" value={common.classification} />
                  <Field label="Function" value={common.function} />
                  <Field label="Grade" value={common.material_grade} />
                  <Field label="Dimensions" value={common.dimensions} />
                  <Field label="Standard" value={common.standard} />
                  <Field label="UOM" value={common.standardized_uom} />
                </div>
                <div>
                   <p className="text-xs uppercase tracking-wide text-slate-400">Common Code</p>
                   <Link to={`/common-material-master/${common.common_code}`} className="font-bold text-brand-600 hover:underline">
                     {common.common_code}
                   </Link>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-slate-400">
                Not yet mapped to a common material code.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700">
          <CardTitle className="text-sm uppercase tracking-wide text-slate-600 dark:text-slate-400">Section C: AI Analysis</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm">
          {analysis ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Relationship</p>
                  <StatusBadge status={analysis.decision} />
                  {analysis.decision === "TECHNICAL_CONFLICT" && (
                    <div className="mt-2 text-danger-600 flex items-start gap-1 text-xs font-medium">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {analysis.conflict_reason}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{analysis.final_score.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Recommended Common Code</p>
                  <p className="font-bold text-brand-600">{analysis.recommended_common_code || "—"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Evidence</p>
                <EvidenceChecklist
                  items={[
                    { label: "Description similarity", score: analysis.description_score },
                    { label: "Specification compatibility", score: analysis.specification_score },
                    { label: "Classification compatibility", score: analysis.classification_score },
                    { label: "Grade compatibility", score: analysis.grade_score },
                    { label: "Dimension compatibility", score: analysis.dimension_score },
                    { label: "UOM compatibility", score: analysis.uom_score },
                    { label: "Function compatibility", score: analysis.function_score },
                  ]}
                />
              </div>

              {analysis.reason_text && (
                 <div>
                   <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Missing Attributes / Reason</p>
                   <p className="text-slate-700 dark:text-slate-300">{analysis.reason_text}</p>
                 </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400">
              AI Analysis has not been run or is not available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | ReactNode | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-medium text-slate-800 dark:text-slate-200">{value || "—"}</p>
    </div>
  );
}
