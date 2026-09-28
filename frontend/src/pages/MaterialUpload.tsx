import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Download, FileUp, History, UploadCloud } from "lucide-react";
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { apiErrorMessage, api } from "@/services/api";
import { confirmMaterialUpload, downloadUploadTemplate, validateMaterialUpload } from "@/services/materialUpload";
import { getHierarchy } from "@/services/masters";
import { listCPSE } from "@/services/cpse";
import type { CsvValidationResponse, CsvImportResponse } from "@/types";

export default function MaterialUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCentralUser = !user?.cpse;

  // Single Company State
  const [selectedCpseId, setSelectedCpseId] = React.useState<string>("");
  const [singleFile, setSingleFile] = React.useState<File | null>(null);
  const [singleValidation, setSingleValidation] = React.useState<CsvValidationResponse | null>(null);
  const [isSingleValidating, setIsSingleValidating] = React.useState(false);
  const [singleValidatingError, setSingleValidatingError] = React.useState<string | null>(null);
  const [isSingleImporting, setIsSingleImporting] = React.useState(false);
  const [singleImportError, setSingleImportError] = React.useState<string | null>(null);
  const [singleResult, setSingleResult] = React.useState<CsvImportResponse | null>(null);

  // Bulk State
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkValidation, setBulkValidation] = React.useState<CsvValidationResponse | null>(null);
  const [isBulkValidating, setIsBulkValidating] = React.useState(false);
  const [bulkValidatingError, setBulkValidatingError] = React.useState<string | null>(null);
  const [isBulkImporting, setIsBulkImporting] = React.useState(false);
  const [bulkImportError, setBulkImportError] = React.useState<string | null>(null);
  const [bulkResult, setBulkResult] = React.useState<CsvImportResponse | null>(null);

  // Queries
  const { data: hierarchy } = useQuery({ queryKey: ["masters", "hierarchy"], queryFn: getHierarchy });
  const { data: cpses } = useQuery({ queryKey: ["cpse"], queryFn: () => listCPSE() });

  const selectedCpse = React.useMemo(() => cpses?.find(c => c.id === selectedCpseId), [cpses, selectedCpseId]);

  // Set default selection
  React.useEffect(() => {
    if (!isCentralUser && user?.cpse) {
      setSelectedCpseId(user.cpse.id);
    } else if (isCentralUser && cpses && cpses.length > 0 && !selectedCpseId) {
      setSelectedCpseId(cpses[0].id);
    }
  }, [cpses, isCentralUser, user?.cpse, selectedCpseId]);


  const onSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedCpseId) {
      setSingleValidatingError("Please select a CPSE company first.");
      return;
    }
    
    setSingleFile(file);
    setSingleValidation(null);
    setSingleResult(null);
    setSingleValidatingError(null);
    setIsSingleValidating(true);
    
    try {
      const data = await validateMaterialUpload(file, selectedCpseId);
      setSingleValidation(data);
    } catch (err) {
      setSingleValidatingError(apiErrorMessage(err));
    } finally {
      setIsSingleValidating(false);
    }
  };

  const onBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkFile(file);
    setBulkValidation(null);
    setBulkResult(null);
    setBulkValidatingError(null);
    setIsBulkValidating(true);
    
    try {
      const data = await validateMaterialUpload(file);
      setBulkValidation(data);
    } catch (err) {
      setBulkValidatingError(apiErrorMessage(err));
    } finally {
      setIsBulkValidating(false);
    }
  };

  const handleSingleUpload = async () => {
    if (!singleFile || !singleValidation || !singleValidation.is_importable || !selectedCpseId) return;
    setIsSingleImporting(true);
    setSingleImportError(null);
    
    try {
      const result = await confirmMaterialUpload(singleFile, selectedCpseId, crypto.randomUUID());
      setSingleResult(result);
    } catch (err) {
      setSingleImportError(apiErrorMessage(err));
    } finally {
      setIsSingleImporting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile || !bulkValidation || !bulkValidation.is_importable) return;
    setIsBulkImporting(true);
    setBulkImportError(null);
    
    try {
      const result = await confirmMaterialUpload(bulkFile, undefined, crypto.randomUUID());
      setBulkResult(result);
    } catch (err) {
      setBulkImportError(apiErrorMessage(err));
    } finally {
      setIsBulkImporting(false);
    }
  };

  const renderValidationPreview = (validation: CsvValidationResponse, error: string | null, isValidating: boolean) => {
    if (isValidating) {
      return (
        <div className="flex items-center justify-center py-8 text-brand-600">
          <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Validating...
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <div className="flex items-center mb-2 font-semibold">
            <AlertCircle className="mr-2 h-5 w-5" /> File Error
          </div>
          <p>{error}</p>
        </div>
      );
    }

    if (!validation) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Validation Results</h3>
        
        {validation.file_errors && validation.file_errors.length > 0 && (
          <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700 space-y-2">
            <p className="font-bold flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" /> Import Blocked
            </p>
            <ul className="list-disc pl-5 mt-2">
              {validation.file_errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.valid_count === 0 && (!validation.file_errors || validation.file_errors.length === 0) && (
          <div className="rounded-md border border-danger-200 bg-danger-50 p-4 text-danger-700 space-y-2">
            <p className="font-bold text-lg">Validation Complete</p>
            <p>Total Rows: {validation.total_rows}</p>
            <p>Valid Rows: {validation.valid_count}</p>
            <p>Invalid Rows: {validation.invalid_count}</p>
            <p className="text-sm mt-2">No valid materials are available for import.</p>
          </div>
        )}
        
        {validation.valid_count > 0 && validation.invalid_count > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-700 space-y-2">
            <p className="font-bold flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" /> Ready with Validation Errors
            </p>
            <p>Total Rows: {validation.total_rows}</p>
            <p>Valid Rows: {validation.valid_count}</p>
            <p>Invalid Rows: {validation.invalid_count}</p>
          </div>
        )}
        
        {validation.valid_count > 0 && validation.invalid_count === 0 && (
          <div className="rounded-md border border-success-200 bg-success-50 p-4 text-success-700 space-y-2">
            <p className="font-bold flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5" /> Ready to Import
            </p>
            <p>Total Rows: {validation.total_rows}</p>
            <p>Valid Rows: {validation.valid_count}</p>
            <p>Invalid Rows: {validation.invalid_count}</p>
          </div>
        )}

        {validation.distribution && validation.distribution.length > 0 && (
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <h4 className="px-4 py-3 bg-slate-50 font-medium border-b border-slate-200 text-slate-700">Distribution Summary</h4>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Sector</TableHead>
                  <TableHead>Cognate Group</TableHead>
                  <TableHead>CPSE Company</TableHead>
                  <TableHead className="text-right">Materials</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validation.distribution.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-slate-600">{d.sector_name || <span className="text-slate-400 italic">Unknown</span>}</TableCell>
                    <TableCell className="text-slate-600">{d.cognate_group_name || <span className="text-slate-400 italic">Unknown</span>}</TableCell>
                    <TableCell className="font-medium">{d.cpse_name} ({d.cpse_code})</TableCell>
                    <TableCell className="text-right font-semibold">{d.material_count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {validation.invalid_rows?.length > 0 && (
          <div className="rounded-md border border-slate-200 overflow-hidden mt-6">
            <h4 className="px-4 py-3 bg-slate-50 font-medium border-b border-slate-200 text-slate-700">Errors</h4>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Row</TableHead>
                  <TableHead>Company Code</TableHead>
                  <TableHead>Material Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validation.invalid_rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.row_number}</TableCell>
                    <TableCell>{row.cpse_code}</TableCell>
                    <TableCell>{row.original_material_code}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="danger">ERROR</Badge>
                        <span className="text-xs text-danger-600">{row.errors.join(", ")}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  const renderSuccessResult = (result: CsvImportResponse) => {
    return (
      <Card className="border-success-200 bg-success-50 dark:bg-success-900/20">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 text-success-600" />
          <div>
            <h2 className="text-2xl font-bold text-success-800 dark:text-success-400 mb-2">
              Material Import Completed
            </h2>
            <div className="text-slate-600 dark:text-slate-300 space-y-1 text-lg">
              <p>Total Rows: <span className="font-semibold text-slate-900">{result.total_rows}</span></p>
              <p>Created: <span className="font-semibold text-success-600">{result.created}</span></p>
              <p>Updated: <span className="font-semibold text-brand-600">{result.updated}</span></p>
              <p>Skipped: <span className="font-semibold">{result.skipped}</span></p>
              <p>Failed: <span className="font-semibold text-danger-600">{result.failed}</span></p>
            </div>
          </div>
          <Button size="lg" onClick={() => navigate("/materials")}>
            View Material Database
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: "Material Master", to: "/materials" }, { label: "Upload Materials" }]}
        title="Material Database Upload"
        subtitle="Upload CPSE material masters to automatically harmonize them with the national database."
        actions={
          <Button variant="outline" onClick={() => navigate("/materials/upload/history")}>
            <History className="mr-2 h-4 w-4" /> View Import History
          </Button>
        }
      />

      <Tabs defaultValue="single" className="w-full space-y-4">
        {isCentralUser && (
          <TabsList className="bg-slate-100 dark:bg-navy-800">
            <TabsTrigger value="single">Single Company</TabsTrigger>
            <TabsTrigger value="bulk">Multi-Company / Bulk</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="single" className="space-y-4">
          {!singleResult ? (
            <Card className="border-brand-100 bg-white">
              <CardContent className="p-6 space-y-6">
                {isCentralUser && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">1</span>
                      Company Selection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label>CPSE Company *</Label>
                        <select
                          value={selectedCpseId}
                          onChange={(e) => setSelectedCpseId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                          <option value="">Select CPSE Company...</option>
                          {cpses?.map(cpse => (
                            <option key={cpse.id} value={cpse.id}>{cpse.name} ({cpse.code})</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Sector</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 cursor-not-allowed">
                          {selectedCpse?.sector_name || "Auto-filled 🔒"}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Cognate Group</Label>
                        <div className="flex h-10 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 cursor-not-allowed">
                          {selectedCpse?.cognate_group_name || "Auto-filled 🔒"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 border-t border-slate-200 pt-6 mt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">{isCentralUser ? "2" : "1"}</span>
                      Upload File
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => downloadUploadTemplate("single")}>
                      <Download className="mr-2 h-4 w-4" /> Download Template
                    </Button>
                  </div>
                  <label className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors ${selectedCpseId ? 'border-slate-300 hover:bg-slate-50' : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'}`}>
                    <UploadCloud className="mb-2 h-10 w-10 text-slate-400" />
                    <span className="text-sm font-medium text-brand-600 text-lg">
                      {singleFile ? "Change File" : "Click to Browse"}
                    </span>
                    <span className="mt-2 text-xs text-slate-500">Accepted: CSV, XLSX</span>
                    <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onSingleFileChange} disabled={!selectedCpseId} />
                  </label>
                  {singleFile && (
                    <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
                      <span className="font-medium text-slate-700">{singleFile.name}</span>
                      <span className="text-sm text-slate-500">{(singleFile.size / 1024).toFixed(2)} KB</span>
                    </div>
                  )}
                </div>

                {renderValidationPreview(singleValidation!, singleValidatingError, isSingleValidating)}
                {singleImportError && (
                  <div className="rounded-md border border-danger-200 bg-danger-50 p-4">
                    <h4 className="font-semibold text-danger-800 mb-1">Import Failed</h4>
                    {singleImportError === "Network Error" || singleImportError.includes("Network Error") || singleImportError === "Something went wrong" ? (
                      <>
                        <p className="text-sm text-danger-700 font-medium">Unable to reach the import service or an unexpected error occurred.</p>
                        <p className="text-xs text-danger-600 mt-1">Please check that the backend server is running.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-danger-700 font-medium">The server could not complete the import.</p>
                        <p className="text-xs text-danger-600 mt-1">Reason:<br/>{singleImportError}</p>
                      </>
                    )}
                  </div>
                )}

                {singleValidation?.is_importable && singleValidation.valid_count > 0 && (
                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                    <Button onClick={handleSingleUpload} disabled={isSingleImporting}>
                      <FileUp className="mr-2 h-4 w-4" />
                      {isSingleImporting ? "Importing..." : `Import ${singleValidation.valid_count} Materials`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            renderSuccessResult(singleResult)
          )}
        </TabsContent>

        {isCentralUser && (
          <TabsContent value="bulk" className="space-y-4">
            {!bulkResult ? (
              <Card className="border-brand-100 bg-white">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs text-white">1</span>
                        Upload Bulk File
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => downloadUploadTemplate()}>
                        <Download className="mr-2 h-4 w-4" /> Download Template
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      The bulk upload template MUST include the <code>cpse_code</code> column. The system will automatically link the materials to the correct Sector and Cognate Group based on the company.
                    </p>
                    
                    <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 p-8 text-center hover:bg-slate-50 transition-colors">
                      <UploadCloud className="mb-2 h-10 w-10 text-slate-400" />
                      <span className="text-sm font-medium text-brand-600 text-lg">
                        {bulkFile ? "Change File" : "Click to Browse"}
                      </span>
                      <span className="mt-2 text-xs text-slate-500">Accepted: CSV, XLSX</span>
                      <input type="file" accept=".csv,.xlsx" className="hidden" onChange={onBulkFileChange} />
                    </label>
                    {bulkFile && (
                      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
                        <span className="font-medium text-slate-700">{bulkFile.name}</span>
                        <span className="text-sm text-slate-500">{(bulkFile.size / 1024).toFixed(2)} KB</span>
                      </div>
                    )}
                  </div>

                  {renderValidationPreview(bulkValidation!, bulkValidatingError, isBulkValidating)}
                  {bulkImportError && (
                    <div className="rounded-md border border-danger-200 bg-danger-50 p-4">
                      <h4 className="font-semibold text-danger-800 mb-1">Import Failed</h4>
                      {bulkImportError === "Network Error" || bulkImportError.includes("Network Error") || bulkImportError === "Something went wrong" ? (
                        <>
                          <p className="text-sm text-danger-700 font-medium">Unable to reach the import service or an unexpected error occurred.</p>
                          <p className="text-xs text-danger-600 mt-1">Please check that the backend server is running.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-danger-700 font-medium">The server could not complete the import.</p>
                          <p className="text-xs text-danger-600 mt-1">Reason:<br/>{bulkImportError}</p>
                        </>
                      )}
                    </div>
                  )}

                  {bulkValidation?.is_importable && bulkValidation.valid_count > 0 && (
                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                      <Button onClick={handleBulkUpload} disabled={isBulkImporting}>
                        <FileUp className="mr-2 h-4 w-4" />
                        {isBulkImporting ? "Importing..." : `Import ${bulkValidation.valid_count} Bulk Materials`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              renderSuccessResult(bulkResult)
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
