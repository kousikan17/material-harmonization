import { Plus, Trash2, CheckCircle2, AlertCircle, FileUp } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { validateManualUpload, confirmManualUpload } from "@/services/materialUpload";
import { apiErrorMessage } from "@/services/api";
import type { CPSEBrief, ManualMaterialEntry, CsvValidationResponse, CsvImportResponse } from "@/types";

interface ManualEntryFormProps {
  cpse: CPSEBrief;
  onSuccess: () => void;
}

export function ManualEntryForm({ cpse, onSuccess }: ManualEntryFormProps) {
  const [entries, setEntries] = React.useState<Partial<ManualMaterialEntry>[]>([
    { cpse_code: cpse.code, uom: "EACH" }
  ]);
  const [isValidating, setIsValidating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<CsvValidationResponse | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<CsvImportResponse | null>(null);
  const [importError, setImportError] = React.useState<string | null>(null);

  const updateEntry = (index: number, field: keyof ManualMaterialEntry, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
    setValidationResult(null);
    setImportResult(null);
  };

  const addRow = () => {
    setEntries([...entries, { cpse_code: cpse.code, uom: "EACH" }]);
    setValidationResult(null);
    setImportResult(null);
  };

  const removeRow = (index: number) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);
    setEntries(newEntries);
    setValidationResult(null);
    setImportResult(null);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationError(null);
    setValidationResult(null);
    
    // Check required fields before sending
    const invalidLocally = entries.some(e => !e.original_material_code || !e.original_description || !e.uom || !e.material_type);
    if (invalidLocally) {
      setValidationError("Please fill out all required fields (Code, Description, Type, Unit) for all rows.");
      setIsValidating(false);
      return;
    }

    try {
      const data = await validateManualUpload({ 
        entries: entries as ManualMaterialEntry[],
        cpse_id: cpse.id
      });
      setValidationResult(data);
    } catch (err) {
      setValidationError(apiErrorMessage(err) || "Validation failed.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    setIsSubmitting(true);
    setImportError(null);
    setImportResult(null);

    const groupId = crypto.randomUUID();

    try {
      const data = await confirmManualUpload({
        entries: entries as ManualMaterialEntry[],
        cpse_id: cpse.id,
        group_id: groupId
      });
      setImportResult(data);
      onSuccess();
    } catch (err) {
      setImportError(apiErrorMessage(err) || "Import failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = validationResult?.is_importable && !isValidating && !isSubmitting;

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 mb-1">
          Manual Entry: {cpse.code}
        </div>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={cpse.name}>
          {cpse.name}
        </div>
      </div>
      
      <CardContent className="flex flex-col p-4 space-y-6">
        {importResult ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-10">
            <CheckCircle2 className="h-12 w-12 text-success-500" />
            <div>
              <p className="font-semibold text-success-700 dark:text-success-400">Materials Imported Successfully</p>
              <p className="text-sm text-slate-500 mt-1">
                {importResult.created} created, {importResult.updated} updated
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              setEntries([{ cpse_code: cpse.code, uom: "EACH" }]);
              setImportResult(null);
              setValidationResult(null);
            }}>
              Enter More Materials
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-700">
                    <th className="pb-2 font-medium text-slate-500 text-left w-32">Code*</th>
                    <th className="pb-2 font-medium text-slate-500 text-left min-w-[200px]">Description*</th>
                    <th className="pb-2 font-medium text-slate-500 text-left w-32">Type*</th>
                    <th className="pb-2 font-medium text-slate-500 text-left w-24">Unit*</th>
                    <th className="pb-2 font-medium text-slate-500 text-left w-32">Group</th>
                    <th className="pb-2 font-medium text-slate-500 text-left w-32">Manufacturer</th>
                    <th className="pb-2 font-medium text-slate-500 text-left w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                  {entries.map((entry, idx) => (
                    <tr key={idx} className="group">
                      <td className="py-2 pr-2">
                        <Input 
                          placeholder="Code" 
                          value={entry.original_material_code || ""} 
                          onChange={e => updateEntry(idx, "original_material_code", e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input 
                          placeholder="Description" 
                          value={entry.original_description || ""} 
                          onChange={e => updateEntry(idx, "original_description", e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input 
                          placeholder="Type (e.g. Pipe)" 
                          value={entry.material_type || ""} 
                          onChange={e => updateEntry(idx, "material_type", e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Select
                          value={entry.uom || "EACH"}
                          onChange={e => updateEntry(idx, "uom", e.target.value)}
                        >
                          <option value="EACH">EACH</option>
                          <option value="METER">METER</option>
                          <option value="KG">KG</option>
                          <option value="LITER">LITER</option>
                          <option value="SET">SET</option>
                        </Select>
                      </td>
                      <td className="py-2 pr-2">
                        <Input 
                          placeholder="Group" 
                          value={entry.classification || ""} 
                          onChange={e => updateEntry(idx, "classification", e.target.value)}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input 
                          placeholder="Manufacturer" 
                          value={entry.manufacturer || ""} 
                          onChange={e => updateEntry(idx, "manufacturer", e.target.value)}
                        />
                      </td>
                      <td className="py-2">
                        {entries.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => removeRow(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div>
              <Button variant="outline" size="sm" onClick={addRow} className="text-brand-600 border-dashed border-2 bg-transparent hover:bg-brand-50">
                <Plus className="h-4 w-4 mr-2" /> Add Row
              </Button>
            </div>

            {(validationError || importError) && (
              <div className="flex items-start text-sm text-danger-600 bg-danger-50 p-3 rounded border border-danger-200">
                <AlertCircle className="mr-2 h-5 w-5 shrink-0" />
                <span>{validationError || importError}</span>
              </div>
            )}

            {validationResult && (
              <div className={`p-4 rounded border ${validationResult.is_importable ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
                {validationResult.is_importable ? (
                  <div className="flex items-center text-success-700 font-medium">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Validation passed for {validationResult.valid_count} rows. Ready to import.
                  </div>
                ) : (
                  <div className="text-danger-700">
                    <div className="flex items-center font-medium mb-2">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Validation failed for {validationResult.invalid_count} rows.
                    </div>
                    {validationResult.file_errors.length > 0 && <span className="block font-semibold mb-2">{validationResult.file_errors[0]}</span>}
                    {validationResult.invalid_rows && validationResult.invalid_rows.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1 text-sm max-h-32 overflow-y-auto">
                        {validationResult.invalid_rows.map((row, i) => (
                          <li key={i}>Row {row.row_number}: {row.errors.join(", ")}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-navy-700">
              <Button 
                variant="outline" 
                onClick={handleValidate} 
                disabled={isValidating || isSubmitting}
              >
                {isValidating ? "Validating..." : "Validate"}
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!canSubmit}
              >
                <FileUp className="mr-2 h-4 w-4" />
                {isSubmitting ? "Importing..." : "Import Materials"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
