'use client';

import { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Shield,
  Fingerprint,
  Camera,
  MapPin,
  Clock,
  Bell,
  Database,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Configuration categories
const configCategories = [
  { id: 'biometric', label: 'Biometric', icon: Fingerprint },
  { id: 'dedup', label: 'Deduplication', icon: Shield },
  { id: 'gps', label: 'GPS & Location', icon: MapPin },
  { id: 'sync', label: 'Sync Settings', icon: Database },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

// Mock configuration values
const configurations = {
  biometric: [
    { key: 'fingerprint_quality_threshold', label: 'Fingerprint Quality Threshold', value: '75', unit: '%', description: 'Minimum NFIQ quality score for fingerprint capture' },
    { key: 'fingerprint_min_count', label: 'Minimum Fingerprints Required', value: '2', unit: 'fingers', description: 'Minimum number of fingerprints to capture' },
    { key: 'fingerprint_max_retries', label: 'Max Capture Retries', value: '5', unit: 'attempts', description: 'Maximum retry attempts before exception' },
    { key: 'facial_quality_threshold', label: 'Facial Photo Quality', value: '80', unit: '%', description: 'Minimum quality score for facial photos' },
    { key: 'facial_liveness_enabled', label: 'Liveness Detection', value: 'true', unit: 'boolean', description: 'Enable liveness detection for facial capture' },
    { key: 'iris_capture_enabled', label: 'Iris Capture', value: 'false', unit: 'boolean', description: 'Enable optional iris biometric capture' },
  ],
  dedup: [
    { key: 'dedup_fingerprint_threshold', label: 'Fingerprint Match Threshold', value: '90', unit: '%', description: 'Score above which fingerprints are considered a match' },
    { key: 'dedup_facial_threshold', label: 'Facial Match Threshold', value: '85', unit: '%', description: 'Score above which faces are considered a match' },
    { key: 'dedup_multi_threshold', label: 'Multi-Modal Threshold', value: '92', unit: '%', description: 'Combined score threshold for multi-biometric match' },
    { key: 'dedup_batch_size', label: 'Dedup Batch Size', value: '1000', unit: 'records', description: 'Number of records per deduplication batch' },
    { key: 'dedup_auto_confirm', label: 'Auto-Confirm Threshold', value: '98', unit: '%', description: 'Score above which duplicates are auto-confirmed' },
    { key: 'dedup_false_positive_threshold', label: 'False Positive Threshold', value: '70', unit: '%', description: 'Score below which matches are auto-rejected' },
  ],
  gps: [
    { key: 'gps_accuracy_required', label: 'Required GPS Accuracy', value: '25', unit: 'meters', description: 'Maximum acceptable GPS accuracy' },
    { key: 'gps_timeout', label: 'GPS Fix Timeout', value: '60', unit: 'seconds', description: 'Maximum time to wait for GPS fix' },
    { key: 'gps_ward_boundary_check', label: 'Ward Boundary Check', value: 'true', unit: 'boolean', description: 'Verify registration location within assigned ward' },
    { key: 'gps_offline_cache_hours', label: 'Offline Cache Duration', value: '48', unit: 'hours', description: 'Duration to cache ward boundaries offline' },
  ],
  sync: [
    { key: 'sync_auto_interval', label: 'Auto-Sync Interval', value: '30', unit: 'minutes', description: 'Interval for automatic data synchronization' },
    { key: 'sync_batch_size', label: 'Sync Batch Size', value: '100', unit: 'records', description: 'Maximum records per sync batch' },
    { key: 'sync_retry_attempts', label: 'Retry Attempts', value: '3', unit: 'attempts', description: 'Number of sync retry attempts on failure' },
    { key: 'sync_retry_delay', label: 'Retry Delay', value: '5', unit: 'minutes', description: 'Delay between sync retry attempts' },
    { key: 'sync_compression_enabled', label: 'Compression', value: 'true', unit: 'boolean', description: 'Enable data compression during sync' },
  ],
  security: [
    { key: 'session_timeout', label: 'Session Timeout', value: '30', unit: 'minutes', description: 'Inactive session timeout duration' },
    { key: 'password_min_length', label: 'Password Min Length', value: '12', unit: 'characters', description: 'Minimum password length' },
    { key: 'mfa_required', label: 'MFA Required', value: 'true', unit: 'boolean', description: 'Require multi-factor authentication' },
    { key: 'login_max_attempts', label: 'Max Login Attempts', value: '5', unit: 'attempts', description: 'Maximum failed login attempts before lockout' },
    { key: 'lockout_duration', label: 'Lockout Duration', value: '30', unit: 'minutes', description: 'Account lockout duration' },
    { key: 'audit_retention_days', label: 'Audit Log Retention', value: '2555', unit: 'days', description: 'Number of days to retain audit logs (7 years)' },
  ],
  notifications: [
    { key: 'notify_sync_failure', label: 'Sync Failure Alerts', value: 'true', unit: 'boolean', description: 'Send alerts on sync failures' },
    { key: 'notify_device_offline', label: 'Device Offline Alerts', value: 'true', unit: 'boolean', description: 'Alert when devices go offline' },
    { key: 'notify_offline_threshold', label: 'Offline Alert Threshold', value: '60', unit: 'minutes', description: 'Time before triggering offline alert' },
    { key: 'notify_exception_created', label: 'Exception Alerts', value: 'true', unit: 'boolean', description: 'Alert supervisors on new exceptions' },
    { key: 'notify_duplicate_detected', label: 'Duplicate Alerts', value: 'true', unit: 'boolean', description: 'Alert on high-score duplicate matches' },
  ],
};

export default function ConfigurationPage() {
  const [selectedCategory, setSelectedCategory] = useState('biometric');
  const [hasChanges, setHasChanges] = useState(false);
  const [configValues, setConfigValues] = useState(configurations);

  const handleValueChange = (category: string, key: string, newValue: string) => {
    setConfigValues((prev) => ({
      ...prev,
      [category]: prev[category as keyof typeof prev].map((item) =>
        item.key === key ? { ...item, value: newValue } : item
      ),
    }));
    setHasChanges(true);
  };

  const currentConfig = configValues[selectedCategory as keyof typeof configValues] || [];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Configuration</h2>
          <p className="text-sm text-slate-500">
            Configure system parameters, thresholds, and operational settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setHasChanges(false)}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={!hasChanges}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h4 className="font-semibold text-amber-800">Configuration Changes Require Approval</h4>
            <p className="mt-1 text-sm text-amber-700">
              Changes to system configuration require ICT Security approval and will be logged in the audit trail.
              Some changes may require device re-sync to take effect.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-4">
        {/* Category Navigation */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {configCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    selectedCategory === category.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-4 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Configuration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Last Modified</span>
                <span className="font-medium">2026-01-24</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Modified By</span>
                <span className="font-medium">ICT Admin</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Version</span>
                <span className="font-mono text-xs">v2.1.4-config</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span>All configs validated</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Values */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                {configCategories.find((c) => c.id === selectedCategory)?.icon && (
                  <span className="rounded bg-slate-100 p-1.5">
                    {(() => {
                      const Icon = configCategories.find((c) => c.id === selectedCategory)?.icon || Settings;
                      return <Icon className="h-4 w-4 text-slate-600" />;
                    })()}
                  </span>
                )}
                {configCategories.find((c) => c.id === selectedCategory)?.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentConfig.map((config) => (
                <div
                  key={config.key}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={config.key} className="font-medium text-slate-900">
                          {config.label}
                        </label>
                        {config.unit === 'boolean' && (
                          <Badge variant="outline" className="text-xs">Toggle</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.unit === 'boolean' ? (
                        <button
                          type="button"
                          onClick={() => handleValueChange(
                            selectedCategory,
                            config.key,
                            config.value === 'true' ? 'false' : 'true'
                          )}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                            config.value === 'true' ? 'bg-emerald-600' : 'bg-slate-300'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                              config.value === 'true' ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={config.key}
                            type="number"
                            value={config.value}
                            onChange={(e) => handleValueChange(selectedCategory, config.key, e.target.value)}
                            className="w-24 text-right"
                          />
                          <span className="text-sm text-slate-500">{config.unit}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual indicator for thresholds */}
                  {config.unit === '%' && (
                    <div className="mt-3">
                      <Progress value={parseInt(config.value)} className="h-2" />
                      <div className="mt-1 flex justify-between text-xs text-slate-400">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="mt-4 border-blue-200 bg-blue-50">
            <CardContent className="flex items-start gap-3 p-4">
              <Info className="h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-800">Configuration Guidelines</h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>Threshold values affect biometric matching accuracy and duplicate detection rates.</li>
                  <li>Lower thresholds may increase false positives; higher thresholds may miss matches.</li>
                  <li>Changes take effect on next device sync or after server restart.</li>
                  <li>Contact ICT Security before modifying security-related settings.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
