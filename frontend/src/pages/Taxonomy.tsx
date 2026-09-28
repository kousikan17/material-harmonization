import React, { useEffect, useState } from "react";
import { taxonomyService } from "@/services/taxonomy";
import type { TaxonomyCategory, TaxonomyAttribute } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";

export default function Taxonomy() {
  const [categories, setCategories] = useState<TaxonomyCategory[]>([]);
  const [attributes, setAttributes] = useState<Record<string, TaxonomyAttribute[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taxonomyService.getCategories().then(async (cats) => {
      setCategories(cats);
      const attrsMap: Record<string, TaxonomyAttribute[]> = {};
      for (const cat of cats) {
        const attrs = await taxonomyService.getAttributes(cat.id);
        attrsMap[cat.id] = attrs;
      }
      setAttributes(attrsMap);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading Taxonomy...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taxonomy & Hierarchy"
        description="Manage unified classifications and attribute definitions."
        actions={<Button>Add Category</Button>}
      />

      <div className="space-y-4">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle>{cat.name}</CardTitle>
              {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
            </CardHeader>
            <CardContent>
              <h4 className="font-medium mb-2">Required Attributes</h4>
              {attributes[cat.id] && attributes[cat.id].length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attribute Name</TableHead>
                      <TableHead>Data Type</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributes[cat.id].map((attr) => (
                      <TableRow key={attr.id}>
                        <TableCell>{attr.name}</TableCell>
                        <TableCell>{attr.data_type}</TableCell>
                        <TableCell>{attr.is_required ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No attributes defined for this category.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
