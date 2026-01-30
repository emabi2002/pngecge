'use client';

import { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileKey,
  Fingerprint,
  Server,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Cryptographic keys and certificates
const keys = [
  {
    id: 'key-master-sign',
    name: 'Master Signing Key',
    type: 'RSA-4096',
    purpose: 'Root certificate signing',
    status: 'active',
    created: new Date('2024-01-15'),
    expires: new Date('2029-01-15'),
    lastUsed: new Date('2026-01-25T08:00:00'),
    usageCount: 12,
    hsm: true,
  },
  {
    id: 'key-audit-sign',
    name: 'Audit Log Signing Key',
    type: 'ECDSA-P384',
    purpose: 'Audit trail signatures',
    status: 'active',
    created: new Date('2025-06-01'),
    expires: new Date('2027-06-01'),
    lastUsed: new Date('2026-01-25T10:51:00'),
    usageCount: 4827341,
    hsm: true,
  },
  {
    id: 'key-device-enc',
    name: 'Device Encryption Key',
    type: 'AES-256-GCM',
    purpose: 'Device data encryption',
    status: 'active',
    created: new Date('2025-01-01'),
    expires: new Date('2027-01-01'),
    lastUsed: new Date('2026-01-25T10:45:00'),
    usageCount: 18234,
    hsm: true,
  },
  {
    id: 'key-biometric-enc',
    name: 'Biometric Template Key',
    type: 'AES-256-GCM',
    purpose: 'Biometric data encryption',
    status: 'active',
    created: new Date('2025-01-01'),
    expires: new Date('2027-01-01'),
    lastUsed: new Date('2026-01-25T10:48:00'),
    usageCount: 9876543,
    hsm: true,
  },
  {
    id: 'key-api-jwt',
    name: 'API JWT Signing Key',
    type: 'RS256',
    purpose: 'API token signing',
    status: 'active',
    created: new Date('2025-09-01'),
    expires: new Date('2026-09-01'),
    lastUsed: new Date('2026-01-25T10:51:30'),
    usageCount: 156789,
    hsm: false,
  },
  {
    id: 'key-backup-old',
    name: 'Legacy Backup Key',
    type: 'RSA-2048',
    purpose: 'Legacy backup encryption',
    status: 'expiring',
    created: new Date('2023-06-01'),
    expires: new Date('2026-02-28'),
    lastUsed: new Date('2025-12-15'),
    usageCount: 45,
    hsm: false,
  },
];

// SSL Certificates
const certificates = [
  {
    id: 'cert-brs-main',
    name: 'BRS Main Server',
    domain: 'brs.pngec.gov.pg',
    issuer: 'DigiCert',
    status: 'valid',
    issued: new Date('2025-06-01'),
    expires: new Date('2026-06-01'),
    daysRemaining: 127,
  },
  {
    id: 'cert-api',
    name: 'API Gateway',
    domain: 'api.brs.pngec.gov.pg',
    issuer: 'DigiCert',
    status: 'valid',
    issued: new Date('2025-06-01'),
    expires: new Date('2026-06-01'),
    daysRemaining: 127,
  },
  {
    id: 'cert-sync',
    name: 'Sync Gateway',
    domain: 'sync.brs.pngec.gov.pg',
    issuer: 'DigiCert',
    status: 'valid',
    issued: new Date('2025-08-15'),
    expires: new Date('2026-08-15'),
    daysRemaining: 202,
  },
  {
    id: 'cert-device-mtls',
    name: 'Device mTLS Root',
    domain: 'devices.brs.pngec.gov.pg',
    issuer: 'PNGEC Internal CA',
    status: 'valid',
    issued: new Date('2025-01-01'),
    expires: new Date('2030-01-01'),
    daysRemaining: 1436,
  },
];

function getKeyStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>;
    case 'expiring':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Expiring Soon</Badge>;
    case 'expired':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expired</Badge>;
    case 'revoked':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Revoked</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getCertStatusBadge(daysRemaining: number) {
  if (daysRemaining > 90) {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Valid</Badge>;
  }
  if (daysRemaining > 30) {
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Expiring Soon</Badge>;
  }
  if (daysRemaining > 0) {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Critical</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Expired</Badge>;
}

export default function SecurityKeysPage() {
  const [selectedTab, setSelectedTab] = useState('keys');

  const activeKeys = keys.filter((k) => k.status === 'active').length;
  const expiringKeys = keys.filter((k) => k.status === 'expiring').length;
  const hsmKeys = keys.filter((k) => k.hsm).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Security & Cryptographic Keys</h2>
          <p className="text-sm text-slate-500">
            Manage encryption keys, certificates, and security policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export Keys
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <Key className="h-4 w-4" />
            Generate Key
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Keys</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{keys.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Key className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{activeKeys}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Expiring</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{expiringKeys}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">HSM Protected</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{hsmKeys}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Certificates</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{certificates.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning for expiring items */}
      {expiringKeys > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h4 className="font-semibold text-amber-800">Keys Expiring Soon</h4>
              <p className="mt-1 text-sm text-amber-700">
                {expiringKeys} cryptographic key(s) will expire within 60 days. Schedule key rotation
                to ensure uninterrupted operations.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="keys" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="keys" className="text-xs">Cryptographic Keys ({keys.length})</TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs">SSL Certificates ({certificates.length})</TabsTrigger>
          <TabsTrigger value="policies" className="text-xs">Security Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Key Name</th>
                    <th>Type</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>HSM</th>
                    <th>Usage</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="group">
                      <td>
                        <div className="flex items-center gap-2">
                          <FileKey className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{key.name}</p>
                            <p className="font-mono text-xs text-slate-500">{key.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="outline" className="font-mono text-xs">{key.type}</Badge>
                      </td>
                      <td className="text-sm text-slate-600">{key.purpose}</td>
                      <td>{getKeyStatusBadge(key.status)}</td>
                      <td>
                        <div>
                          <p className="text-sm text-slate-900">{key.expires.toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500">
                            {Math.ceil((key.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                          </p>
                        </div>
                      </td>
                      <td>
                        {key.hsm ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">HSM</Badge>
                        ) : (
                          <Badge variant="outline">Software</Badge>
                        )}
                      </td>
                      <td className="font-mono text-xs text-slate-600">
                        {key.usageCount.toLocaleString()}
                      </td>
                      <td>
                        <Button variant="ghost" size="sm" className="h-8 opacity-0 group-hover:opacity-100">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {certificates.map((cert) => (
              <Card key={cert.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-emerald-100 p-2">
                        <Lock className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                        <p className="font-mono text-xs text-slate-500">{cert.domain}</p>
                      </div>
                    </div>
                    {getCertStatusBadge(cert.daysRemaining)}
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issuer:</span>
                      <span className="font-medium">{cert.issuer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issued:</span>
                      <span className="font-medium">{cert.issued.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expires:</span>
                      <span className="font-medium">{cert.expires.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Days Remaining:</span>
                      <span className={cn(
                        'font-semibold',
                        cert.daysRemaining > 90 && 'text-emerald-600',
                        cert.daysRemaining <= 90 && cert.daysRemaining > 30 && 'text-amber-600',
                        cert.daysRemaining <= 30 && 'text-red-600'
                      )}>
                        {cert.daysRemaining} days
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Renew
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Lock className="h-4 w-4" />
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Minimum Length</span>
                  <Badge variant="outline">12 characters</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Require Uppercase</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Require Numbers</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Require Symbols</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Password Expiry</span>
                  <Badge variant="outline">90 days</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">History Check</span>
                  <Badge variant="outline">Last 12</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4" />
                  Session Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Session Timeout</span>
                  <Badge variant="outline">30 minutes</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">MFA Required</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">IP Restriction</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Device Binding</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Concurrent Sessions</span>
                  <Badge variant="outline">1 max</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Fingerprint className="h-4 w-4" />
                  Biometric Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Template Encryption</span>
                  <Badge variant="outline">AES-256</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">At-Rest Encryption</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">In-Transit Encryption</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Template Format</span>
                  <Badge variant="outline">ISO 19794-4</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Server className="h-4 w-4" />
                  Infrastructure Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">TLS Version</span>
                  <Badge variant="outline">1.3 Only</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">HSTS Enabled</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">WAF Active</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">DDoS Protection</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
