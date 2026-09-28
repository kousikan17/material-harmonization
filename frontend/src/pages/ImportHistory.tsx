import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import * as React from "react";

import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMaterialUploadHistory } from "@/services/materialUpload";

export default function ImportHistory() {
  const historyQuery = useQuery({ 
    queryKey: ["material-upload-history"], 
    queryFn: () => getMaterialUploadHistory()
  });

  const items = historyQuery.data?.items ?? [];
  const isLoading = historyQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Material Master", to: "/materials" }, { label: "Import History" }]}
        title="Import History"
        subtitle="View the history of material batch uploads."
      />
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <History className="h-4 w-4" /> Import Batches
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Import Batch</TableHead>
                  <TableHead>CPSEs</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Failed / Invalid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                      Loading history...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-400 py-6">
                      No import batches yet.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => (
                  <TableRow key={item.batch_id}>
                    <TableCell>
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(item.imported_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] flex flex-wrap gap-1">
                        {(item.cpse_codes || []).map(code => (
                          <Badge key={code} variant="outline" className="text-[10px] px-1.5 py-0">{code}</Badge>
                        ))}
                        {(!item.cpse_codes || item.cpse_codes.length === 0) && (
                          <span className="text-xs text-slate-400">Single</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{item.actor_name}</TableCell>
                    <TableCell className="text-sm font-medium">{item.file_count || 1}</TableCell>
                    <TableCell className="tabular-nums font-medium">{item.total_rows}</TableCell>
                    <TableCell className="tabular-nums text-success-600">{item.created}</TableCell>
                    <TableCell className="tabular-nums text-brand-600">{item.updated}</TableCell>
                    <TableCell className="tabular-nums text-danger-600">
                      {item.failed} / {item.invalid_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
