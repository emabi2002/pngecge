'use client';

import { useState } from 'react';
import {
  FileOutput,
  Download,
  FileText,
  Image,
  Database,
  Shield,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  Loader2,
  Eye,
  CreditCard,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  generateVoterIDCard,
  generateBatchVoterIDCards,
  generateVoterRoll,
  generateAuditReport,
  downloadPDF,
  openPDFInNewTab,
} from '@/lib/pdf-generator';

// Mock voter data for demos
const mockVoterData = [
  {
    voterId: 'PNG-2027-4521896',
    firstName: 'Michael',
    lastName: 'Toroama',
    middleName: 'Joseph',
    dateOfBirth: new Date('1985-03-15'),
    gender: 'male' as const,
    province: 'Eastern Highlands',
    district: 'Goroka',
    llg: 'Goroka Urban LLG',
    ward: 'Asaro 1',
    pollingPlace: 'Asaro Primary School',
    villageLocality: 'Asaro Village',
    registrationTimestamp: new Date('2026-01-24T09:15:00'),
    status: 'approved',
  },
  {
    voterId: 'PNG-2027-4521897',
    firstName: 'Janet',
    lastName: 'Ravu',
    dateOfBirth: new Date('1992-07-22'),
    gender: 'female' as const,
    province: 'NCD',
    district: 'Moresby North-East',
    llg: 'Moresby North-East LLG',
    ward: 'Gerehu Stage 3',
    pollingPlace: 'Gerehu Primary School',
    villageLocality: 'Gerehu',
    registrationTimestamp: new Date('2026-01-24T10:30:00'),
    status: 'approved',
  },
  {
    voterId: 'PNG-2027-4521898',
    firstName: 'Peter',
    lastName: 'Ipatas',
    middleName: 'Andrew',
    dateOfBirth: new Date('1978-11-08'),
    gender: 'male' as const,
    province: 'Enga',
    district: 'Wabag',
    llg: 'Wabag Urban LLG',
    ward: 'Wabag Town',
    pollingPlace: 'Wabag Community Hall',
    villageLocality: 'Wabag Central',
    registrationTimestamp: new Date('2026-01-24T11:45:00'),
    status: 'approved',
  },
  {
    voterId: 'PNG-2027-4521899',
    firstName: 'Mary',
    lastName: 'Kula',
    dateOfBirth: new Date('1990-04-18'),
    gender: 'female' as const,
    province: 'Western Highlands',
    district: 'Hagen Central',
    llg: 'Hagen Urban LLG',
    ward: 'Kagamuga',
    pollingPlace: 'Kagamuga Primary School',
    villageLocality: 'Kagamuga Village',
    registrationTimestamp: new Date('2026-01-23T08:30:00'),
    status: 'approved',
  },
  {
    voterId: 'PNG-2027-4521900',
    firstName: 'David',
    lastName: 'Sana',
    middleName: 'Thomas',
    dateOfBirth: new Date('1982-09-12'),
    gender: 'male' as const,
    province: 'East Sepik',
    district: 'Wewak',
    llg: 'Wewak Urban LLG',
    ward: 'Kairiru',
    pollingPlace: 'Kairiru Community Centre',
    villageLocality: 'Kairiru Island',
    registrationTimestamp: new Date('2026-01-24T14:00:00'),
    status: 'approved',
  },
];

// Mock audit logs for demo
const mockAuditLogs = [
  { id: 'AL-001', timestamp: new Date('2026-01-25T10:45:00'), action: 'VOTER_REGISTERED', entityType: 'voter', entityId: 'PNG-2027-4521896', user: 'OP-EHP-042', description: 'New voter registration created', signatureHash: 'sha256:abc123def456ghi789' },
  { id: 'AL-002', timestamp: new Date('2026-01-25T10:42:00'), action: 'DEDUP_REVIEWED', entityType: 'dedup_match', entityId: 'DM-8234567', user: 'SUP-NCD-003', description: 'Dedup match marked as false positive', signatureHash: 'sha256:xyz789abc123def456' },
  { id: 'AL-003', timestamp: new Date('2026-01-25T10:38:00'), action: 'SYNC_COMPLETED', entityType: 'sync_batch', entityId: 'SB-EHP-20260125-001', user: 'SYSTEM', description: 'Batch sync completed successfully', signatureHash: 'sha256:def456ghi789xyz123' },
  { id: 'AL-004', timestamp: new Date('2026-01-25T10:35:00'), action: 'EXCEPTION_APPROVED', entityType: 'exception', entityId: 'EXC-001234', user: 'SUP-WHP-003', description: 'Worn fingerprint exception approved', signatureHash: 'sha256:ghi789xyz123abc456' },
  { id: 'AL-005', timestamp: new Date('2026-01-25T10:30:00'), action: 'DEVICE_STATUS_CHANGE', entityType: 'device', entityId: 'DEV-ESP-003', user: 'SYSTEM', description: 'Device went offline', signatureHash: 'sha256:jkl012mno345pqr678' },
];

const exportTypes = [
  {
    id: 'photo_roll',
    name: 'Photo Roll',
    description: 'Ward-level voter photos with ID references',
    icon: Image,
    formats: ['PDF', 'ZIP'],
    lastExport: new Date('2026-01-24T16:00:00'),
  },
  {
    id: 'voter_register',
    name: 'Voter Register',
    description: 'Complete voter lists by ward/polling place',
    icon: FileText,
    formats: ['CSV', 'PDF', 'Excel'],
    lastExport: new Date('2026-01-25T08:00:00'),
  },
  {
    id: 'audit_pack',
    name: 'Audit Pack',
    description: 'Registration logs, dedup decisions, device histories',
    icon: Shield,
    formats: ['ZIP', 'JSON'],
    lastExport: new Date('2026-01-23T12:00:00'),
  },
  {
    id: 'id_cards',
    name: 'ID Card Dataset',
    description: 'Printable card layouts with QR codes',
    icon: Database,
    formats: ['PDF', 'Print-Ready'],
    lastExport: new Date('2026-01-25T10:00:00'),
  },
];

const recentExports = [
  { id: 'EXP-001', type: 'Voter Register', scope: 'Eastern Highlands', format: 'CSV', status: 'completed', createdAt: new Date('2026-01-25T10:30:00'), size: '45.2 MB', records: 412847 },
  { id: 'EXP-002', type: 'Photo Roll', scope: 'Goroka District', format: 'PDF', status: 'completed', createdAt: new Date('2026-01-25T09:15:00'), size: '1.2 GB', records: 45231 },
  { id: 'EXP-003', type: 'Audit Pack', scope: 'System-wide', format: 'ZIP', status: 'in_progress', createdAt: new Date('2026-01-25T10:45:00'), progress: 67 },
  { id: 'EXP-004', type: 'ID Cards', scope: 'NCD', format: 'PDF', status: 'queued', createdAt: new Date('2026-01-25T10:50:00') },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completed</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">In Progress</Badge>;
    case 'queued':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Queued</Badge>;
    case 'failed':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function EvidenceExportPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('quick');

  // Generate single voter ID card
  const handleGenerateSingleIDCard = async () => {
    setGenerating('single-id');
    try {
      const doc = generateVoterIDCard(mockVoterData[0]);
      downloadPDF(doc, `voter-id-${mockVoterData[0].voterId}.pdf`);
    } finally {
      setGenerating(null);
    }
  };

  // Generate batch voter ID cards
  const handleGenerateBatchIDCards = async () => {
    setGenerating('batch-id');
    try {
      const doc = generateBatchVoterIDCards(mockVoterData);
      downloadPDF(doc, 'voter-id-cards-batch.pdf');
    } finally {
      setGenerating(null);
    }
  };

  // Preview single voter ID card
  const handlePreviewIDCard = () => {
    const doc = generateVoterIDCard(mockVoterData[0]);
    openPDFInNewTab(doc);
  };

  // Generate voter roll PDF
  const handleGenerateVoterRoll = async () => {
    setGenerating('voter-roll');
    try {
      const doc = generateVoterRoll(mockVoterData, {
        title: 'Asaro Ward Voter Roll',
        province: 'Eastern Highlands',
        district: 'Goroka',
        ward: 'Asaro 1',
        pollingPlace: 'Asaro Primary School',
        generatedBy: 'Admin User',
      });
      downloadPDF(doc, 'voter-roll-asaro-ward.pdf');
    } finally {
      setGenerating(null);
    }
  };

  // Preview voter roll
  const handlePreviewVoterRoll = () => {
    const doc = generateVoterRoll(mockVoterData, {
      title: 'Asaro Ward Voter Roll',
      province: 'Eastern Highlands',
      district: 'Goroka',
      ward: 'Asaro 1',
      pollingPlace: 'Asaro Primary School',
    });
    openPDFInNewTab(doc);
  };

  // Generate audit report
  const handleGenerateAuditReport = async () => {
    setGenerating('audit-report');
    try {
      const doc = generateAuditReport(mockAuditLogs, {
        title: 'System Audit Log Report',
        dateRange: {
          from: new Date('2026-01-01'),
          to: new Date('2026-01-25'),
        },
        category: 'All Categories',
      });
      downloadPDF(doc, 'audit-report.pdf');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Evidence Export</h2>
          <p className="text-sm text-slate-500">
            Generate audit-ready exports for legal and compliance requirements
          </p>
        </div>
      </div>

      {/* Tabs for different export modes */}
      <Tabs defaultValue="quick" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="quick" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Quick Export
          </TabsTrigger>
          <TabsTrigger value="id-cards" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            Voter ID Cards
          </TabsTrigger>
          <TabsTrigger value="voter-roll" className="gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5" />
            Voter Rolls
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Export History
          </TabsTrigger>
        </TabsList>

        {/* Quick Export Tab */}
        <TabsContent value="quick" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {exportTypes.map((type) => (
              <Card key={type.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2">
                      <type.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{type.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">{type.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {type.formats.map((fmt) => (
                          <Badge key={fmt} variant="outline" className="text-xs">{fmt}</Badge>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        Last export: {type.lastExport.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-4 w-full gap-1.5 text-xs">
                    <Download className="h-3 w-3" />
                    Create Export
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Voter ID Cards Tab */}
        <TabsContent value="id-cards" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Single ID Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4" />
                  Single Voter ID Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Generate a credit-card sized voter ID with photo placeholder, biometric data, and QR code.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded bg-slate-200 flex items-center justify-center">
                      <Users className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {mockVoterData[0].firstName} {mockVoterData[0].lastName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">{mockVoterData[0].voterId}</p>
                      <p className="text-xs text-slate-500">{mockVoterData[0].province} - {mockVoterData[0].ward}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={handlePreviewIDCard}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleGenerateSingleIDCard}
                    disabled={generating === 'single-id'}
                  >
                    {generating === 'single-id' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Batch ID Cards */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileSpreadsheet className="h-4 w-4" />
                  Batch ID Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Generate multiple voter ID cards on A4 sheets, print-ready format (8 cards per page).
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {mockVoterData.slice(0, 4).map((voter) => (
                      <div key={voter.voterId} className="flex items-center gap-2 text-xs">
                        <div className="h-6 w-6 rounded bg-slate-200 flex items-center justify-center">
                          <Users className="h-3 w-3 text-slate-400" />
                        </div>
                        <span className="text-slate-600 truncate">{voter.firstName} {voter.lastName}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 text-center">
                    + {mockVoterData.length - 4} more voters
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleGenerateBatchIDCards}
                  disabled={generating === 'batch-id'}
                >
                  {generating === 'batch-id' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Generate Batch PDF ({mockVoterData.length} cards)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voter Rolls Tab */}
        <TabsContent value="voter-roll" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Voter Roll Export */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" />
                  Ward Voter Roll
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Generate an official voter roll PDF with all registered voters for a ward or polling place.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Province</p>
                      <p className="font-medium text-slate-900">Eastern Highlands</p>
                    </div>
                    <div>
                      <p className="text-slate-500">District</p>
                      <p className="font-medium text-slate-900">Goroka</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Ward</p>
                      <p className="font-medium text-slate-900">Asaro 1</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Voters</p>
                      <p className="font-medium text-slate-900">{mockVoterData.length}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={handlePreviewVoterRoll}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleGenerateVoterRoll}
                    disabled={generating === 'voter-roll'}
                  >
                    {generating === 'voter-roll' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit Report Export */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4" />
                  Audit Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">
                  Generate a detailed audit log report with all system actions, changes, and cryptographic signatures.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Date Range</p>
                      <p className="font-medium text-slate-900">Jan 1 - Jan 25, 2026</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Events</p>
                      <p className="font-medium text-slate-900">{mockAuditLogs.length}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500">Categories</p>
                      <p className="font-medium text-slate-900">All Categories</p>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleGenerateAuditReport}
                  disabled={generating === 'audit-report'}
                >
                  {generating === 'audit-report' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Generate Audit Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Recent Exports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentExports.map((exp) => (
                <div
                  key={exp.id}
                  className={cn(
                    'rounded-lg border p-4',
                    exp.status === 'in_progress' && 'border-blue-200 bg-blue-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'rounded-lg p-2',
                        exp.status === 'completed' && 'bg-emerald-100',
                        exp.status === 'in_progress' && 'bg-blue-100',
                        exp.status === 'queued' && 'bg-slate-100'
                      )}>
                        {exp.status === 'completed' && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                        {exp.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-600" />}
                        {exp.status === 'queued' && <Package className="h-4 w-4 text-slate-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{exp.type}</p>
                          <Badge variant="outline" className="text-xs">{exp.format}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{exp.scope}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>{exp.createdAt.toLocaleString()}</span>
                          {exp.size && <span>{exp.size}</span>}
                          {exp.records && <span>{exp.records.toLocaleString()} records</span>}
                        </div>
                        {exp.status === 'in_progress' && exp.progress && (
                          <div className="mt-2">
                            <Progress value={exp.progress} className="h-2 w-48" />
                            <p className="mt-1 text-xs text-slate-500">{exp.progress}% complete</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(exp.status)}
                      {exp.status === 'completed' && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-xs">
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compliance Notice */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield className="h-5 w-5 text-emerald-600" />
          <div>
            <h4 className="font-semibold text-emerald-800">Audit Compliance</h4>
            <p className="mt-1 text-sm text-emerald-700">
              All exports are digitally signed, timestamped, and logged in the audit trail.
              Chain of custody is maintained for all evidence packs. PDF exports include watermarks and security features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
