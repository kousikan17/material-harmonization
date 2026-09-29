import React, { useEffect, useState } from "react";
import { dataReadinessService } from "@/services/dataReadiness";
import type { DataReadinessDashboard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";

export default function DataReadiness() {
  const [data, setData] = useState<DataReadinessDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataReadinessService
      .getDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading Data Readiness...</div>;
  if (!data) return <div>Unable to load data readiness data. Please try again.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Readiness Dashboard"
        description="Monitor the quality and completeness of CPSE material data."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_materials.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Readiness Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.average_readiness_score}%</div>
            <Progress value={data.average_readiness_score} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Readiness Tiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>High (80-100)</span>
                <span className="font-bold">{data.materials_by_readiness_tier.high.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Medium (50-79)</span>
                <span className="font-bold">{data.materials_by_readiness_tier.medium.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Low (0-49)</span>
                <span className="font-bold">{data.materials_by_readiness_tier.low.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Missing Critical Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Missing Material Code</span>
                <span className="font-bold">{data.missing_fields.original_material_code.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing Description</span>
                <span className="font-bold">{data.missing_fields.original_description.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing Classification</span>
                <span className="font-bold">{data.missing_fields.classification.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing Technical Spec</span>
                <span className="font-bold">{data.missing_fields.technical_specification.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing UOM</span>
                <span className="font-bold">{data.missing_fields.uom.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Missing MPN</span>
                <span className="font-bold">{data.missing_fields.manufacturer_part_number.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
