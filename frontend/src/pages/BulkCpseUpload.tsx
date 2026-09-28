import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, FileUp, UploadCloud } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiErrorMessage } from "@/services/api";
import { api } from "@/services/api";
import { 
  validateBulkCPSE, 
  confirmBulkCPSE, 
  type CPSEBulkValidationResponse, 
  type CPSEBulkImportResponse 
} from "@/services/cpse";

export default function BulkCpseUpload() {
  const navigate = useNavigate();
  const [file, setFile] = React.useState<File | null>(null);
  const [validation, setValidation] = React.useState<CPSEBulkValidationResponse | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);
  const [validatingError, setValidatingError] = React.useState<string | null>(null);
  
  const [result, setResult] = React.useState<CPSEBulkImportResponse | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);

  const downloadTemplate = () => {
    window.location.href = api.defaults.baseURL + "/cpse/bulk/template";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;

    setFile(selected);
    setValidation(null);
    setResult(null);
    setValidatingError(null);
    setIsValidating(true);

    try {
      const data = await validateBulkCPSE(selected);
      setValidation(data);
    } catch (err) {
      setValidatingError(apiErrorMessage(err) || "Failed to validate file.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !validation) return;
    
    // User Requirement: "DO NOT IMPORT... Show the errors and require the user to correct the file."
    if (validation.invalid_count > 0) {
      setImportError("Import blocked. Please correct the file and upload again.");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const data = await confirmBulkCPSE(file);
      setResult(data);
    } catch (err) {
      setImportError(apiErrorMessage(err) || "Failed to import CPSEs.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "CPSE Network", to: "/cpse" }, { label: "Bulk Add CPSEs" }]}
        title="Bulk Add CPSEs"
        subtitle="Upload an Excel or CSV file containing multiple CPSE companies to onboard them simultaneously."
        actions={
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" /> Download Template
          </Button>
        }
      />

      {!result ? (
        <Card className="border-brand-100 bg-white dark:border-navy-700 dark:bg-navy-900">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
                1. Choose CSV / Excel
              </h3>
              <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 dark:border-navy-700 p-8 text-center hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors">
                <UploadCloud className="mb-2 h-10 w-10 text-slate-400" />
                <span className="text-sm font-medium text-brand-600 dark:text-brand-400 text-lg">
                  {file ? "Change File" : "Click to Browse"}
                </span>
                <span className="mt-2 text-xs text-slate-500">Accepted: CSV, XLSX</span>
                <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileChange} />
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-between rounded-md bg-slate-50 dark:bg-navy-800 p-4 border border-slate-200 dark:border-navy-700">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{file.name}</span>
                  <span className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</span>
                </div>
              )}
            </div>

            {isValidating && (
              <div className="flex items-center justify-center py-8 text-brand-600">
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                Validating...
              </div>
            )}

            {validatingError && (
              <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700">
                <div className="flex items-center mb-2 font-semibold">
                  <AlertCircle className="mr-2 h-5 w-5" /> File Error
                </div>
                <p>{validatingError}</p>
              </div>
            )}

            {validation && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  2. Validation
                </h3>
                
                {validation.invalid_count > 0 && (
                  <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700 space-y-2">
                    <p className="font-bold text-lg">Import blocked</p>
                    <p>Total Rows: {validation.total_rows}</p>
                    <p>Valid: {validation.valid_count}</p>
                    <p>Invalid: {validation.invalid_count}</p>
                    {validation.duplicate_count > 0 && <p>Duplicates: {validation.duplicate_count}</p>}
                    <p className="mt-2 text-sm">Please correct the file and upload again.</p>
                  </div>
                )}
                
                {validation.invalid_count === 0 && (
                  <div className="rounded-md border border-success-200 bg-success-50 p-4 text-success-700 space-y-2">
                    <p className="font-bold text-lg flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" /> Ready to Import
                    </p>
                    <p>Total Rows: {validation.total_rows}</p>
                    <p>Valid: {validation.valid_count}</p>
                  </div>
                )}

                <div className="rounded-md border border-slate-200 dark:border-navy-700 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-navy-800">
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>CPSE Code</TableHead>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Cognate Group</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validation.rows.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-slate-500">{row.row_number}</TableCell>
                          <TableCell className="font-medium">{row.cpse_code}</TableCell>
                          <TableCell>{row.raw_data["CPSE Name"] || row.raw_data["cpse name"] || ""}</TableCell>
                          <TableCell>{row.cognate_group_name}</TableCell>
                          <TableCell>
                            {row.is_valid ? (
                              <Badge variant="success">VALID</Badge>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Badge variant="danger">ERROR</Badge>
                                <span className="text-xs text-danger-600">{row.errors.join(", ")}</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {importError && (
                  <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700 font-medium">
                    {importError}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-navy-700">
                  <Button variant="outline" asChild>
                    <Link to="/cpse">Cancel</Link>
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting || validation.invalid_count > 0}
                  >
                    <FileUp className="mr-2 h-4 w-4" /> 
                    {isImporting ? "Importing..." : "Import Valid CPSEs"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success-200 bg-success-50 dark:bg-success-900/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <CheckCircle2 className="h-16 w-16 text-success-600" />
            <div>
              <h2 className="text-2xl font-bold text-success-800 dark:text-success-400 mb-2">
                CPSE Bulk Import Completed
              </h2>
              <div className="text-slate-600 dark:text-slate-300 space-y-1 text-lg">
                <p>Total Rows: <span className="font-semibold text-slate-900 dark:text-slate-100">{result.total_rows}</span></p>
                <p>Created: <span className="font-semibold text-success-600 dark:text-success-400">{result.created}</span></p>
                <p>Duplicates: <span className="font-semibold text-slate-900 dark:text-slate-100">0</span></p>
                <p>Invalid: <span className="font-semibold text-slate-900 dark:text-slate-100">0</span></p>
                <p>Failed: <span className="font-semibold text-danger-600 dark:text-danger-400">{result.failed}</span></p>
              </div>
            </div>
            <Button size="lg" onClick={() => navigate("/cpse")}>
              View CPSE Network
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
