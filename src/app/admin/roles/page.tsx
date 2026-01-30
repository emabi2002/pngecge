'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Key,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Search,
  MoreVertical,
  Copy,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { DEFAULT_ROLES, type Role, type RoleLevel } from '@/lib/admin-types';

interface RoleWithStats {
  id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  is_system_role: boolean;
  is_active: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  user_count: number;
  permission_count: number;
}

const ROLE_COLORS = [
  { value: '#dc2626', label: 'Red' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#ca8a04', label: 'Yellow' },
  { value: '#16a34a', label: 'Green' },
  { value: '#0891b2', label: 'Cyan' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#db2777', label: 'Pink' },
  { value: '#64748b', label: 'Slate' },
];

const ROLE_ICONS = [
  'Shield', 'ShieldAlert', 'ShieldCheck', 'User', 'UserCog', 'UserCheck', 'Users', 'Key', 'Lock', 'Eye', 'Edit'
];

export default function RoleManagementPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithStats | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    level: 1,
    color: '#64748b',
    icon: 'User',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    // Simulated data - replace with actual API calls
    const mockRoles: RoleWithStats[] = DEFAULT_ROLES.map((role, index) => ({
      id: `role-${index + 1}`,
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      level: role.level || 1,
      is_system_role: role.is_system_role || false,
      is_active: true,
      color: role.color || '#64748b',
      icon: role.icon || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_count: Math.floor(Math.random() * 200) + 1,
      permission_count: Math.floor(Math.random() * 50) + 10,
    }));
    setRoles(mockRoles);
    setLoading(false);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name || !formData.code) {
      toast({
        title: 'Validation Error',
        description: 'Name and code are required.',
        variant: 'destructive',
      });
      return;
    }

    const newRole: RoleWithStats = {
      id: `role-${Date.now()}`,
      name: formData.name,
      code: formData.code,
      description: formData.description,
      level: formData.level,
      color: formData.color,
      icon: formData.icon,
      is_system_role: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_count: 0,
      permission_count: 0,
    };

    setRoles([...roles, newRole]);
    setIsCreateDialogOpen(false);
    resetForm();

    toast({
      title: 'Role Created',
      description: `Role "${formData.name}" has been created successfully.`,
    });
  };

  const handleEdit = async () => {
    if (!selectedRole) return;

    const updatedRoles = roles.map(role =>
      role.id === selectedRole.id
        ? {
            ...role,
            name: formData.name,
            code: formData.code,
            description: formData.description,
            level: formData.level,
            color: formData.color,
            icon: formData.icon,
            updated_at: new Date().toISOString()
          }
        : role
    );

    setRoles(updatedRoles);
    setIsEditDialogOpen(false);
    setSelectedRole(null);
    resetForm();

    toast({
      title: 'Role Updated',
      description: `Role "${formData.name}" has been updated successfully.`,
    });
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    if (selectedRole.is_system_role) {
      toast({
        title: 'Cannot Delete',
        description: 'System roles cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    if ((selectedRole.user_count || 0) > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This role has ${selectedRole.user_count} assigned users. Reassign them first.`,
        variant: 'destructive',
      });
      return;
    }

    setRoles(roles.filter(role => role.id !== selectedRole.id));
    setIsDeleteDialogOpen(false);
    setSelectedRole(null);

    toast({
      title: 'Role Deleted',
      description: `Role "${selectedRole.name}" has been deleted.`,
    });
  };

  const openEditDialog = (role: RoleWithStats) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      level: role.level || 1,
      color: role.color || '#64748b',
      icon: role.icon || 'User',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (role: RoleWithStats) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (role: RoleWithStats) => {
    setSelectedRole(role);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      level: 1,
      color: '#64748b',
      icon: 'User',
    });
  };

  const duplicateRole = (role: RoleWithStats) => {
    setFormData({
      name: `${role.name} (Copy)`,
      code: `${role.code}_copy`,
      description: role.description || '',
      level: role.level || 1,
      color: role.color || '#64748b',
      icon: role.icon || 'User',
    });
    setIsCreateDialogOpen(true);
  };

  const getLevelLabel = (level: number) => {
    if (level >= 9) return 'Administrator';
    if (level >= 7) return 'Manager';
    if (level >= 5) return 'Supervisor';
    if (level >= 3) return 'Officer';
    return 'Basic';
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
          <h1 className="text-2xl font-bold text-slate-900">Role Management</h1>
          <p className="text-slate-500">Define roles and their access levels</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search roles..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="admin">Administrator (9-10)</SelectItem>
                <SelectItem value="manager">Manager (7-8)</SelectItem>
                <SelectItem value="supervisor">Supervisor (5-6)</SelectItem>
                <SelectItem value="officer">Officer (3-4)</SelectItem>
                <SelectItem value="basic">Basic (1-2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Role Hierarchy Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>Visual representation of role levels and authority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2">
            {filteredRoles
              .sort((a, b) => (b.level || 0) - (a.level || 0))
              .map((role) => (
                <div
                  key={role.id}
                  className="flex flex-col items-center"
                  style={{ flex: 1 }}
                >
                  <div
                    className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: role.color,
                      height: `${(role.level || 1) * 20}px`,
                    }}
                    onClick={() => openViewDialog(role)}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-slate-700 truncate max-w-[80px]">
                      {role.name?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-slate-500">L{role.level}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoles
          .sort((a, b) => (b.level || 0) - (a.level || 0))
          .map((role) => (
            <Card key={role.id} className="relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: role.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${role.color}20` }}
                    >
                      <Shield className="h-5 w-5" style={{ color: role.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {role.code}
                        </Badge>
                        {role.is_system_role && (
                          <Badge className="bg-slate-100 text-slate-600 text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewDialog(role)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(role)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateRole(role)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => openDeleteDialog(role)}
                        disabled={role.is_system_role}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {role.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{role.user_count} users</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Key className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{role.permission_count} permissions</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    style={{ borderColor: role.color, color: role.color }}
                  >
                    Level {role.level}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Create/Edit Role Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedRole(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Update the role configuration and permissions.'
                : 'Define a new role with specific access levels.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Provincial Manager"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Role Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="e.g., provincial_manager"
                  disabled={isEditDialogOpen && selectedRole?.is_system_role}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role's responsibilities and access..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Authority Level (1-10)</Label>
                <Select
                  value={formData.level.toString()}
                  onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level} - {getLevelLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role Color</Label>
                <div className="flex gap-1 flex-wrap">
                  {ROLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-8 w-8 rounded-full transition-all ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-slate-400'
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={isEditDialogOpen ? handleEdit : handleCreate}
            >
              {isEditDialogOpen ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Role Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${selectedRole?.color}20` }}
              >
                <Shield className="h-5 w-5" style={{ color: selectedRole?.color }} />
              </div>
              {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>{selectedRole?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500">Authority Level</p>
                  <p className="text-2xl font-bold">{selectedRole?.level}</p>
                  <p className="text-xs text-slate-400">{getLevelLabel(selectedRole?.level || 1)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500">Users Assigned</p>
                  <p className="text-2xl font-bold">{selectedRole?.user_count}</p>
                  <p className="text-xs text-slate-400">Active users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500">Permissions</p>
                  <p className="text-2xl font-bold">{selectedRole?.permission_count}</p>
                  <p className="text-xs text-slate-400">Granted permissions</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="font-medium mb-2">Role Properties</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Code</span>
                  <code className="bg-slate-100 px-2 py-0.5 rounded">{selectedRole?.code}</code>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">System Role</span>
                  <span>{selectedRole?.is_system_role ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Status</span>
                  <Badge variant={selectedRole?.is_active ? 'default' : 'secondary'}>
                    {selectedRole?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(selectedRole?.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedRole) openEditDialog(selectedRole);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
              {(selectedRole?.user_count || 0) > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This role has {selectedRole?.user_count} users assigned.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
