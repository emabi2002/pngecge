'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Settings,
  Maximize2,
  Grid,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Device } from '@/lib/device-service';

interface DeviceQRCodeProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

interface QRCodeOptions {
  size: number;
  includeAssetTag: boolean;
  includeSerialNumber: boolean;
  includeModel: boolean;
  includeStationId: boolean;
  format: 'label' | 'card' | 'full';
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  size: 200,
  includeAssetTag: true,
  includeSerialNumber: true,
  includeModel: true,
  includeStationId: true,
  format: 'label',
};

export function DeviceQRCode({ device, isOpen, onClose }: DeviceQRCodeProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<QRCodeOptions>(DEFAULT_OPTIONS);
  const [copied, setCopied] = useState(false);

  // Generate QR code data
  const qrData = JSON.stringify({
    device_uid: device.device_uid,
    asset_tag: device.asset_tag,
    serial: device.vendor_serial_number,
    vendor: device.vendor_name,
    model: device.model,
    type: device.device_type,
    station: device.current_station_id,
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Print Error',
        description: 'Please allow popups to print the QR code.',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Device QR Code - ${device.asset_tag || device.vendor_serial_number}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              background: white;
            }
            .header {
              font-size: 12px;
              font-weight: 600;
              color: #059669;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .qr-code {
              margin: 16px 0;
            }
            .asset-tag {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              margin: 8px 0;
            }
            .serial {
              font-size: 10px;
              font-family: monospace;
              color: #64748b;
              margin: 4px 0;
            }
            .model {
              font-size: 11px;
              color: #475569;
              margin: 4px 0;
            }
            .station {
              font-size: 10px;
              color: #64748b;
              margin-top: 8px;
              padding: 4px 8px;
              background: #f1f5f9;
              border-radius: 4px;
              display: inline-block;
            }
            .footer {
              font-size: 8px;
              color: #94a3b8;
              margin-top: 12px;
            }
            @media print {
              body { margin: 0; padding: 10mm; }
              .qr-container { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadSVG = () => {
    const svgElement = printRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `device-qr-${device.asset_tag || device.vendor_serial_number}.svg`;
    a.click();

    URL.revokeObjectURL(url);
    toast({
      title: 'Downloaded',
      description: 'QR code saved as SVG file.',
    });
  };

  const handleCopyData = async () => {
    try {
      await navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copied',
        description: 'QR code data copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Device QR Code
          </DialogTitle>
          <DialogDescription>
            Generate and print QR code labels for device tracking
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Preview */}
          <div className="flex flex-col items-center">
            <div
              ref={printRef}
              className="qr-container border-2 border-slate-200 rounded-lg p-6 bg-white text-center"
            >
              <div className="header text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                PNGEC Device
              </div>

              <div className="qr-code my-4">
                <QRCodeSVG
                  value={qrData}
                  size={options.size}
                  level="M"
                  includeMargin={false}
                  bgColor="white"
                  fgColor="#1e293b"
                />
              </div>

              {options.includeAssetTag && device.asset_tag && (
                <div className="asset-tag text-lg font-bold text-slate-900">
                  {device.asset_tag}
                </div>
              )}

              {options.includeSerialNumber && (
                <div className="serial text-xs font-mono text-slate-500">
                  {device.vendor_serial_number}
                </div>
              )}

              {options.includeModel && (
                <div className="model text-sm text-slate-600">
                  {device.vendor_name} {device.model}
                </div>
              )}

              {options.includeStationId && device.current_station_id && (
                <div className="station text-xs text-slate-500 mt-2 px-2 py-1 bg-slate-100 rounded inline-block">
                  {device.current_station_id}
                </div>
              )}

              <div className="footer text-[10px] text-slate-400 mt-3">
                Papua New Guinea Electoral Commission
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">QR Code Size</Label>
              <Select
                value={options.size.toString()}
                onValueChange={(v) => setOptions({ ...options, size: parseInt(v) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="150">Small (150px)</SelectItem>
                  <SelectItem value="200">Medium (200px)</SelectItem>
                  <SelectItem value="250">Large (250px)</SelectItem>
                  <SelectItem value="300">Extra Large (300px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Label Format</Label>
              <Select
                value={options.format}
                onValueChange={(v) => setOptions({ ...options, format: v as QRCodeOptions['format'] })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="label">Label (Compact)</SelectItem>
                  <SelectItem value="card">Card (Medium)</SelectItem>
                  <SelectItem value="full">Full (Detailed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Include Information</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="asset-tag"
                  checked={options.includeAssetTag}
                  onCheckedChange={(c) => setOptions({ ...options, includeAssetTag: !!c })}
                />
                <label htmlFor="asset-tag" className="text-sm text-slate-600">
                  Asset Tag
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="serial"
                  checked={options.includeSerialNumber}
                  onCheckedChange={(c) => setOptions({ ...options, includeSerialNumber: !!c })}
                />
                <label htmlFor="serial" className="text-sm text-slate-600">
                  Serial Number
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="model"
                  checked={options.includeModel}
                  onCheckedChange={(c) => setOptions({ ...options, includeModel: !!c })}
                />
                <label htmlFor="model" className="text-sm text-slate-600">
                  Vendor & Model
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="station"
                  checked={options.includeStationId}
                  onCheckedChange={(c) => setOptions({ ...options, includeStationId: !!c })}
                />
                <label htmlFor="station" className="text-sm text-slate-600">
                  Station ID
                </label>
              </div>
            </div>

            <Card className="bg-slate-50">
              <CardContent className="p-3">
                <div className="text-xs text-slate-500">
                  <strong>QR Data:</strong>
                  <div className="font-mono mt-1 text-[10px] break-all">
                    {qrData.substring(0, 100)}...
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={handleCopyData}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Data'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadSVG}>
            <Download className="mr-2 h-4 w-4" />
            Download SVG
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Label
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Batch QR Code printing component
interface BatchQRCodeProps {
  devices: Device[];
  isOpen: boolean;
  onClose: () => void;
}

export function BatchQRCode({ devices, isOpen, onClose }: BatchQRCodeProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [labelsPerRow, setLabelsPerRow] = useState(3);
  const [qrSize, setQrSize] = useState(120);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Print Error',
        description: 'Please allow popups to print.',
        variant: 'destructive',
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Device QR Codes - Batch Print</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 10mm;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(${labelsPerRow}, 1fr);
              gap: 8mm;
            }
            .label {
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 8px;
              text-align: center;
              page-break-inside: avoid;
            }
            .header {
              font-size: 8px;
              font-weight: 600;
              color: #059669;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .qr { margin: 8px 0; }
            .asset-tag {
              font-size: 11px;
              font-weight: bold;
              color: #1e293b;
            }
            .serial {
              font-size: 8px;
              font-family: monospace;
              color: #64748b;
            }
            @media print {
              .label { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Batch QR Code Print
          </DialogTitle>
          <DialogDescription>
            Print QR code labels for {devices.length} devices
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Labels per row:</Label>
            <Select value={labelsPerRow.toString()} onValueChange={(v) => setLabelsPerRow(parseInt(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">QR Size:</Label>
            <Select value={qrSize.toString()} onValueChange={(v) => setQrSize(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="80">Small</SelectItem>
                <SelectItem value="120">Medium</SelectItem>
                <SelectItem value="150">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-auto border rounded-lg p-4 bg-white">
          <div
            ref={printRef}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${labelsPerRow}, 1fr)` }}
          >
            {devices.map((device) => (
              <div
                key={device.device_uid}
                className="label border border-slate-200 rounded-lg p-3 text-center"
              >
                <div className="header text-[10px] font-semibold text-emerald-600 uppercase">
                  PNGEC Device
                </div>
                <div className="qr my-2">
                  <QRCodeSVG
                    value={JSON.stringify({
                      device_uid: device.device_uid,
                      asset_tag: device.asset_tag,
                      serial: device.vendor_serial_number,
                    })}
                    size={qrSize}
                    level="M"
                  />
                </div>
                <div className="asset-tag text-sm font-bold">
                  {device.asset_tag || device.vendor_serial_number}
                </div>
                <div className="serial text-[10px] font-mono text-slate-500">
                  {device.vendor_serial_number}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print {devices.length} Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
