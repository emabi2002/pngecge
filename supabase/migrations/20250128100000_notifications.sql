-- ============================================
-- PNGEC-BRS Notifications Table
-- In-App Notifications for Users
-- ============================================

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
DROP POLICY IF EXISTS "notifications_user_select" ON notifications;
CREATE POLICY "notifications_user_select" ON notifications FOR SELECT TO authenticated
USING (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "notifications_user_update" ON notifications;
CREATE POLICY "notifications_user_update" ON notifications FOR UPDATE TO authenticated
USING (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));

-- Users can delete their own notifications
DROP POLICY IF EXISTS "notifications_user_delete" ON notifications;
CREATE POLICY "notifications_user_delete" ON notifications FOR DELETE TO authenticated
USING (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));

-- Service role can do everything
DROP POLICY IF EXISTS "notifications_service_policy" ON notifications;
CREATE POLICY "notifications_service_policy" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to auto-update read_at timestamp
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating read_at
DROP TRIGGER IF EXISTS trigger_notification_read_at ON notifications;
CREATE TRIGGER trigger_notification_read_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notification_read_at();

-- Function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = TRUE;

  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Email queue table for tracking email delivery
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(200),
  template_type VARCHAR(50) NOT NULL,
  template_data JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  message_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';

-- Enable RLS on email queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access email queue
DROP POLICY IF EXISTS "email_queue_service_policy" ON email_queue;
CREATE POLICY "email_queue_service_policy" ON email_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  notification_types JSONB DEFAULT '{
    "user_approved": {"email": true, "in_app": true},
    "user_rejected": {"email": true, "in_app": false},
    "role_changed": {"email": true, "in_app": true},
    "export_approved": {"email": true, "in_app": true},
    "export_rejected": {"email": true, "in_app": true},
    "session_terminated": {"email": true, "in_app": true},
    "approval_requested": {"email": true, "in_app": true},
    "system_alerts": {"email": false, "in_app": true}
  }'::jsonb,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own preferences
DROP POLICY IF EXISTS "notification_prefs_user_policy" ON notification_preferences;
CREATE POLICY "notification_prefs_user_policy" ON notification_preferences FOR ALL TO authenticated
USING (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM admin_users WHERE auth_id = auth.uid()));

-- Service role full access
DROP POLICY IF EXISTS "notification_prefs_service_policy" ON notification_preferences;
CREATE POLICY "notification_prefs_service_policy" ON notification_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
