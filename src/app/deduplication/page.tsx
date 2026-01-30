'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Fingerprint,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  UserX,
  Users,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  getDedupMatches,
  reviewDedupMatch,
  type DedupMatch,
} from '@/lib/data-service';

function getMatchTypeBadge(type: string) {
  switch (type) {
    case 'fingerprint':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Fingerprint</Badge>;
    case 'facial':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Facial</Badge>;
    case 'iris':
      return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100">Iris</Badge>;
    case 'multi':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Multi-Modal</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_review':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending Review</Badge>;
    case 'confirmed_match':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Confirmed Match</Badge>;
    case 'false_positive':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">False Positive</Badge>;
    case 'exception':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Exception</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'critical':
      return <Badge className="bg-red-600 text-white hover:bg-red-600">Critical</Badge>;
    case 'high':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">High</Badge>;
    case 'medium':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Medium</Badge>;
    case 'low':
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">Low</Badge>;
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}

export default function DeduplicationPage() {
  const [matches, setMatches] = useState<DedupMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('pending');

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<DedupMatch | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'confirmed_match' | 'false_positive'>('confirmed_match');
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDedupMatches({ limit: 100 });
      setMatches(data);
    } catch (error) {
      console.error('Error loading dedup matches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = matches.filter(m => m.status === 'pending_review').length;
  const confirmedCount = matches.filter(m => m.status === 'confirmed_match').length;
  const falsePositiveCount = matches.filter(m => m.status === 'false_positive').length;

  const filteredMatches = matches.filter((match) => {
    const voter1Name = match.voter1 ? `${match.voter1.first_name} ${match.voter1.last_name}` : '';
    const voter2Name = match.voter2 ? `${match.voter2.first_name} ${match.voter2.last_name}` : '';
    const matchesSearch =
      voter1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter2Name.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedTab === 'all') return matchesSearch;
    if (selectedTab === 'pending') return matchesSearch && match.status === 'pending_review';
    if (selectedTab === 'confirmed') return matchesSearch && match.status === 'confirmed_match';
    if (selectedTab === 'resolved') return matchesSearch && match.status === 'false_positive';
    return matchesSearch;
  });

  const handleReview = async () => {
    if (!selectedMatch || !reviewReason) return;

    setIsSubmitting(true);
    try {
      const updated = await reviewDedupMatch(selectedMatch.id, reviewDecision, reviewReason);
      if (updated) {
        setMatches(matches.map(m => m.id === selectedMatch.id ? updated : m));
        setIsReviewDialogOpen(false);
        setSelectedMatch(null);
        setReviewReason('');
      }
    } catch (error) {
      console.error('Error reviewing match:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewDialog = (match: DedupMatch, decision: 'confirmed_match' | 'false_positive') => {
    setSelectedMatch(match);
    setReviewDecision(decision);
    setReviewReason('');
    setIsReviewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Biometric Deduplication</h2>
          <p className="text-sm text-slate-500">
            Review and resolve potential duplicate voter registrations
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Matches</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{matches.length}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Review</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
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
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Confirmed Duplicates</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{confirmedCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">False Positives</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{falsePositiveCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
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
            placeholder="Search by voter name..."
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

      <Tabs defaultValue="pending" className="w-full" onValueChange={setSelectedTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all" className="text-xs">All ({matches.length})</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="confirmed" className="text-xs">Confirmed ({confirmedCount})</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs">False Positives ({falsePositiveCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <Card className="border-slate-200">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Fingerprint className="h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No dedup matches found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredMatches.map((match) => (
                    <div key={match.id} className="p-4 hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getMatchTypeBadge(match.match_type)}
                            {getStatusBadge(match.status)}
                            {match.priority && getPriorityBadge(match.priority)}
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="rounded-lg border border-slate-200 p-3">
                              <p className="text-xs text-slate-500 mb-1">Voter 1</p>
                              <p className="font-medium text-slate-900">
                                {match.voter1?.first_name} {match.voter1?.last_name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {match.voter1?.voter_id}
                              </p>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-3">
                              <p className="text-xs text-slate-500 mb-1">Voter 2</p>
                              <p className="font-medium text-slate-900">
                                {match.voter2?.first_name} {match.voter2?.last_name}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {match.voter2?.voter_id}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4">
                            <div>
                              <p className="text-xs text-slate-500">Match Score</p>
                              <div className="flex items-center gap-2">
                                <Progress value={match.match_score} className="w-24 h-2" />
                                <span className="text-sm font-medium">{match.match_score}%</span>
                              </div>
                            </div>
                            {match.fingerprint_score && (
                              <div>
                                <p className="text-xs text-slate-500">Fingerprint</p>
                                <span className="text-sm font-medium">{match.fingerprint_score}%</span>
                              </div>
                            )}
                            {match.facial_score && (
                              <div>
                                <p className="text-xs text-slate-500">Facial</p>
                                <span className="text-sm font-medium">{match.facial_score}%</span>
                              </div>
                            )}
                          </div>
                          {match.decision_reason && (
                            <div className="mt-3 p-2 bg-slate-50 rounded text-sm text-slate-600">
                              <strong>Decision:</strong> {match.decision_reason}
                            </div>
                          )}
                        </div>
                        {match.status === 'pending_review' && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => openReviewDialog(match, 'confirmed_match')}
                            >
                              <UserX className="h-4 w-4" />
                              Confirm Duplicate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => openReviewDialog(match, 'false_positive')}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark False Positive
                            </Button>
                          </div>
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
              {reviewDecision === 'confirmed_match' ? 'Confirm Duplicate' : 'Mark as False Positive'}
            </DialogTitle>
            <DialogDescription>
              {reviewDecision === 'confirmed_match'
                ? 'Confirm that these two registrations are the same person.'
                : 'Mark this match as a false positive (different individuals).'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedMatch && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500">Voter 1</p>
                  <p className="font-medium">{selectedMatch.voter1?.first_name} {selectedMatch.voter1?.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Voter 2</p>
                  <p className="font-medium">{selectedMatch.voter2?.first_name} {selectedMatch.voter2?.last_name}</p>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason / Justification *</Label>
              <Textarea
                id="reason"
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
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
              disabled={isSubmitting || !reviewReason}
              className={reviewDecision === 'confirmed_match' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : reviewDecision === 'confirmed_match' ? (
                'Confirm Duplicate'
              ) : (
                'Mark False Positive'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
