import React, { useEffect, useState } from "react";
import { aiEvaluationService } from "@/services/aiEvaluation";
import type { EvaluationDataset, EvaluationRun } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";

export default function AiEvaluation() {
  const [datasets, setDatasets] = useState<EvaluationDataset[]>([]);
  const [runs, setRuns] = useState<Record<string, EvaluationRun[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiEvaluationService.getDatasets().then(async (ds) => {
      setDatasets(ds);
      const runsMap: Record<string, EvaluationRun[]> = {};
      for (const d of ds) {
        const dRuns = await aiEvaluationService.getRuns(d.id);
        runsMap[d.id] = dRuns;
      }
      setRuns(runsMap);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading AI Evaluation...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Evaluation & Tuning"
        description="Run evaluation datasets and track AI model performance metrics."
        actions={<Button>New Dataset</Button>}
      />

      <div className="space-y-4">
        {datasets.map((dataset) => (
          <Card key={dataset.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{dataset.name}</CardTitle>
                {dataset.description && <p className="text-sm text-muted-foreground">{dataset.description}</p>}
              </div>
              <Button onClick={() => aiEvaluationService.runEvaluation(dataset.id).then(() => window.location.reload())}>
                Run Evaluation
              </Button>
            </CardHeader>
            <CardContent>
              <h4 className="font-medium mb-2">Evaluation Runs</h4>
              {runs[dataset.id] && runs[dataset.id].length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Precision</TableHead>
                      <TableHead>Recall</TableHead>
                      <TableHead>False Merge Rate</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs[dataset.id].map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{(run.precision * 100).toFixed(1)}%</TableCell>
                        <TableCell>{(run.recall * 100).toFixed(1)}%</TableCell>
                        <TableCell>{(run.false_merge_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell>{run.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No runs available for this dataset.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
