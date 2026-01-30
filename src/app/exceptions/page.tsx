'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Hand,
  Fingerprint,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  ArrowUpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getExceptions,
  reviewException,
  escalateException,
  type Exception,
} from '@/lib/data-service';

function getTypeBadge(type: string) {
  switch (type) {
    case 'missing_fingerprint':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Missing Fingerprint</Badge>;
    case 'worn_fingerprint':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Worn Fingerprint</Badge>;
    case 'disability_accommodation':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Disability</Badge>;
    case 'photo_quality':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Photo Quality</Badge>;
    case 'data_mismatch':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Data Mismatch</Badge>;
    case 'other':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Other</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Open</Badge>;
    case 'under_review':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Under Review</Badge>;
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
    case 'escalated':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Escalated</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string | undefined) {
  switch (priority) {
    case 'high':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High</Badge>;
    case 'medium':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Medium</Badge>;
    case 'low':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Low</Badge>;
    default:
      return null;
  }
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('open');

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewJustification, setReviewJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExceptions({ limit: 100 });
      setExceptions(data);
    } catch (error) {
      console.error('Error loading exceptions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCount = exceptions.filter(e => e.status === 'open').length;
  const reviewCount = exceptions.filter(e => e.status === 'under_review').length;
  const approvedCount = exceptions.filter(e => e.status === 'approved').length;
  const rejectedCount = exceptions.filter(e => e.status === 'rejected' || e.status === 'escalated').length;

  const filteredExceptions = exceptions.filter((exc) => {
    const matchesSearch =
      exc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exc.reason_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'open') return matchesSearch && (exc.status === 'open' || exc.status === 'under_review');
    if (selectedTab === 'approved') return matchesSearch && exc.status === 'approved';
    if (selectedTab === 'rejected') return matchesSearch && (exc.status === 'rejected' || exc.status === 'escalated');
    return matchesSearch;
  });

  const handleReview = async () => {
    if (!selectedException || !reviewJustification) return;

    setIsSubmitting(true);
    try {
      const updated = await reviewException(selectedException.id, reviewDecision, undefined, reviewJustification);
      if (updated) {
        setExceptions(exceptions.map(e => e.id === selectedException.id ? updated : e));
        setIsReviewDialogOpen(false);
        setSelectedException(null);
        setReviewJustification('');
      }
    } catch (error) {
      console.error('Error reviewing exception:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEscalate = async (exception: Exception) => {
    try {
      const updated = await escalateException(exception.id, 'supervisor');
      if (updated) {
        setExceptions(exceptions.map(e => e.id === exception.id ? updated : e));
      }
    } catch (error) {
      console.error('Error escalating exception:', error);
    }
  };

  const openReviewDialog = (exception: Exception, decision: 'approved' | 'rejected') => {
    setSelectedException(exception);
    setReviewDecision(decision);
    setReviewJustification('');
    setIsReviewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Exceptions & Appeals</h2>
          <p className="text-sm text-slate-500">
            Manage registration exceptions and supervisor overrides
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Exceptions</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{exceptions.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <AlertTriangle className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Open / Review</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{openCount + reviewCount}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Approved</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{approvedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Rejected/Escalated</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search by description or reason code..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="open" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all" className="text-xs">All ({exceptions.length})</TabsTrigger>
          <TabsTrigger value="open" className="text-xs">Open ({openCount + reviewCount})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">Rejected ({rejectedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : filteredExceptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No exceptions found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredExceptions.map((exception) => (
                    <div key={exception.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeBadge(exception.exception_type)}
                            {getStatusBadge(exception.status)}
                            {getPriorityBadge(exception.priority)}
                          </div>
                          <p className="font-medium text-slate-900 mb-1">{exception.description}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>Code: {exception.reason_code}</span>
                            {exception.voter?.voter_id && (
                              <span>Voter: {exception.voter.voter_id}</span>
                            )}
                            <span>
                              Created: {new Date(exception.created_at || '').toLocaleDateString()}
                            </span>
                          </div>
                          {exception.override_justification && (
                            <div className="mt-2 p-2 bg-emerald-50 rounded text-sm text-emerald-700">
                              <strong>Override:</strong> {exception.override_justification}
                            </div>
                          )}
                        </div>
                        {(exception.status === 'open' || exception.status === 'under_review') && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openReviewDialog(exception, 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openReviewDialog(exception, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEscalate(exception)}>
                                <ArrowUpCircle className="mr-2 h-4 w-4 text-purple-600" />
                                Escalate to Supervisor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewDecision === 'approved' ? 'Approve Exception' : 'Reject Exception'}
            </DialogTitle>
            <DialogDescription>
              {reviewDecision === 'approved'
                ? 'Approve this exception to allow the voter registration to proceed.'
                : 'Reject this exception and require standard biometrics.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedException && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium">{selectedException.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Type: {selectedException.exception_type} | Code: {selectedException.reason_code}
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                value={reviewJustification}
                onChange={(e) => setReviewJustification(e.target.value)}
                placeholder="Enter the reason for this decision..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={isSubmitting || !reviewJustification}
              className={reviewDecision === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : reviewDecision === 'approved' ? (
                'Approve'
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
