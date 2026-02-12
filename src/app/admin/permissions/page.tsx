'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Save,
  RotateCcw,
  Check,
  X,
  Shield,
  AlertTriangle,
  Info,
  Filter,
  ChevronDown,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { MODULE_INFO, DEFAULT_ROLES, type ModuleName, type ActionType } from '@/lib/admin-types';

interface PermissionCell {
  module: ModuleName;
  action: ActionType;
  granted: boolean;
  is_sensitive: boolean;
  requires_mfa: boolean;
}

interface RolePermissions {
  role_id: string;
  role_name: string;
  role_code: string;
  role_level: number;
  role_color: string;
  permissions: PermissionCell[];
}

const ACTION_LABELS: Record<ActionType, { label: string; icon: string; description: string }> = {
  view: { label: 'View', icon: 'Eye', description: 'Can view and read data' },
  create: { label: 'Create', icon: 'Plus', description: 'Can create new records' },
  update: { label: 'Update', icon: 'Edit', description: 'Can modify existing records' },
  delete: { label: 'Delete', icon: 'Trash', description: 'Can delete records' },
  approve: { label: 'Approve', icon: 'Check', description: 'Can approve or reject items' },
  export: { label: 'Export', icon: 'Download', description: 'Can export data' },
  import: { label: 'Import', icon: 'Upload', description: 'Can import data' },
  assign: { label: 'Assign', icon: 'UserPlus', description: 'Can assign items to users' },
  escalate: { label: 'Escalate', icon: 'ArrowUp', description: 'Can escalate issues' },
  configure: { label: 'Configure', icon: 'Settings', description: 'Can modify settings' },
  audit: { label: 'Audit', icon: 'FileText', description: 'Can view audit logs' },
  manage: { label: 'Manage', icon: 'Cog', description: 'Full management access' },
};

const CATEGORY_LABELS = {
  core: { label: 'Core Modules', color: 'bg-blue-500' },
  operations: { label: 'Operations', color: 'bg-green-500' },
  admin: { label: 'Administration', color: 'bg-orange-500' },
  system: { label: 'System', color: 'bg-red-500' },
};

export default function PermissionMatrixPage() {
  const { toast } = useToast();
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['core', 'operations', 'admin', 'system']);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);

    // Generate permission matrix for each role
    const matrix: RolePermissions[] = DEFAULT_ROLES.map((role, index) => {
      const permissions: PermissionCell[] = [];

      MODULE_INFO.forEach(module => {
        module.available_actions.forEach(action => {
          // Simulate granted permissions based on role level
          const baseGranted = (role.level || 1) >= getRequiredLevel(module.name, action);

          permissions.push({
            module: module.name,
            action: action,
            granted: baseGranted,
            is_sensitive: module.is_sensitive,
            requires_mfa: action === 'delete' || action === 'export',
          });
        });
      });

      return {
        role_id: `role-${index + 1}`,
        role_name: role.name || '',
        role_code: role.code || '',
        role_level: role.level || 1,
        role_color: role.color || '#64748b',
        permissions,
      };
    });

    setRolePermissions(matrix);
    if (matrix.length > 0) {
      setSelectedRoleId(matrix[0].role_id);
    }
    setLoading(false);
  };

  const getRequiredLevel = (module: ModuleName, action: ActionType): number => {
    // Define minimum required level for each action type
    const actionLevels: Record<ActionType, number> = {
      view: 1,
      create: 2,
      update: 3,
      delete: 5,
      approve: 4,
      export: 3,
      import: 4,
      assign: 4,
      escalate: 3,
      configure: 7,
      audit: 5,
      manage: 7,
    };

    // Sensitive modules require higher levels
    const moduleInfo = MODULE_INFO.find(m => m.name === module);
    const baseLevel = actionLevels[action] || 1;

    if (moduleInfo?.is_sensitive) {
      return Math.min(baseLevel + 2, 10);
    }

    if (moduleInfo?.category === 'admin' || moduleInfo?.category === 'system') {
      return Math.min(baseLevel + 1, 10);
    }

    return baseLevel;
  };

  const selectedRole = rolePermissions.find(r => r.role_id === selectedRoleId);

  const togglePermission = (module: ModuleName, action: ActionType) => {
    if (!selectedRoleId) return;

    setRolePermissions(prev => prev.map(role => {
      if (role.role_id !== selectedRoleId) return role;

      return {
        ...role,
        permissions: role.permissions.map(p => {
          if (p.module === module && p.action === action) {
            return { ...p, granted: !p.granted };
          }
          return p;
        }),
      };
    }));
    setHasChanges(true);
  };

  const toggleAllModulePermissions = (module: ModuleName, grant: boolean) => {
    if (!selectedRoleId) return;

    setRolePermissions(prev => prev.map(role => {
      if (role.role_id !== selectedRoleId) return role;

      return {
        ...role,
        permissions: role.permissions.map(p => {
          if (p.module === module) {
            return { ...p, granted: grant };
          }
          return p;
        }),
      };
    }));
    setHasChanges(true);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 500));

    toast({
      title: 'Permissions Saved',
      description: `Permissions for "${selectedRole?.role_name}" have been updated.`,
    });

    setHasChanges(false);
    setIsSaveDialogOpen(false);
  };

  const handleReset = () => {
    loadPermissions();
    setHasChanges(false);
    toast({
      title: 'Permissions Reset',
      description: 'All changes have been discarded.',
    });
  };

  const getModulesByCategory = (category: string) => {
    return MODULE_INFO.filter(m => m.category === category);
  };

  const getModulePermissions = (module: ModuleName) => {
    return selectedRole?.permissions.filter(p => p.module === module) || [];
  };

  const getGrantedCount = (module: ModuleName) => {
    const perms = getModulePermissions(module);
    return perms.filter(p => p.granted).length;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Permission Matrix</h1>
            <p className="text-slate-500">Configure granular permissions for each role</p>
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

        {/* Role Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Select Role to Configure
                </label>
                <div className="flex gap-2 flex-wrap">
                  {rolePermissions
                    .sort((a, b) => b.role_level - a.role_level)
                    .map(role => (
                      <Button
                        key={role.role_id}
                        variant={selectedRoleId === role.role_id ? 'default' : 'outline'}
                        size="sm"
                        className={selectedRoleId === role.role_id ? '' : 'border-2'}
                        style={selectedRoleId === role.role_id
                          ? { backgroundColor: role.role_color }
                          : { borderColor: role.role_color, color: role.role_color }
                        }
                        onClick={() => setSelectedRoleId(role.role_id)}
                      >
                        <Shield className="mr-1 h-3 w-3" />
                        {role.role_name}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          L{role.role_level}
                        </Badge>
                      </Button>
                    ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Filter by Category
                </label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="core">Core Modules</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="admin">Administration</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-emerald-500" />
            <span>Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-200" />
            <span>Not Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span>Requires MFA</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>Sensitive</span>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="space-y-4">
          {Object.entries(CATEGORY_LABELS)
            .filter(([category]) => filterCategory === 'all' || filterCategory === category)
            .map(([category, { label, color }]) => {
              const modules = getModulesByCategory(category);
              if (modules.length === 0) return null;

              const isExpanded = expandedCategories.includes(category);

              return (
                <Card key={category}>
                  <CardHeader
                    className="cursor-pointer py-3"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                        <div className={`h-3 w-3 rounded-full ${color}`} />
                        <CardTitle className="text-base">{label}</CardTitle>
                        <Badge variant="outline">{modules.length} modules</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {modules.map(module => {
                          const perms = getModulePermissions(module.name);
                          const grantedCount = getGrantedCount(module.name);
                          const totalCount = perms.length;
                          const allGranted = grantedCount === totalCount;
                          const noneGranted = grantedCount === 0;

                          return (
                            <div
                              key={module.name}
                              className="rounded-lg border border-slate-200 p-4"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-slate-900">
                                        {module.display_name}
                                      </h4>
                                      {module.is_sensitive && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Sensitive module - handle with care</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-500">{module.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-500">
                                    {grantedCount}/{totalCount}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleAllModulePermissions(module.name, !allGranted)}
                                  >
                                    {allGranted ? 'Revoke All' : 'Grant All'}
                                  </Button>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {perms.map(perm => {
                                  const actionInfo = ACTION_LABELS[perm.action];

                                  return (
                                    <Tooltip key={`${perm.module}-${perm.action}`}>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className={`
                                            flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium
                                            transition-all border-2
                                            ${perm.granted
                                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                            }
                                          `}
                                          onClick={() => togglePermission(perm.module, perm.action)}
                                        >
                                          {perm.granted ? (
                                            <Check className="h-3.5 w-3.5" />
                                          ) : (
                                            <X className="h-3.5 w-3.5" />
                                          )}
                                          {actionInfo.label}
                                          {perm.requires_mfa && (
                                            <Lock className="h-3 w-3 text-amber-500" />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="font-medium">{actionInfo.label}</p>
                                        <p className="text-xs text-slate-400">{actionInfo.description}</p>
                                        {perm.requires_mfa && (
                                          <p className="text-xs text-amber-400 mt-1">Requires MFA</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
        </div>

        {/* Summary Card */}
        {selectedRole && (
          <Card className="bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: selectedRole.role_color }}
                  >
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{selectedRole.role_name}</h3>
                    <p className="text-sm text-slate-500">Level {selectedRole.role_level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-slate-500">Total Permissions</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {selectedRole.permissions.filter(p => p.granted).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Sensitive</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedRole.permissions.filter(p => p.granted && p.is_sensitive).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">MFA Required</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedRole.permissions.filter(p => p.granted && p.requires_mfa).length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Confirmation Dialog */}
        <AlertDialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Permission Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to update permissions for "{selectedRole?.role_name}".
                This will affect all users with this role. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
              >
                Save Permissions
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
