'use client';

import { useState, useCallback } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Loader2,
  Eye,
  ArrowRight,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface ImportedDevice {
  row: number;
  vendor_serial_number: string;
  vendor_name: string;
  model: string;
  device_type: string;
  connectivity?: string;
  asset_tag?: string;
  firmware_version?: string;
  purchase_batch_id?: string;
  warranty_expiry?: string;
  notes?: string;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'warning' | 'error';
}

interface DeviceImportProps {
  onImport: (devices: ImportedDevice[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  isOpen: boolean;
  onClose: () => void;
}

const REQUIRED_COLUMNS = ['vendor_serial_number', 'vendor_name', 'model', 'device_type'];
const OPTIONAL_COLUMNS = ['connectivity', 'asset_tag', 'firmware_version', 'purchase_batch_id', 'warranty_expiry', 'notes'];
const VALID_DEVICE_TYPES = ['fingerprint', 'face', 'iris', 'multi', 'card_reader', 'signature_pad'];
const VALID_CONNECTIVITY = ['usb', 'wireless', 'bluetooth', 'ethernet', 'both'];

const SAMPLE_CSV = `vendor_serial_number,vendor_name,model,device_type,connectivity,asset_tag,firmware_version,purchase_batch_id,warranty_expiry,notes
FP-2024-001234,Suprema,BioMini Plus 2,fingerprint,usb,PNGEC-FP-0001,2.1.4,BATCH-2024-001,2026-01-15,New device from January batch
FP-2024-001235,Suprema,BioMini Plus 2,fingerprint,usb,PNGEC-FP-0002,2.1.4,BATCH-2024-001,2026-01-15,
FC-2024-000512,Suprema,FaceStation 2,face,ethernet,PNGEC-FC-0001,1.5.2,BATCH-2024-002,2026-06-01,Face recognition terminal`;

export function DeviceImport({ onImport, isOpen, onClose }: DeviceImportProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [devices, setDevices] = useState<ImportedDevice[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const validateDevice = (data: Record<string, string>, rowIndex: number): ImportedDevice => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!data.vendor_serial_number?.trim()) {
      errors.push('Serial number is required');
    }
    if (!data.vendor_name?.trim()) {
      errors.push('Vendor name is required');
    }
    if (!data.model?.trim()) {
      errors.push('Model is required');
    }
    if (!data.device_type?.trim()) {
      errors.push('Device type is required');
    } else if (!VALID_DEVICE_TYPES.includes(data.device_type.toLowerCase())) {
      errors.push(`Invalid device type. Must be one of: ${VALID_DEVICE_TYPES.join(', ')}`);
    }

    // Check optional fields
    if (data.connectivity && !VALID_CONNECTIVITY.includes(data.connectivity.toLowerCase())) {
      warnings.push(`Invalid connectivity type. Defaulting to 'usb'`);
    }

    if (data.warranty_expiry && Number.isNaN(Date.parse(data.warranty_expiry))) {
      warnings.push('Invalid warranty expiry date format');
    }

    // Check for potential duplicates (based on serial number pattern)
    if (data.vendor_serial_number && !/^[A-Za-z0-9\-_]+$/.test(data.vendor_serial_number)) {
      warnings.push('Serial number contains special characters');
    }

    return {
      row: rowIndex + 1,
      vendor_serial_number: data.vendor_serial_number?.trim() || '',
      vendor_name: data.vendor_name?.trim() || '',
      model: data.model?.trim() || '',
      device_type: data.device_type?.toLowerCase().trim() || '',
      connectivity: VALID_CONNECTIVITY.includes(data.connectivity?.toLowerCase())
        ? data.connectivity.toLowerCase()
        : 'usb',
      asset_tag: data.asset_tag?.trim(),
      firmware_version: data.firmware_version?.trim(),
      purchase_batch_id: data.purchase_batch_id?.trim(),
      warranty_expiry: data.warranty_expiry?.trim(),
      notes: data.notes?.trim(),
      errors,
      warnings,
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid',
    };
  };

  const parseCSV = (content: string): ImportedDevice[] => {
    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
    });

    return result.data.map((row, index) => validateDevice(row as Record<string, string>, index));
  };

  const parseExcel = (data: ArrayBuffer): ImportedDevice[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { raw: false });

    return jsonData.map((row, index) => {
      // Normalize column names
      const normalizedRow: Record<string, string> = {};
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
        normalizedRow[normalizedKey] = row[key];
      });
      return validateDevice(normalizedRow, index);
    });
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);

    try {
      let parsedDevices: ImportedDevice[] = [];

      if (selectedFile.name.endsWith('.csv')) {
        const content = await selectedFile.text();
        parsedDevices = parseCSV(content);
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const data = await selectedFile.arrayBuffer();
        parsedDevices = parseExcel(data);
      } else {
        toast({
          title: 'Invalid File',
          description: 'Please upload a CSV or Excel file.',
          variant: 'destructive',
        });
        return;
      }

      if (parsedDevices.length === 0) {
        toast({
          title: 'Empty File',
          description: 'The file contains no valid data rows.',
          variant: 'destructive',
        });
        return;
      }

      setDevices(parsedDevices);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Parse Error',
        description: 'Failed to parse the file. Please check the format.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'device_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const validDevices = devices.filter((d) => d.status !== 'error');

    if (validDevices.length === 0) {
      toast({
        title: 'No Valid Devices',
        description: 'Please fix the errors before importing.',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const results = await onImport(validDevices);

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResults(results);
      setStep('results');

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${results.success} devices. ${results.failed} failed.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import.',
        variant: 'destructive',
      });
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setDevices([]);
    setImportProgress(0);
    setImportResults(null);
  };

  const validCount = devices.filter((d) => d.status === 'valid').length;
  const warningCount = devices.filter((d) => d.status === 'warning').length;
  const errorCount = devices.filter((d) => d.status === 'error').length;

  return (
    <Dialog open={isOpen} onOpenChange={() => { resetImport(); onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Device Import
          </DialogTitle>
          <DialogDescription>
            Import multiple devices from a CSV or Excel file
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {['upload', 'preview', 'importing', 'results'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-emerald-600 text-white'
                    : ['upload', 'preview', 'importing', 'results'].indexOf(step) > i
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && <ArrowRight className="h-4 w-4 mx-2 text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  Supports CSV and Excel files (.csv, .xlsx, .xls)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <Button variant="outline">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Required Columns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {REQUIRED_COLUMNS.map((col) => (
                      <Badge key={col} className="bg-red-100 text-red-700">
                        {col} *
                      </Badge>
                    ))}
                    {OPTIONAL_COLUMNS.map((col) => (
                      <Badge key={col} variant="outline">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={downloadSampleCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download Sample Template
              </Button>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-500" />
                  <span className="font-medium">{file?.name}</span>
                  <span className="text-sm text-slate-500">({devices.length} rows)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {validCount} Valid
                  </Badge>
                  {warningCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {warningCount} Warnings
                    </Badge>
                  )}
                  {errorCount > 0 && (
                    <Badge className="bg-red-100 text-red-700">
                      <XCircle className="mr-1 h-3 w-3" />
                      {errorCount} Errors
                    </Badge>
                  )}
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-12">Row</TableHead>
                      <TableHead className="w-16">Status</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((device) => (
                      <TableRow
                        key={device.row}
                        className={
                          device.status === 'error'
                            ? 'bg-red-50'
                            : device.status === 'warning'
                            ? 'bg-amber-50'
                            : ''
                        }
                      >
                        <TableCell className="font-mono text-xs">{device.row}</TableCell>
                        <TableCell>
                          {device.status === 'valid' && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {device.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                          {device.status === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{device.vendor_serial_number}</TableCell>
                        <TableCell>{device.vendor_name}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell>{device.device_type}</TableCell>
                        <TableCell>{device.asset_tag || '-'}</TableCell>
                        <TableCell className="text-xs">
                          {device.errors.length > 0 && (
                            <span className="text-red-600">{device.errors.join('; ')}</span>
                          )}
                          {device.warnings.length > 0 && (
                            <span className="text-amber-600">{device.warnings.join('; ')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
              <p className="text-lg font-medium text-slate-700 mb-2">Importing Devices...</p>
              <p className="text-sm text-slate-500 mb-4">
                Processing {validCount + warningCount} devices
              </p>
              <div className="w-64">
                <Progress value={importProgress} className="h-2" />
                <p className="text-center text-xs text-slate-400 mt-1">{importProgress}%</p>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 'results' && importResults && (
            <div className="space-y-4">
              <div className="text-center py-8">
                {importResults.failed === 0 ? (
                  <>
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-xl font-semibold text-slate-900">Import Successful!</h3>
                    <p className="text-slate-600 mt-2">
                      All {importResults.success} devices have been imported successfully.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                    <h3 className="text-xl font-semibold text-slate-900">Import Completed with Issues</h3>
                    <p className="text-slate-600 mt-2">
                      {importResults.success} devices imported, {importResults.failed} failed.
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-700">{importResults.success}</p>
                    <p className="text-sm text-green-600">Imported Successfully</p>
                  </CardContent>
                </Card>
                <Card className={importResults.failed > 0 ? 'border-red-200 bg-red-50' : ''}>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-red-700">{importResults.failed}</p>
                    <p className="text-sm text-red-600">Failed to Import</p>
                  </CardContent>
                </Card>
              </div>

              {importResults.errors.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-700">Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <ul className="text-sm text-red-600 space-y-1">
                        {importResults.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={resetImport}>
                <Trash2 className="mr-2 h-4 w-4" />
                Start Over
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleImport}
                disabled={validCount + warningCount === 0}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import {validCount + warningCount} Devices
              </Button>
            </>
          )}

          {step === 'results' && (
            <>
              <Button variant="outline" onClick={resetImport}>
                Import More
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
