import { supabase } from '@/lib/supabase';

export interface ExportJob {
  id: string;
  type: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  fileUrl?: string;
  fileSize?: string;
  recordCount?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Generate CSV from data
export function generateCSV(data: Record<string, unknown>[], columns: string[]): string {
  if (!data.length) return '';
  
  const headers = columns.join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

// Generate JSON export
export function generateJSON(data: Record<string, unknown>[]): string {
  return JSON.stringify(data, null, 2);
}

// Download file
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export voters data
export async function exportVoters(options: {
  provinces?: string[];
  dateFrom?: string;
  dateTo?: string;
  format: 'csv' | 'json';
}): Promise<{ success: boolean; recordCount: number; error?: string }> {
  try {
    let query = supabase
      .from('voters')
      .select('*');
    
    if (options.provinces?.length) {
      query = query.in('province', options.provinces);
    }
    if (options.dateFrom) {
      query = query.gte('created_at', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('created_at', options.dateTo);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const records = data || [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (options.format === 'csv') {
      const columns = ['id', 'voter_id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'province', 'district', 'ward', 'status', 'created_at'];
      const csv = generateCSV(records, columns);
      downloadFile(csv, `voters-export-${timestamp}.csv`, 'text/csv');
    } else {
      const json = generateJSON(records);
      downloadFile(json, `voters-export-${timestamp}.json`, 'application/json');
    }
    
    return { success: true, recordCount: records.length };
  } catch (error) {
    console.error('Error exporting voters:', error);
    return { success: false, recordCount: 0, error: String(error) };
  }
}

// Export audit logs
export async function exportAuditLogs(options: {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  format: 'csv' | 'json';
}): Promise<{ success: boolean; recordCount: number; error?: string }> {
  try {
    let query = supabase
      .from('audit_logs_detailed')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (options.dateFrom) {
      query = query.gte('timestamp', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('timestamp', options.dateTo);
    }
    if (options.category) {
      query = query.eq('category', options.category);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const records = data || [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (options.format === 'csv') {
      const columns = ['id', 'timestamp', 'user_email', 'action', 'category', 'entity_type', 'entity_id', 'status', 'ip_address'];
      const csv = generateCSV(records, columns);
      downloadFile(csv, `audit-logs-${timestamp}.csv`, 'text/csv');
    } else {
      const json = generateJSON(records);
      downloadFile(json, `audit-logs-${timestamp}.json`, 'application/json');
    }
    
    return { success: true, recordCount: records.length };
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return { success: false, recordCount: 0, error: String(error) };
  }
}

// Export users
export async function exportUsers(options: {
  status?: string;
  roleId?: string;
  format: 'csv' | 'json';
}): Promise<{ success: boolean; recordCount: number; error?: string }> {
  try {
    let query = supabase
      .from('admin_users')
      .select(`
        id, email, full_name, phone, employee_id,
        status, is_active, mfa_enabled, clearance_level,
        department, position, created_at, last_login_at,
        role:roles(name)
      `);
    
    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.roleId) {
      query = query.eq('role_id', options.roleId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Flatten the role object
    const records = (data || []).map(user => ({
      ...user,
      role_name: (user.role as unknown as { name: string } | null)?.name || 'No Role',
      role: undefined,
    }));
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (options.format === 'csv') {
      const columns = ['id', 'email', 'full_name', 'phone', 'employee_id', 'role_name', 'status', 'clearance_level', 'department', 'position', 'created_at'];
      const csv = generateCSV(records, columns);
      downloadFile(csv, `users-export-${timestamp}.csv`, 'text/csv');
    } else {
      const json = generateJSON(records);
      downloadFile(json, `users-export-${timestamp}.json`, 'application/json');
    }
    
    return { success: true, recordCount: records.length };
  } catch (error) {
    console.error('Error exporting users:', error);
    return { success: false, recordCount: 0, error: String(error) };
  }
}

// Export geographic units
export async function exportGeographicUnits(options: {
  level?: string;
  format: 'csv' | 'json';
}): Promise<{ success: boolean; recordCount: number; error?: string }> {
  try {
    let query = supabase
      .from('geographic_units')
      .select('*')
      .order('level')
      .order('name');
    
    if (options.level) {
      query = query.eq('level', options.level);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    const records = data || [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (options.format === 'csv') {
      const columns = ['id', 'code', 'name', 'level', 'parent_id', 'population', 'registered_voters', 'is_active'];
      const csv = generateCSV(records, columns);
      downloadFile(csv, `geographic-units-${timestamp}.csv`, 'text/csv');
    } else {
      const json = generateJSON(records);
      downloadFile(json, `geographic-units-${timestamp}.json`, 'application/json');
    }
    
    return { success: true, recordCount: records.length };
  } catch (error) {
    console.error('Error exporting geographic units:', error);
    return { success: false, recordCount: 0, error: String(error) };
  }
}

// Create export request (with approval workflow)
export async function createExportRequest(request: {
  exportType: string;
  title: string;
  description: string;
  format: string;
  scope: Record<string, unknown>;
  justification: string;
  requestorId: string;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('approval_requests')
      .insert([{
        request_type: 'data_export',
        requestor_id: request.requestorId,
        requested_changes: {
          export_type: request.exportType,
          title: request.title,
          description: request.description,
          format: request.format,
          scope: request.scope,
        },
        justification: request.justification,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, requestId: data.id };
  } catch (error) {
    console.error('Error creating export request:', error);
    return { success: false, error: String(error) };
  }
}
