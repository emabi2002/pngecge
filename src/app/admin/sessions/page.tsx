'use client';

import { useState, useEffect } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Shield,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Wifi,
  WifiOff,
  User,
  Activity,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface UserSession {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  user_role_color: string;
  ip_address: string;
  user_agent: string;
  device_type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  browser: string;
  os: string;
  location?: {
    city: string;
    country: string;
  };
  started_at: string;
  last_activity_at: string;
  expires_at: string;
  is_active: boolean;
  is_current?: boolean;
}

const DEVICE_ICONS = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
  unknown: Globe,
};

export default function ActiveSessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  // Dialog states
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isTerminateAllDialogOpen, setIsTerminateAllDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [terminateUserId, setTerminateUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    // Simulated data
    const mockSessions: UserSession[] = [
      {
        id: 'session-1',
        user_id: 'user-1',
        user_name: 'John Kewa',
        user_email: 'admin@pngec.gov.pg',
        user_role: 'National Administrator',
        user_role_color: '#ea580c',
        ip_address: '203.122.45.67',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        device_type: 'desktop',
        browser: 'Chrome 120',
        os: 'Windows 10',
        location: { city: 'Port Moresby', country: 'Papua New Guinea' },
        started_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        last_activity_at: new Date(Date.now() - 60000).toISOString(),
        expires_at: new Date(Date.now() + 3600000 * 6).toISOString(),
        is_active: true,
        is_current: true,
      },
      {
        id: 'session-2',
        user_id: 'user-2',
        user_name: 'Mary Tani',
        user_email: 'mary.tani@pngec.gov.pg',
        user_role: 'Provincial Administrator',
        user_role_color: '#ca8a04',
        ip_address: '203.122.45.89',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        device_type: 'desktop',
        browser: 'Safari 17',
        os: 'macOS Sonoma',
        location: { city: 'Port Moresby', country: 'Papua New Guinea' },
        started_at: new Date(Date.now() - 3600000).toISOString(),
        last_activity_at: new Date(Date.now() - 300000).toISOString(),
        expires_at: new Date(Date.now() + 3600000 * 7).toISOString(),
        is_active: true,
      },
      {
        id: 'session-3',
        user_id: 'user-2',
        user_name: 'Mary Tani',
        user_email: 'mary.tani@pngec.gov.pg',
        user_role: 'Provincial Administrator',
        user_role_color: '#ca8a04',
        ip_address: '203.122.45.90',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
        device_type: 'mobile',
        browser: 'Safari Mobile',
        os: 'iOS 17',
        location: { city: 'Port Moresby', country: 'Papua New Guinea' },
        started_at: new Date(Date.now() - 1800000).toISOString(),
        last_activity_at: new Date(Date.now() - 600000).toISOString(),
        expires_at: new Date(Date.now() + 3600000 * 7.5).toISOString(),
        is_active: true,
      },
      {
        id: 'session-4',
        user_id: 'user-5',
        user_name: 'James Nao',
        user_email: 'james.nao@pngec.gov.pg',
        user_role: 'Registration Officer',
        user_role_color: '#2563eb',
        ip_address: '203.122.46.12',
        user_agent: 'Mozilla/5.0 (Linux; Android 13)',
        device_type: 'tablet',
        browser: 'Chrome Mobile',
        os: 'Android 13',
        location: { city: 'Mount Hagen', country: 'Papua New Guinea' },
        started_at: new Date(Date.now() - 7200000).toISOString(),
        last_activity_at: new Date(Date.now() - 1800000).toISOString(),
        expires_at: new Date(Date.now() + 3600000 * 5).toISOString(),
        is_active: true,
      },
      {
        id: 'session-5',
        user_id: 'user-6',
        user_name: 'Peter Wai',
        user_email: 'peter.wai@pngec.gov.pg',
        user_role: 'Registration Officer',
        user_role_color: '#2563eb',
        ip_address: '203.122.47.88',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        device_type: 'desktop',
        browser: 'Edge 120',
        os: 'Windows 11',
        location: { city: 'Goroka', country: 'Papua New Guinea' },
        started_at: new Date(Date.now() - 10800000).toISOString(),
        last_activity_at: new Date(Date.now() - 3600000).toISOString(),
        expires_at: new Date(Date.now() + 3600000 * 4).toISOString(),
        is_active: true,
      },
    ];
    setSessions(mockSessions);
    setLoading(false);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch =
      session.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.ip_address.includes(searchQuery);
    const matchesDevice = deviceFilter === 'all' || session.device_type === deviceFilter;
    return matchesSearch && matchesDevice;
  });

  const activeCount = sessions.filter(s => s.is_active).length;
  const uniqueUsers = new Set(sessions.map(s => s.user_id)).size;
  const deviceCounts = {
    desktop: sessions.filter(s => s.device_type === 'desktop').length,
    mobile: sessions.filter(s => s.device_type === 'mobile').length,
    tablet: sessions.filter(s => s.device_type === 'tablet').length,
  };

  const handleTerminateSession = async () => {
    if (!selectedSession) return;

    setSessions(sessions.filter(s => s.id !== selectedSession.id));
    setIsTerminateDialogOpen(false);
    setSelectedSession(null);

    toast({
      title: 'Session Terminated',
      description: `Session for "${selectedSession.user_name}" has been terminated.`,
    });
  };

  const handleTerminateAllUserSessions = async () => {
    if (!terminateUserId) return;

    const userName = sessions.find(s => s.user_id === terminateUserId)?.user_name;
    setSessions(sessions.filter(s => s.user_id !== terminateUserId));
    setIsTerminateAllDialogOpen(false);
    setTerminateUserId(null);

    toast({
      title: 'All Sessions Terminated',
      description: `All sessions for "${userName}" have been terminated.`,
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const formatDuration = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Sessions</h1>
          <p className="text-slate-500">Monitor and manage user sessions across the system</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSessions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Unique Users</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Desktop / Mobile</p>
                <p className="text-2xl font-bold">{deviceCounts.desktop} / {deviceCounts.mobile + deviceCounts.tablet}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Monitor className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Auto-refresh</p>
                <p className="text-lg font-medium text-slate-600">Every 30s</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Activity className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by user, email, or IP address..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map(session => {
          const DeviceIcon = DEVICE_ICONS[session.device_type];

          return (
            <Card key={session.id} className={session.is_current ? 'border-emerald-300 bg-emerald-50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* User Info */}
                    <Avatar className="h-12 w-12">
                      <AvatarFallback
                        style={{
                          backgroundColor: `${session.user_role_color}20`,
                          color: session.user_role_color
                        }}
                      >
                        {getInitials(session.user_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{session.user_name}</p>
                        {session.is_current && (
                          <Badge className="bg-emerald-100 text-emerald-700">Current Session</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{session.user_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: session.user_role_color }}
                        />
                        <span className="text-xs text-slate-500">{session.user_role}</span>
                      </div>
                    </div>
                  </div>

                  {/* Device & Location Info */}
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <DeviceIcon className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{session.browser}</p>
                        <p className="text-xs text-slate-500">{session.os}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span>{session.ip_address}</span>
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />
                          <span>{session.location.city}, {session.location.country}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        <span className="text-slate-500">Active:</span> {formatDuration(session.started_at)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Last activity: {formatRelativeTime(session.last_activity_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedSession(session);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedSession(session);
                            setIsTerminateDialogOpen(true);
                          }}
                          disabled={session.is_current}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Terminate Session
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setTerminateUserId(session.user_id);
                            setIsTerminateAllDialogOpen(true);
                          }}
                          disabled={session.is_current}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Terminate All User Sessions
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredSessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              No active sessions found matching your criteria.
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Session Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              Detailed information about this session
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                <Avatar className="h-12 w-12">
                  <AvatarFallback
                    style={{
                      backgroundColor: `${selectedSession.user_role_color}20`,
                      color: selectedSession.user_role_color
                    }}
                  >
                    {getInitials(selectedSession.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedSession.user_name}</p>
                  <p className="text-sm text-slate-500">{selectedSession.user_email}</p>
                  <p className="text-xs text-slate-400">{selectedSession.user_role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Device Type</p>
                  <p className="font-medium capitalize">{selectedSession.device_type}</p>
                </div>
                <div>
                  <p className="text-slate-500">Browser</p>
                  <p className="font-medium">{selectedSession.browser}</p>
                </div>
                <div>
                  <p className="text-slate-500">Operating System</p>
                  <p className="font-medium">{selectedSession.os}</p>
                </div>
                <div>
                  <p className="text-slate-500">IP Address</p>
                  <p className="font-medium">{selectedSession.ip_address}</p>
                </div>
                <div>
                  <p className="text-slate-500">Location</p>
                  <p className="font-medium">
                    {selectedSession.location
                      ? `${selectedSession.location.city}, ${selectedSession.location.country}`
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Session Duration</p>
                  <p className="font-medium">{formatDuration(selectedSession.started_at)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Started</p>
                  <p className="font-medium">{new Date(selectedSession.started_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500">Last Activity</p>
                  <p className="font-medium">{formatRelativeTime(selectedSession.last_activity_at)}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-100">
                <p className="text-xs text-slate-500 mb-1">User Agent</p>
                <p className="text-xs font-mono text-slate-600 break-all">{selectedSession.user_agent}</p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedSession && !selectedSession.is_current && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setIsTerminateDialogOpen(true);
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Terminate Session
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Session Dialog */}
      <AlertDialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Terminate Session
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this session for "{selectedSession?.user_name}"?
              They will be immediately logged out and will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleTerminateSession}
            >
              Terminate Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate All User Sessions Dialog */}
      <AlertDialog open={isTerminateAllDialogOpen} onOpenChange={setIsTerminateAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Terminate All Sessions
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate ALL sessions for this user?
              They will be logged out from all devices and locations immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleTerminateAllUserSessions}
            >
              Terminate All Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
