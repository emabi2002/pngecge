'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  MessageSquare,
  ArrowRight,
  Truck,
  Package,
  Settings,
  RotateCcw,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  type Device,
  type WorkOrder,
  type WorkOrderNote,
  type WorkOrderStatus,
  type WorkOrderPriority,
  type MaintenanceType,
  getWorkOrders,
  getWorkOrderStats,
  createWorkOrder,
  updateWorkOrderStatus,
  addWorkOrderNote,
  completeWorkOrder,
} from '@/lib/device-service';

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Wrench },
  AWAITING_PARTS: { label: 'Awaiting Parts', color: 'bg-purple-100 text-purple-700', icon: Package },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500', icon: XCircle },
};

const PRIORITY_CONFIG: Record<WorkOrderPriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', color: 'bg-amber-100 text-amber-700' },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};

const TYPE_CONFIG: Record<MaintenanceType, { label: string; icon: typeof Wrench }> = {
  PREVENTIVE: { label: 'Preventive', icon: Calendar },
  CORRECTIVE: { label: 'Corrective', icon: Wrench },
  CALIBRATION: { label: 'Calibration', icon: Settings },
  FIRMWARE_UPDATE: { label: 'Firmware Update', icon: RotateCcw },
  CLEANING: { label: 'Cleaning', icon: Package },
  REPAIR: { label: 'Repair', icon: Wrench },
};

interface DeviceMaintenanceProps {
  device?: Device;
  isOpen: boolean;
  onClose: () => void;
}

export function DeviceMaintenancePanel() {
  const { toast } = useToast();

  // Data state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);

  // Dialog state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newNote, setNewNote] = useState('');

  // Fetch work orders from Supabase
  const fetchWorkOrders = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const data = await getWorkOrders();
      setWorkOrders(data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load work orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const filteredWorkOrders = workOrders.filter((wo) =>
    statusFilter === 'all' || wo.status === statusFilter
  );

  const openCount = workOrders.filter((wo) => wo.status === 'OPEN').length;
  const inProgressCount = workOrders.filter((wo) => wo.status === 'IN_PROGRESS').length;
  const awaitingPartsCount = workOrders.filter((wo) => wo.status === 'AWAITING_PARTS').length;

  const handleStatusChange = async (workOrderId: string, deviceUid: string, newStatus: WorkOrderStatus) => {
    try {
      setUpdatingStatus(workOrderId);

      await updateWorkOrderStatus(workOrderId, deviceUid, newStatus);

      // Update local state
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.work_order_id === workOrderId
            ? {
                ...wo,
                status: newStatus,
                started_at: newStatus === 'IN_PROGRESS' && !wo.started_at ? new Date().toISOString() : wo.started_at,
                completed_at: newStatus === 'COMPLETED' ? new Date().toISOString() : wo.completed_at,
              }
            : wo
        )
      );

      // Update selected work order if open
      if (selectedWorkOrder?.work_order_id === workOrderId) {
        setSelectedWorkOrder((prev) => prev ? {
          ...prev,
          status: newStatus,
          started_at: newStatus === 'IN_PROGRESS' && !prev.started_at ? new Date().toISOString() : prev.started_at,
          completed_at: newStatus === 'COMPLETED' ? new Date().toISOString() : prev.completed_at,
        } : null);
      }

      toast({
        title: 'Status Updated',
        description: `Work order status changed to ${STATUS_CONFIG[newStatus].label}`,
      });

      // Refresh to get updated device status
      fetchWorkOrders(true);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddNote = async (workOrderId: string, deviceUid: string) => {
    if (!newNote.trim()) return;

    try {
      setAddingNote(true);

      const note = await addWorkOrderNote(workOrderId, deviceUid, newNote, 'Current User');

      // Update local state
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.work_order_id === workOrderId
            ? { ...wo, notes: [...wo.notes, note] }
            : wo
        )
      );

      if (selectedWorkOrder?.work_order_id === workOrderId) {
        setSelectedWorkOrder({
          ...selectedWorkOrder,
          notes: [...selectedWorkOrder.notes, note],
        });
      }

      setNewNote('');
      toast({ title: 'Note Added' });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAddingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-12"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-500">Loading work orders...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Work Orders</p>
                <p className="text-2xl font-bold">{workOrders.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={openCount > 0 ? 'border-blue-200 bg-blue-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Open</p>
                <p className="text-2xl font-bold text-blue-700">{openCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={inProgressCount > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">In Progress</p>
                <p className="text-2xl font-bold text-amber-700">{inProgressCount}</p>
              </div>
              <Wrench className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Awaiting Parts</p>
                <p className="text-2xl font-bold">{awaitingPartsCount}</p>
              </div>
              <Package className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWorkOrders(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Work Order
        </Button>
      </div>

      {/* Work Orders List */}
      <Card>
        <CardContent className="p-0">
          {filteredWorkOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Wrench className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-lg font-medium">No work orders</p>
              <p className="text-sm">
                {workOrders.length === 0
                  ? 'No devices are currently in maintenance.'
                  : 'No work orders match your filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredWorkOrders.map((wo) => {
                const statusConfig = STATUS_CONFIG[wo.status];
                const priorityConfig = PRIORITY_CONFIG[wo.priority];
                const typeConfig = TYPE_CONFIG[wo.type];
                const StatusIcon = statusConfig.icon;
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={wo.work_order_id}
                    className="p-4 hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setSelectedWorkOrder(wo);
                      setIsDetailOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-slate-500">{wo.work_order_id}</span>
                          <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-slate-900">{wo.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <TypeIcon className="h-4 w-4" />
                            {typeConfig.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(wo.created_at)}
                          </span>
                          {wo.assigned_to_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {wo.assigned_to_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{wo.device_asset_tag || wo.device_serial}</p>
                        <p className="text-xs text-slate-500">{wo.device_model}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedWorkOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-mono">{selectedWorkOrder.work_order_id}</DialogTitle>
                  <div className="flex gap-2">
                    <Badge className={PRIORITY_CONFIG[selectedWorkOrder.priority].color}>
                      {PRIORITY_CONFIG[selectedWorkOrder.priority].label}
                    </Badge>
                    <Badge className={STATUS_CONFIG[selectedWorkOrder.status].color}>
                      {STATUS_CONFIG[selectedWorkOrder.status].label}
                    </Badge>
                  </div>
                </div>
                <DialogDescription>{selectedWorkOrder.title}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Device Info */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Device</p>
                        <p className="font-medium">{selectedWorkOrder.device_asset_tag || selectedWorkOrder.device_serial}</p>
                        <p className="text-sm text-slate-500">{selectedWorkOrder.device_model}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Type</p>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const TypeIcon = TYPE_CONFIG[selectedWorkOrder.type].icon;
                            return <TypeIcon className="h-4 w-4" />;
                          })()}
                          <span>{TYPE_CONFIG[selectedWorkOrder.type].label}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <div>
                  <Label className="text-sm text-slate-500">Description</Label>
                  <p className="mt-1">{selectedWorkOrder.description}</p>
                </div>

                {selectedWorkOrder.reported_issue && (
                  <div>
                    <Label className="text-sm text-slate-500">Reported Issue</Label>
                    <p className="mt-1">{selectedWorkOrder.reported_issue}</p>
                  </div>
                )}

                {selectedWorkOrder.diagnosis && (
                  <div>
                    <Label className="text-sm text-slate-500">Diagnosis</Label>
                    <p className="mt-1">{selectedWorkOrder.diagnosis}</p>
                  </div>
                )}

                {selectedWorkOrder.resolution && (
                  <div>
                    <Label className="text-sm text-slate-500">Resolution</Label>
                    <p className="mt-1">{selectedWorkOrder.resolution}</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-slate-500">Created</Label>
                    <p>{formatDateTime(selectedWorkOrder.created_at)}</p>
                    <p className="text-xs text-slate-400">by {selectedWorkOrder.created_by_name}</p>
                  </div>
                  {selectedWorkOrder.started_at && (
                    <div>
                      <Label className="text-xs text-slate-500">Started</Label>
                      <p>{formatDateTime(selectedWorkOrder.started_at)}</p>
                    </div>
                  )}
                  {selectedWorkOrder.completed_at && (
                    <div>
                      <Label className="text-xs text-slate-500">Completed</Label>
                      <p>{formatDateTime(selectedWorkOrder.completed_at)}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-sm text-slate-500 mb-2 block">Notes ({selectedWorkOrder.notes.length})</Label>
                  <ScrollArea className="h-40 border rounded-lg p-3">
                    {selectedWorkOrder.notes.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No notes yet</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedWorkOrder.notes.map((note) => (
                          <div key={note.note_id} className="flex gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {note.created_by.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{note.created_by}</span>
                                <span className="text-xs text-slate-400">{formatDateTime(note.created_at)}</span>
                              </div>
                              <p className="text-sm">{note.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Add Note */}
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddNote(selectedWorkOrder.work_order_id, selectedWorkOrder.device_uid);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleAddNote(selectedWorkOrder.work_order_id, selectedWorkOrder.device_uid)}
                      disabled={!newNote.trim() || addingNote}
                    >
                      {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                {selectedWorkOrder.status === 'OPEN' && (
                  <Button
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => handleStatusChange(selectedWorkOrder.work_order_id, selectedWorkOrder.device_uid, 'IN_PROGRESS')}
                    disabled={updatingStatus === selectedWorkOrder.work_order_id}
                  >
                    {updatingStatus === selectedWorkOrder.work_order_id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Start Work
                  </Button>
                )}
                {selectedWorkOrder.status === 'IN_PROGRESS' && (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange(selectedWorkOrder.work_order_id, selectedWorkOrder.device_uid, 'COMPLETED')}
                    disabled={updatingStatus === selectedWorkOrder.work_order_id}
                  >
                    {updatingStatus === selectedWorkOrder.work_order_id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Complete
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Work Order Dialog - Placeholder */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
            <DialogDescription>
              To create a work order, use the "Send to Maintenance" action from the device inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline maintenance dialog for a specific device
export function DeviceMaintenance({ device, isOpen, onClose }: DeviceMaintenanceProps) {
  const { toast } = useToast();

  if (!device) return null;

  const handleSendToMaintenance = () => {
    toast({
      title: 'Device Sent to Maintenance',
      description: `Work order created for ${device.asset_tag || device.vendor_serial_number}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Send to Maintenance
          </DialogTitle>
          <DialogDescription>
            Create a maintenance work order for {device.asset_tag || device.vendor_serial_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-slate-50">
            <CardContent className="p-3">
              <div className="text-sm">
                <p><strong>Device:</strong> {device.asset_tag}</p>
                <p><strong>Serial:</strong> {device.vendor_serial_number}</p>
                <p><strong>Model:</strong> {device.vendor_name} {device.model}</p>
                <p><strong>Current Status:</strong> {device.status}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maintenance Type *</Label>
              <Select defaultValue="REPAIR">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select defaultValue="MEDIUM">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Issue Description *</Label>
            <Textarea
              placeholder="Describe the issue or reason for maintenance..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select technician (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech-001">James Kila</SelectItem>
                <SelectItem value="tech-002">Peter Wai</SelectItem>
                <SelectItem value="tech-003">Anna Kopa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleSendToMaintenance}>
            <Wrench className="mr-2 h-4 w-4" />
            Create Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
