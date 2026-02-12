'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  getInAppNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  type InAppNotification,
} from '@/lib/notification-service';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  userId?: string;
}

const NOTIFICATION_ICONS: Record<string, { color: string; bgColor: string }> = {
  user_approved: { color: 'text-green-600', bgColor: 'bg-green-100' },
  user_rejected: { color: 'text-red-600', bgColor: 'bg-red-100' },
  user_created: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  role_changed: { color: 'text-purple-600', bgColor: 'bg-purple-100' },
  export_approved: { color: 'text-green-600', bgColor: 'bg-green-100' },
  export_rejected: { color: 'text-red-600', bgColor: 'bg-red-100' },
  session_terminated: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  approval_requested: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  default: { color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

const NOTIFICATION_TITLES: Record<string, string> = {
  user_approved: 'Account Approved',
  user_rejected: 'Account Rejected',
  user_created: 'Account Created',
  role_changed: 'Role Updated',
  export_approved: 'Export Approved',
  export_rejected: 'Export Rejected',
  session_terminated: 'Session Terminated',
  approval_requested: 'Approval Requested',
};

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load notifications when user ID is available
  useEffect(() => {
    if (userId) {
      loadNotifications();
      loadUnreadCount();

      // Subscribe to real-time notifications
      const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => unsubscribe();
    }
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getInAppNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!userId) return;
    const count = await getUnreadNotificationCount(userId);
    setUnreadCount(count);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markNotificationAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    const success = await markAllNotificationsAsRead(userId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  const handleDelete = async (notificationId: string) => {
    const success = await deleteNotification(notificationId);
    if (success) {
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationStyle = (type: string) => {
    return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
  };

  // Show demo notifications if no userId (for development)
  const displayNotifications = userId ? notifications : [
    {
      id: 'demo-1',
      user_id: 'demo',
      type: 'approval_requested' as const,
      title: 'New Approval Request',
      message: 'Peter Wai has requested account creation approval.',
      data: {},
      is_read: false,
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'demo-2',
      user_id: 'demo',
      type: 'export_approved' as const,
      title: 'Export Request Approved',
      message: 'Your voter registry export has been approved.',
      data: {},
      is_read: true,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'demo-3',
      user_id: 'demo',
      type: 'role_changed' as const,
      title: 'Role Updated',
      message: 'Your role has been changed to Provincial Administrator.',
      data: {},
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const displayUnreadCount = userId ? unreadCount : 1;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5 text-slate-500" />
          {displayUnreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-red-500 px-1 text-[10px] text-white"
            >
              {displayUnreadCount > 99 ? '99+' : displayUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {displayUnreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-80">
          {displayNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              No notifications
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {displayNotifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-slate-50',
                      !notification.is_read && 'bg-emerald-50/50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        style.bgColor
                      )}
                    >
                      <Bell className={cn('h-4 w-4', style.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          !notification.is_read && 'font-medium'
                        )}>
                          {notification.title || NOTIFICATION_TITLES[notification.type] || 'Notification'}
                        </p>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-slate-500 hover:text-emerald-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-slate-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {displayNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-500"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
