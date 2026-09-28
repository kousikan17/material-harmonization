import React, { useState } from "react";
import { precheckMaterial } from "@/services/materials";
import type { MaterialPrecheckResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";

export default function NewMaterialPrecheck() {
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState("");
  const [uom, setUom] = useState("");
  const [classification, setClassification] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [mpn, setMpn] = useState("");
  
  const [result, setResult] = useState<MaterialPrecheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePrecheck = async () => {
    setLoading(true);
    try {
      const res = await precheckMaterial({
        description,
        specification,
        uom,
        classification,
        manufacturer,
        manufacturer_part_number: mpn
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ERP Material Precheck"
        description="Verify a new material draft before submitting to the national registry."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Draft Material details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Required" />
            </div>
            <div className="space-y-2">
              <Label>Technical Specification</Label>
              <Textarea value={specification} onChange={(e) => setSpecification(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>UOM</Label>
                <Input value={uom} onChange={(e) => setUom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Classification</Label>
                <Input value={classification} onChange={(e) => setClassification(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Manufacturer Part Number</Label>
                <Input value={mpn} onChange={(e) => setMpn(e.target.value)} />
              </div>
            </div>
            <Button onClick={handlePrecheck} disabled={loading || !description}>
              {loading ? "Checking..." : "Run Precheck"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Readiness Score: {result.readiness_score}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={result.readiness_score} />
                {result.missing_critical_fields.length > 0 && (
                  <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                    <p className="font-semibold">Missing Critical Fields:</p>
                    <ul className="list-disc ml-5 mt-2">
                      {result.missing_critical_fields.map(f => <li key={f}>{f}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {result.candidates.length > 0 && (
              <Card className="border-warning">
                <CardHeader>
                  <CardTitle className="text-warning">Potential Duplicates Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.candidates.map(c => (
                      <div key={c.material_id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{c.common_code || "No Common Code"}</h4>
                          <span className="text-sm font-bold">{(c.score * 100).toFixed(1)}% Match</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.description}</p>
                        <div className="mt-2 text-sm text-warning font-medium">
                          AI Assessment: {c.decision}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {result.candidates.length === 0 && (
              <Card className="border-success">
                <CardContent className="p-6">
                  <p className="text-success font-medium text-center">No existing duplicates found. Safe to submit!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
