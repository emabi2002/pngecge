// Supabase Edge Function for sending email notifications
// This function handles approval workflow email notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  type: 'user_created' | 'user_approved' | 'user_rejected' | 'role_changed' | 'password_reset' | 'export_approved' | 'export_rejected' | 'session_terminated';
  recipient_email: string;
  recipient_name: string;
  data: Record<string, unknown>;
  send_email?: boolean;
  send_in_app?: boolean;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Email template generator
function generateEmailTemplate(type: string, data: Record<string, unknown>): EmailTemplate {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
  `;

  const headerHtml = `
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">PNGEC-BRS</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Biometric Registration System</p>
    </div>
  `;

  const footerHtml = `
    <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        Papua New Guinea Electoral Commission<br />
        2027 National General Election
      </p>
      <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  `;

  switch (type) {
    case 'user_created':
      return {
        subject: 'PNGEC-BRS: Your Account Has Been Created',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a;">Welcome to PNGEC-BRS</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>Your account has been created and is pending approval. Once approved, you will receive another notification with instructions to access the system.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">Account Details:</p>
                <p style="margin: 0; color: #475569;">Email: ${data.email || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #475569;">Role: ${data.role_name || 'Pending Assignment'}</p>
                <p style="margin: 4px 0 0 0; color: #475569;">Employee ID: ${data.employee_id || 'N/A'}</p>
              </div>
              <p style="color: #64748b; font-size: 14px;">Please wait for administrator approval before attempting to log in.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Welcome to PNGEC-BRS\n\nDear ${data.recipient_name || 'User'},\n\nYour account has been created and is pending approval. Once approved, you will receive another notification with instructions to access the system.\n\nAccount Details:\nEmail: ${data.email || 'N/A'}\nRole: ${data.role_name || 'Pending Assignment'}\nEmployee ID: ${data.employee_id || 'N/A'}\n\nPlease wait for administrator approval before attempting to log in.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'user_approved':
      return {
        subject: 'PNGEC-BRS: Your Account Has Been Approved',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #059669;">Account Approved</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>Great news! Your PNGEC-BRS account has been approved. You can now log in and access the system.</p>
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">Access Granted</p>
                <p style="margin: 0; color: #047857;">Role: ${data.role_name || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #047857;">Clearance Level: ${data.clearance_level || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #047857;">Approved by: ${data.approved_by || 'Administrator'}</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.login_url || 'https://brs.pngec.gov.pg/login'}"
                   style="display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Log In Now
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px;">If you have any issues accessing your account, please contact your administrator.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Account Approved\n\nDear ${data.recipient_name || 'User'},\n\nGreat news! Your PNGEC-BRS account has been approved. You can now log in and access the system.\n\nRole: ${data.role_name || 'N/A'}\nClearance Level: ${data.clearance_level || 'N/A'}\nApproved by: ${data.approved_by || 'Administrator'}\n\nLog in at: ${data.login_url || 'https://brs.pngec.gov.pg/login'}\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'user_rejected':
      return {
        subject: 'PNGEC-BRS: Account Request Not Approved',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #dc2626;">Account Request Not Approved</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>We regret to inform you that your PNGEC-BRS account request has not been approved at this time.</p>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">Reason:</p>
                <p style="margin: 0; color: #b91c1c;">${data.rejection_reason || 'No specific reason provided.'}</p>
              </div>
              <p>If you believe this decision was made in error, please contact your supervisor or the system administrator.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Account Request Not Approved\n\nDear ${data.recipient_name || 'User'},\n\nWe regret to inform you that your PNGEC-BRS account request has not been approved at this time.\n\nReason: ${data.rejection_reason || 'No specific reason provided.'}\n\nIf you believe this decision was made in error, please contact your supervisor or the system administrator.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'role_changed':
      return {
        subject: 'PNGEC-BRS: Your Role Has Been Updated',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a;">Role Update Notification</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>Your role in the PNGEC-BRS system has been updated.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600;">Role Change Details:</p>
                <p style="margin: 0; color: #475569;">Previous Role: ${data.previous_role || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #475569;">New Role: <strong>${data.new_role || 'N/A'}</strong></p>
                <p style="margin: 4px 0 0 0; color: #475569;">New Clearance Level: ${data.new_clearance_level || 'N/A'}</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px;">Changed by: ${data.changed_by || 'Administrator'}</p>
              </div>
              <p>Your permissions have been updated accordingly. Please log out and log back in for changes to take effect.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Role Update Notification\n\nDear ${data.recipient_name || 'User'},\n\nYour role in the PNGEC-BRS system has been updated.\n\nPrevious Role: ${data.previous_role || 'N/A'}\nNew Role: ${data.new_role || 'N/A'}\nNew Clearance Level: ${data.new_clearance_level || 'N/A'}\nChanged by: ${data.changed_by || 'Administrator'}\n\nPlease log out and log back in for changes to take effect.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'export_approved':
      return {
        subject: 'PNGEC-BRS: Data Export Request Approved',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #059669;">Export Request Approved</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>Your data export request has been approved. The export is now being processed.</p>
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">Export Details:</p>
                <p style="margin: 0; color: #047857;">Export Type: ${data.export_type || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #047857;">Scope: ${data.export_scope || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #047857;">Format: ${data.export_format || 'N/A'}</p>
                <p style="margin: 8px 0 0 0; color: #047857;">Approved by: ${data.approved_by || 'Administrator'}</p>
              </div>
              <p>You will be notified once the export is ready for download.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Export Request Approved\n\nDear ${data.recipient_name || 'User'},\n\nYour data export request has been approved.\n\nExport Type: ${data.export_type || 'N/A'}\nScope: ${data.export_scope || 'N/A'}\nFormat: ${data.export_format || 'N/A'}\nApproved by: ${data.approved_by || 'Administrator'}\n\nYou will be notified once the export is ready for download.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'export_rejected':
      return {
        subject: 'PNGEC-BRS: Data Export Request Rejected',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #dc2626;">Export Request Rejected</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>Your data export request has been rejected.</p>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #991b1b;">Reason:</p>
                <p style="margin: 0; color: #b91c1c;">${data.rejection_reason || 'No specific reason provided.'}</p>
              </div>
              <p>If you believe this decision was made in error, please contact your administrator.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Export Request Rejected\n\nDear ${data.recipient_name || 'User'},\n\nYour data export request has been rejected.\n\nReason: ${data.rejection_reason || 'No specific reason provided.'}\n\nIf you believe this decision was made in error, please contact your administrator.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'session_terminated':
      return {
        subject: 'PNGEC-BRS: Security Alert - Session Terminated',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #f59e0b;">Security Alert</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>One of your active sessions has been terminated by an administrator.</p>
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">Session Details:</p>
                <p style="margin: 0; color: #b45309;">Device: ${data.device_info || 'Unknown'}</p>
                <p style="margin: 4px 0 0 0; color: #b45309;">IP Address: ${data.ip_address || 'N/A'}</p>
                <p style="margin: 4px 0 0 0; color: #b45309;">Location: ${data.location || 'N/A'}</p>
                <p style="margin: 8px 0 0 0; color: #b45309;">Terminated by: ${data.terminated_by || 'Administrator'}</p>
                <p style="margin: 4px 0 0 0; color: #b45309;">Reason: ${data.termination_reason || 'Security precaution'}</p>
              </div>
              <p>If you did not expect this, please contact your administrator immediately.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Security Alert - Session Terminated\n\nDear ${data.recipient_name || 'User'},\n\nOne of your active sessions has been terminated by an administrator.\n\nDevice: ${data.device_info || 'Unknown'}\nIP Address: ${data.ip_address || 'N/A'}\nLocation: ${data.location || 'N/A'}\nTerminated by: ${data.terminated_by || 'Administrator'}\nReason: ${data.termination_reason || 'Security precaution'}\n\nIf you did not expect this, please contact your administrator immediately.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    case 'password_reset':
      return {
        subject: 'PNGEC-BRS: Password Reset Request',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a;">Password Reset</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>A password reset has been requested for your account. Use the button below to set a new password.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.reset_url || '#'}"
                   style="display: inline-block; background: #059669; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Reset Password
                </a>
              </div>
              <p style="color: #64748b; font-size: 14px;">This link will expire in ${data.expires_in || '24 hours'}.</p>
              <p style="color: #dc2626; font-size: 14px;">If you did not request this reset, please ignore this email and contact your administrator.</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Password Reset\n\nDear ${data.recipient_name || 'User'},\n\nA password reset has been requested for your account.\n\nReset your password at: ${data.reset_url || '#'}\n\nThis link will expire in ${data.expires_in || '24 hours'}.\n\nIf you did not request this reset, please ignore this email and contact your administrator.\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };

    default:
      return {
        subject: 'PNGEC-BRS: Notification',
        html: `
          <div style="${baseStyles}">
            ${headerHtml}
            <div style="padding: 32px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a;">Notification</h2>
              <p>Dear ${data.recipient_name || 'User'},</p>
              <p>${data.message || 'You have a new notification from PNGEC-BRS.'}</p>
            </div>
            ${footerHtml}
          </div>
        `,
        text: `Notification\n\nDear ${data.recipient_name || 'User'},\n\n${data.message || 'You have a new notification from PNGEC-BRS.'}\n\n---\nPapua New Guinea Electoral Commission\n2027 National General Election`,
      };
  }
}

// Send email using Resend API (or fallback to logging)
async function sendEmail(to: string, template: EmailTemplate): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');

  if (!resendApiKey) {
    // Log email for development/testing
    console.log('Email would be sent (no RESEND_API_KEY configured):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Body: ${template.text.substring(0, 200)}...`);
    return { success: true, message_id: `mock-${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('EMAIL_FROM') || 'PNGEC-BRS <noreply@brs.pngec.gov.pg>',
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json();
    return { success: true, message_id: result.id };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Store in-app notification
async function storeInAppNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  type: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type: type,
      title: data.title || getNotificationTitle(type),
      message: data.message || '',
      data: data,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    user_created: 'Account Created',
    user_approved: 'Account Approved',
    user_rejected: 'Account Rejected',
    role_changed: 'Role Updated',
    password_reset: 'Password Reset',
    export_approved: 'Export Approved',
    export_rejected: 'Export Rejected',
    session_terminated: 'Session Terminated',
  };
  return titles[type] || 'Notification';
}

// Log notification to audit trail
async function logNotification(
  supabase: ReturnType<typeof createClient>,
  payload: NotificationPayload,
  result: { email?: { success: boolean; message_id?: string }; in_app?: { success: boolean } }
): Promise<void> {
  try {
    await supabase.from('audit_logs_detailed').insert({
      action: 'NOTIFICATION_SENT',
      module: 'notifications',
      resource_type: 'notification',
      details: {
        type: payload.type,
        recipient_email: payload.recipient_email,
        email_sent: result.email?.success || false,
        in_app_stored: result.in_app?.success || false,
      },
      severity: 'info',
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();

    // Validate payload
    if (!payload.type || !payload.recipient_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, recipient_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { email?: { success: boolean; message_id?: string; error?: string }; in_app?: { success: boolean; error?: string } } = {};

    // Send email notification
    if (payload.send_email !== false) {
      const template = generateEmailTemplate(payload.type, {
        ...payload.data,
        recipient_name: payload.recipient_name,
        email: payload.recipient_email,
      });
      results.email = await sendEmail(payload.recipient_email, template);
    }

    // Store in-app notification (if user_id is provided)
    if (payload.send_in_app !== false && payload.data.user_id) {
      results.in_app = await storeInAppNotification(
        supabase,
        payload.data.user_id as string,
        payload.type,
        payload.data
      );
    }

    // Log to audit trail
    await logNotification(supabase, payload, results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Notification error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
