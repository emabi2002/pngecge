/**
 * Notification Service for PNGEC-BRS
 * Handles email and in-app notifications for approval workflows
 */

import { supabase } from './supabase';

// Notification types
export type NotificationType =
  | 'user_created'
  | 'user_approved'
  | 'user_rejected'
  | 'role_changed'
  | 'password_reset'
  | 'export_approved'
  | 'export_rejected'
  | 'session_terminated'
  | 'approval_requested'
  | 'approval_reminder';

export interface NotificationPayload {
  type: NotificationType;
  recipient_email: string;
  recipient_name: string;
  data: Record<string, unknown>;
  send_email?: boolean;
  send_in_app?: boolean;
}

export interface NotificationResult {
  success: boolean;
  results?: {
    email?: { success: boolean; message_id?: string; error?: string };
    in_app?: { success: boolean; error?: string };
  };
  error?: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/**
 * Send notification via Edge Function
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    });

    if (error) {
      console.error('Notification error:', error);
      return { success: false, error: error.message };
    }

    return data as NotificationResult;
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send user creation notification
 */
export async function notifyUserCreated(user: {
  email: string;
  full_name: string;
  role_name?: string;
  employee_id?: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'user_created',
    recipient_email: user.email,
    recipient_name: user.full_name,
    data: {
      email: user.email,
      role_name: user.role_name,
      employee_id: user.employee_id,
    },
    send_email: true,
    send_in_app: false, // User doesn't have access yet
  });
}

/**
 * Send user approval notification
 */
export async function notifyUserApproved(user: {
  id: string;
  email: string;
  full_name: string;
  role_name: string;
  clearance_level: number;
  approved_by: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'user_approved',
    recipient_email: user.email,
    recipient_name: user.full_name,
    data: {
      user_id: user.id,
      role_name: user.role_name,
      clearance_level: user.clearance_level,
      approved_by: user.approved_by,
      login_url: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
    },
    send_email: true,
    send_in_app: true,
  });
}

/**
 * Send user rejection notification
 */
export async function notifyUserRejected(user: {
  email: string;
  full_name: string;
  rejection_reason?: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'user_rejected',
    recipient_email: user.email,
    recipient_name: user.full_name,
    data: {
      rejection_reason: user.rejection_reason || 'Your account request could not be approved at this time.',
    },
    send_email: true,
    send_in_app: false,
  });
}

/**
 * Send role change notification
 */
export async function notifyRoleChanged(user: {
  id: string;
  email: string;
  full_name: string;
  previous_role: string;
  new_role: string;
  new_clearance_level: number;
  changed_by: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'role_changed',
    recipient_email: user.email,
    recipient_name: user.full_name,
    data: {
      user_id: user.id,
      previous_role: user.previous_role,
      new_role: user.new_role,
      new_clearance_level: user.new_clearance_level,
      changed_by: user.changed_by,
    },
    send_email: true,
    send_in_app: true,
  });
}

/**
 * Send export approval notification
 */
export async function notifyExportApproved(request: {
  requestor_id: string;
  requestor_email: string;
  requestor_name: string;
  export_type: string;
  export_scope: string;
  export_format: string;
  approved_by: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'export_approved',
    recipient_email: request.requestor_email,
    recipient_name: request.requestor_name,
    data: {
      user_id: request.requestor_id,
      export_type: request.export_type,
      export_scope: request.export_scope,
      export_format: request.export_format,
      approved_by: request.approved_by,
    },
    send_email: true,
    send_in_app: true,
  });
}

/**
 * Send export rejection notification
 */
export async function notifyExportRejected(request: {
  requestor_email: string;
  requestor_name: string;
  rejection_reason?: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'export_rejected',
    recipient_email: request.requestor_email,
    recipient_name: request.requestor_name,
    data: {
      rejection_reason: request.rejection_reason || 'Your export request was not approved.',
    },
    send_email: true,
    send_in_app: true,
  });
}

/**
 * Send session terminated notification
 */
export async function notifySessionTerminated(session: {
  user_id: string;
  user_email: string;
  user_name: string;
  device_info?: string;
  ip_address?: string;
  location?: string;
  terminated_by: string;
  termination_reason?: string;
}): Promise<NotificationResult> {
  return sendNotification({
    type: 'session_terminated',
    recipient_email: session.user_email,
    recipient_name: session.user_name,
    data: {
      user_id: session.user_id,
      device_info: session.device_info,
      ip_address: session.ip_address,
      location: session.location,
      terminated_by: session.terminated_by,
      termination_reason: session.termination_reason || 'Security precaution',
    },
    send_email: true,
    send_in_app: true,
  });
}

/**
 * Get in-app notifications for current user
 */
export async function getInAppNotifications(userId: string): Promise<InAppNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as InAppNotification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error counting notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error counting notifications:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

/**
 * Notify administrators about pending approval
 */
export async function notifyAdminsAboutPendingApproval(request: {
  request_type: 'user_creation' | 'data_export' | 'role_change';
  requestor_name: string;
  details: string;
}): Promise<void> {
  try {
    // Get administrators with approval permissions
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role:roles(code, level)')
      .in('status', ['active'])
      .gte('clearance_level', 7); // Provincial admin and above

    if (error || !admins) {
      console.error('Error fetching admins for notification:', error);
      return;
    }

    // Send notifications to all eligible admins
    for (const admin of admins) {
      await sendNotification({
        type: 'approval_requested',
        recipient_email: admin.email,
        recipient_name: admin.full_name,
        data: {
          user_id: admin.id,
          request_type: request.request_type,
          requestor_name: request.requestor_name,
          details: request.details,
        },
        send_email: true,
        send_in_app: true,
      });
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: InAppNotification) => void
): () => void {
  const subscription = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as InAppNotification);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
