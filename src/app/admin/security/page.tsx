'use client';

import { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  Key,
  Clock,
  Users,
  AlertTriangle,
  Settings,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  MessageSquare,
  Globe,
  Ban,
  CheckCircle,
  Info,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface PasswordPolicy {
  min_length: number;
  max_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  special_chars_allowed: string;
  password_history_count: number;
  max_age_days: number;
  min_age_days: number;
}

interface AccountPolicy {
  max_failed_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_mfa_for_admin: boolean;
  require_mfa_for_sensitive_actions: boolean;
}

interface MFASettings {
  enabled: boolean;
  methods: {
    totp: boolean;
    sms: boolean;
    email: boolean;
  };
  grace_period_days: number;
  remember_device_days: number;
}

export default function SecuritySettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    min_length: 12,
    max_length: 128,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    special_chars_allowed: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    password_history_count: 5,
    max_age_days: 90,
    min_age_days: 1,
  });

  const [accountPolicy, setAccountPolicy] = useState<AccountPolicy>({
    max_failed_attempts: 5,
    lockout_duration_minutes: 30,
    session_timeout_minutes: 480,
    max_concurrent_sessions: 3,
    require_mfa_for_admin: true,
    require_mfa_for_sensitive_actions: true,
  });

  const [mfaSettings, setMFASettings] = useState<MFASettings>({
    enabled: true,
    methods: {
      totp: true,
      sms: false,
      email: true,
    },
    grace_period_days: 7,
    remember_device_days: 30,
  });

  const [ipRestrictions, setIpRestrictions] = useState({
    enabled: false,
    allowed_ranges: ['192.168.0.0/16', '10.0.0.0/8'],
    blocked_ranges: [],
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handlePasswordPolicyChange = (field: keyof PasswordPolicy, value: unknown) => {
    setPasswordPolicy(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAccountPolicyChange = (field: keyof AccountPolicy, value: unknown) => {
    setAccountPolicy(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleMFAChange = (field: string, value: unknown) => {
    if (field.startsWith('methods.')) {
      const method = field.split('.')[1] as keyof MFASettings['methods'];
      setMFASettings(prev => ({
        ...prev,
        methods: { ...prev.methods, [method]: value },
      }));
    } else {
      setMFASettings(prev => ({ ...prev, [field]: value }));
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Security Settings Saved',
      description: 'All security policies have been updated successfully.',
    });

    setSaving(false);
    setHasChanges(false);
    setIsSaveDialogOpen(false);
  };

  const handleReset = () => {
    setPasswordPolicy({
      min_length: 12,
      max_length: 128,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special_chars: true,
      special_chars_allowed: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      password_history_count: 5,
      max_age_days: 90,
      min_age_days: 1,
    });
    setHasChanges(false);
    toast({
      title: 'Settings Reset',
      description: 'All changes have been discarded.',
    });
  };

  const getPasswordStrengthScore = () => {
    let score = 0;
    if (passwordPolicy.min_length >= 8) score++;
    if (passwordPolicy.min_length >= 12) score++;
    if (passwordPolicy.require_uppercase) score++;
    if (passwordPolicy.require_lowercase) score++;
    if (passwordPolicy.require_numbers) score++;
    if (passwordPolicy.require_special_chars) score++;
    if (passwordPolicy.password_history_count >= 3) score++;
    if (passwordPolicy.max_age_days <= 90) score++;
    return score;
  };

  const strengthScore = getPasswordStrengthScore();
  const strengthLabel = strengthScore >= 7 ? 'Strong' : strengthScore >= 5 ? 'Moderate' : 'Weak';
  const strengthColor = strengthScore >= 7 ? 'text-green-600' : strengthScore >= 5 ? 'text-amber-600' : 'text-red-600';

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
          <h1 className="text-2xl font-bold text-slate-900">Security Settings</h1>
          <p className="text-slate-500">Configure password policies, MFA, and access controls</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setIsSaveDialogOpen(true)}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Password Strength</p>
                <p className={`font-semibold ${strengthColor}`}>{strengthLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">MFA Status</p>
                <p className="font-semibold text-blue-600">
                  {mfaSettings.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Session Timeout</p>
                <p className="font-semibold text-amber-600">
                  {Math.floor(accountPolicy.session_timeout_minutes / 60)}h {accountPolicy.session_timeout_minutes % 60}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Lockout After</p>
                <p className="font-semibold text-red-600">
                  {accountPolicy.max_failed_attempts} attempts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="password" className="space-y-4">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="password" className="gap-2">
            <Key className="h-4 w-4" />
            Password Policy
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Users className="h-4 w-4" />
            Account Policy
          </TabsTrigger>
          <TabsTrigger value="mfa" className="gap-2">
            <Smartphone className="h-4 w-4" />
            MFA Settings
          </TabsTrigger>
          <TabsTrigger value="ip" className="gap-2">
            <Globe className="h-4 w-4" />
            IP Restrictions
          </TabsTrigger>
        </TabsList>

        {/* Password Policy Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password Requirements</CardTitle>
              <CardDescription>
                Define the complexity requirements for user passwords
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Length Requirements */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="min_length">Minimum Length</Label>
                  <Input
                    id="min_length"
                    type="number"
                    min={8}
                    max={32}
                    value={passwordPolicy.min_length}
                    onChange={(e) => handlePasswordPolicyChange('min_length', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-slate-500">Recommended: 12 or more characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_length">Maximum Length</Label>
                  <Input
                    id="max_length"
                    type="number"
                    min={32}
                    max={256}
                    value={passwordPolicy.max_length}
                    onChange={(e) => handlePasswordPolicyChange('max_length', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Character Requirements */}
              <div>
                <Label className="mb-3 block">Character Requirements</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">A-Z</span>
                      <span className="text-sm text-slate-600">Uppercase letters</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={passwordPolicy.require_uppercase}
                      onChange={(e) => handlePasswordPolicyChange('require_uppercase', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">a-z</span>
                      <span className="text-sm text-slate-600">Lowercase letters</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={passwordPolicy.require_lowercase}
                      onChange={(e) => handlePasswordPolicyChange('require_lowercase', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">0-9</span>
                      <span className="text-sm text-slate-600">Numbers</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={passwordPolicy.require_numbers}
                      onChange={(e) => handlePasswordPolicyChange('require_numbers', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg">!@#</span>
                      <span className="text-sm text-slate-600">Special characters</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={passwordPolicy.require_special_chars}
                      onChange={(e) => handlePasswordPolicyChange('require_special_chars', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password History & Expiration */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="password_history">Password History</Label>
                  <Select
                    value={passwordPolicy.password_history_count.toString()}
                    onValueChange={(v) => handlePasswordPolicyChange('password_history_count', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 10, 15, 20].map(n => (
                        <SelectItem key={n} value={n.toString()}>
                          Remember last {n} passwords
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Prevent reuse of recent passwords</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_age">Password Expiration</Label>
                  <Select
                    value={passwordPolicy.max_age_days.toString()}
                    onValueChange={(v) => handlePasswordPolicyChange('max_age_days', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_age">Minimum Age</Label>
                  <Select
                    value={passwordPolicy.min_age_days.toString()}
                    onValueChange={(v) => handlePasswordPolicyChange('min_age_days', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No minimum</SelectItem>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Time before password can be changed again</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Policy Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Configure account lockout, session management, and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lockout Settings */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Account Lockout</h4>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Maximum Failed Attempts</Label>
                    <Select
                      value={accountPolicy.max_failed_attempts.toString()}
                      onValueChange={(v) => handleAccountPolicyChange('max_failed_attempts', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 15, 20].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} attempts
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Account locks after this many failed logins</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Lockout Duration</Label>
                    <Select
                      value={accountPolicy.lockout_duration_minutes.toString()}
                      onValueChange={(v) => handleAccountPolicyChange('lockout_duration_minutes', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                        <SelectItem value="-1">Until admin unlock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Session Settings */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Session Management</h4>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select
                      value={accountPolicy.session_timeout_minutes.toString()}
                      onValueChange={(v) => handleAccountPolicyChange('session_timeout_minutes', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Auto-logout after inactivity</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Maximum Concurrent Sessions</Label>
                    <Select
                      value={accountPolicy.max_concurrent_sessions.toString()}
                      onValueChange={(v) => handleAccountPolicyChange('max_concurrent_sessions', parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 session only</SelectItem>
                        <SelectItem value="2">2 sessions</SelectItem>
                        <SelectItem value="3">3 sessions</SelectItem>
                        <SelectItem value="5">5 sessions</SelectItem>
                        <SelectItem value="0">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* MFA Requirements */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">MFA Requirements</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Require MFA for Admin Roles</p>
                      <p className="text-sm text-slate-500">
                        Super Admin, National Admin, and Provincial Admin must use MFA
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={accountPolicy.require_mfa_for_admin}
                      onChange={(e) => handleAccountPolicyChange('require_mfa_for_admin', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Require MFA for Sensitive Actions</p>
                      <p className="text-sm text-slate-500">
                        Data export, bulk operations, and security changes require MFA
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={accountPolicy.require_mfa_for_sensitive_actions}
                      onChange={(e) => handleAccountPolicyChange('require_mfa_for_sensitive_actions', e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MFA Settings Tab */}
        <TabsContent value="mfa">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Factor Authentication</CardTitle>
              <CardDescription>
                Configure available MFA methods and enforcement policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MFA Enable/Disable */}
              <div className="flex items-center justify-between rounded-lg border-2 border-dashed p-4">
                <div>
                  <p className="font-medium">Enable MFA System</p>
                  <p className="text-sm text-slate-500">
                    Allow users to set up multi-factor authentication
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={mfaSettings.enabled}
                  onChange={(e) => handleMFAChange('enabled', e.target.checked)}
                  className="h-6 w-6 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {/* MFA Methods */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Available Methods</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className={`rounded-lg border-2 p-4 ${mfaSettings.methods.totp ? 'border-emerald-300 bg-emerald-50' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Smartphone className="h-5 w-5 text-purple-600" />
                      </div>
                      <input
                        type="checkbox"
                        checked={mfaSettings.methods.totp}
                        onChange={(e) => handleMFAChange('methods.totp', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                      />
                    </div>
                    <h5 className="font-medium">Authenticator App</h5>
                    <p className="text-sm text-slate-500">
                      Google Authenticator, Authy, or similar TOTP apps
                    </p>
                    <Badge className="mt-2 bg-green-100 text-green-700">Recommended</Badge>
                  </div>

                  <div className={`rounded-lg border-2 p-4 ${mfaSettings.methods.sms ? 'border-emerald-300 bg-emerald-50' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <input
                        type="checkbox"
                        checked={mfaSettings.methods.sms}
                        onChange={(e) => handleMFAChange('methods.sms', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                      />
                    </div>
                    <h5 className="font-medium">SMS Verification</h5>
                    <p className="text-sm text-slate-500">
                      Send verification codes via SMS to mobile phone
                    </p>
                    <Badge className="mt-2 bg-amber-100 text-amber-700">Less Secure</Badge>
                  </div>

                  <div className={`rounded-lg border-2 p-4 ${mfaSettings.methods.email ? 'border-emerald-300 bg-emerald-50' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <Mail className="h-5 w-5 text-orange-600" />
                      </div>
                      <input
                        type="checkbox"
                        checked={mfaSettings.methods.email}
                        onChange={(e) => handleMFAChange('methods.email', e.target.checked)}
                        className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                      />
                    </div>
                    <h5 className="font-medium">Email Verification</h5>
                    <p className="text-sm text-slate-500">
                      Send verification codes via email
                    </p>
                    <Badge className="mt-2 bg-slate-100 text-slate-700">Fallback Option</Badge>
                  </div>
                </div>
              </div>

              {/* MFA Timing */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Grace Period for New Users</Label>
                  <Select
                    value={mfaSettings.grace_period_days.toString()}
                    onValueChange={(v) => handleMFAChange('grace_period_days', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Immediate (no grace period)</SelectItem>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Time allowed to set up MFA after account creation</p>
                </div>
                <div className="space-y-2">
                  <Label>Remember Device Duration</Label>
                  <Select
                    value={mfaSettings.remember_device_days.toString()}
                    onValueChange={(v) => handleMFAChange('remember_device_days', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Never remember</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Skip MFA on trusted devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Restrictions Tab */}
        <TabsContent value="ip">
          <Card>
            <CardHeader>
              <CardTitle>IP Address Restrictions</CardTitle>
              <CardDescription>
                Control access based on IP addresses and ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border-2 border-dashed p-4">
                <div>
                  <p className="font-medium">Enable IP Restrictions</p>
                  <p className="text-sm text-slate-500">
                    Only allow access from specified IP addresses or ranges
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={ipRestrictions.enabled}
                  onChange={(e) => setIpRestrictions(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-6 w-6 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {ipRestrictions.enabled && (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Warning</p>
                        <p className="text-sm text-amber-700">
                          Be careful when configuring IP restrictions. Incorrect settings may lock you out of the system.
                          Always ensure your current IP is in the allowed list.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Allowed IP Ranges
                        </Label>
                        <Button variant="outline" size="sm">Add Range</Button>
                      </div>
                      <div className="space-y-2">
                        {ipRestrictions.allowed_ranges.map((range, index) => (
                          <div key={index} className="flex items-center gap-2 rounded border bg-green-50 p-2">
                            <code className="flex-1 text-sm">{range}</code>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Ban className="h-4 w-4 text-red-500" />
                          Blocked IP Ranges
                        </Label>
                        <Button variant="outline" size="sm">Add Range</Button>
                      </div>
                      <div className="rounded border border-dashed p-4 text-center text-sm text-slate-500">
                        No blocked IP ranges configured
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Save Security Settings
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update the system security policies. These changes will affect all users.
              Make sure you have reviewed all settings carefully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
