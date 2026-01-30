'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Shield,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Key,
  Building,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  getAdminUsers,
  getRoles,
  createAdminUser,
  updateAdminUser,
  updateUserStatus,
  deleteAdminUser,
  type AdminUser as AdminUserType,
  type Role,
} from '@/lib/admin-service';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  national_id?: string;
  role_id: string;
  role_name: string;
  role_color: string;
  clearance_level: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval' | 'locked';
  is_active: boolean;
  mfa_enabled: boolean;
  assigned_province?: string;
  assigned_district?: string;
  department?: string;
  position?: string;
  last_login_at?: string;
  created_at: string;
  created_by?: string;
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-slate-100 text-slate-700', icon: XCircle },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: Lock },
  pending_approval: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  locked: { label: 'Locked', color: 'bg-red-100 text-red-700', icon: Lock },
};

const MOCK_ROLES = [
  { id: 'role-1', name: 'Super Administrator', code: 'super_admin', level: 10, color: '#dc2626' },
  { id: 'role-2', name: 'National Administrator', code: 'national_admin', level: 9, color: '#ea580c' },
  { id: 'role-3', name: 'Provincial Administrator', code: 'provincial_admin', level: 7, color: '#ca8a04' },
  { id: 'role-4', name: 'District Administrator', code: 'district_admin', level: 5, color: '#16a34a' },
  { id: 'role-5', name: 'Ward Supervisor', code: 'ward_supervisor', level: 4, color: '#0891b2' },
  { id: 'role-6', name: 'Registration Officer', code: 'registration_officer', level: 2, color: '#2563eb' },
  { id: 'role-7', name: 'Data Entry Operator', code: 'data_entry', level: 1, color: '#7c3aed' },
  { id: 'role-8', name: 'Auditor', code: 'auditor', level: 3, color: '#db2777' },
  { id: 'role-9', name: 'Viewer', code: 'viewer', level: 1, color: '#64748b' },
];

const MOCK_PROVINCES = [
  { id: 'prov-1', name: 'National Capital District' },
  { id: 'prov-2', name: 'Central Province' },
  { id: 'prov-3', name: 'Eastern Highlands' },
  { id: 'prov-4', name: 'Western Highlands' },
  { id: 'prov-5', name: 'Morobe Province' },
  { id: 'prov-6', name: 'East Sepik' },
];

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [statusAction, setStatusAction] = useState<'approve' | 'suspend' | 'activate' | 'lock' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    employee_id: '',
    national_id: '',
    role_id: '',
    clearance_level: 1,
    assigned_province: '',
    assigned_district: '',
    department: '',
    position: '',
    notes: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Try to load from Supabase
      const [usersData, rolesData] = await Promise.all([
        getAdminUsers(),
        getRoles(),
      ]);
      
      // Map users to include role info
      const mappedUsers: AdminUser[] = usersData.map((user: AdminUserType) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        employee_id: user.employee_id,
        national_id: user.national_id,
        role_id: user.role_id || "",
        role_name: user.role?.name || "No Role",
        role_color: user.role?.color || "#64748b",
        clearance_level: user.clearance_level,
        status: user.status,
        is_active: user.is_active,
        mfa_enabled: user.mfa_enabled,
        assigned_province: "",
        department: user.department,
        position: user.position,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
      }));
      
      setRoles(rolesData);
      if (mappedUsers.length > 0) {
        setUsers(mappedUsers);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error loading users from Supabase:", error);
    }
    // Fallback to mock data

    setLoading(true);
    // Simulated data
    const mockUsers: AdminUser[] = [
      {
        id: 'user-1',
        email: 'admin@pngec.gov.pg',
        full_name: 'John Kewa',
        phone: '+675 7123 4567',
        employee_id: 'EMP001',
        role_id: 'role-2',
        role_name: 'National Administrator',
        role_color: '#ea580c',
        clearance_level: 9,
        status: 'active',
        is_active: true,
        mfa_enabled: true,
        department: 'IT Department',
        position: 'System Administrator',
        last_login_at: new Date().toISOString(),
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'user-2',
        email: 'mary.tani@pngec.gov.pg',
        full_name: 'Mary Tani',
        phone: '+675 7234 5678',
        employee_id: 'EMP002',
        role_id: 'role-3',
        role_name: 'Provincial Administrator',
        role_color: '#ca8a04',
        clearance_level: 7,
        status: 'active',
        is_active: true,
        mfa_enabled: true,
        assigned_province: 'National Capital District',
        department: 'Electoral Operations',
        position: 'Provincial Electoral Manager',
        last_login_at: new Date(Date.now() - 3600000).toISOString(),
        created_at: '2024-02-20T10:00:00Z',
      },
      {
        id: 'user-3',
        email: 'peter.wai@pngec.gov.pg',
        full_name: 'Peter Wai',
        phone: '+675 7345 6789',
        employee_id: 'EMP003',
        role_id: 'role-6',
        role_name: 'Registration Officer',
        role_color: '#2563eb',
        clearance_level: 2,
        status: 'pending_approval',
        is_active: false,
        mfa_enabled: false,
        assigned_province: 'Eastern Highlands',
        department: 'Field Operations',
        position: 'Registration Officer',
        created_at: '2024-06-01T10:00:00Z',
      },
      {
        id: 'user-4',
        email: 'anna.kila@pngec.gov.pg',
        full_name: 'Anna Kila',
        phone: '+675 7456 7890',
        employee_id: 'EMP004',
        role_id: 'role-5',
        role_name: 'Ward Supervisor',
        role_color: '#0891b2',
        clearance_level: 4,
        status: 'suspended',
        is_active: false,
        mfa_enabled: true,
        assigned_province: 'Morobe Province',
        department: 'Field Operations',
        position: 'Ward Supervisor',
        last_login_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        created_at: '2024-03-10T10:00:00Z',
      },
      {
        id: 'user-5',
        email: 'james.nao@pngec.gov.pg',
        full_name: 'James Nao',
        phone: '+675 7567 8901',
        employee_id: 'EMP005',
        role_id: 'role-6',
        role_name: 'Registration Officer',
        role_color: '#2563eb',
        clearance_level: 2,
        status: 'active',
        is_active: true,
        mfa_enabled: false,
        assigned_province: 'Western Highlands',
        department: 'Field Operations',
        position: 'Registration Officer',
        last_login_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: '2024-04-05T10:00:00Z',
      },
    ];
    setUsers(mockUsers);
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role_id === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingCount = users.filter(u => u.status === 'pending_approval').length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      employee_id: '',
      national_id: '',
      role_id: '',
      clearance_level: 1,
      assigned_province: '',
      assigned_district: '',
      department: '',
      position: '',
      notes: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.full_name || !formData.role_id) {
      toast({
        title: 'Validation Error',
        description: 'Email, full name, and role are required.',
        variant: 'destructive',
      });
      return;
    }

    const role = MOCK_ROLES.find(r => r.id === formData.role_id);
    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      email: formData.email,
      full_name: formData.full_name,
      phone: formData.phone,
      employee_id: formData.employee_id,
      national_id: formData.national_id,
      role_id: formData.role_id,
      role_name: role?.name || '',
      role_color: role?.color || '#64748b',
      clearance_level: formData.clearance_level,
      status: 'pending_approval',
      is_active: false,
      mfa_enabled: false,
      assigned_province: formData.assigned_province,
      assigned_district: formData.assigned_district,
      department: formData.department,
      position: formData.position,
      created_at: new Date().toISOString(),
    };

    setUsers([...users, newUser]);
    setIsCreateDialogOpen(false);
    resetForm();

    toast({
      title: 'User Created',
      description: `User "${formData.full_name}" has been created and is pending approval.`,
    });
  };

  const handleEdit = async () => {
    if (!selectedUser) return;

    const role = MOCK_ROLES.find(r => r.id === formData.role_id);
    const updatedUsers = users.map(user =>
      user.id === selectedUser.id
        ? {
            ...user,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone,
            employee_id: formData.employee_id,
            national_id: formData.national_id,
            role_id: formData.role_id,
            role_name: role?.name || user.role_name,
            role_color: role?.color || user.role_color,
            clearance_level: formData.clearance_level,
            assigned_province: formData.assigned_province,
            assigned_district: formData.assigned_district,
            department: formData.department,
            position: formData.position,
          }
        : user
    );

    setUsers(updatedUsers);
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();

    toast({
      title: 'User Updated',
      description: `User "${formData.full_name}" has been updated.`,
    });
  };

  const handleStatusChange = async () => {
    if (!selectedUser || !statusAction) return;

    let newStatus: AdminUser['status'] = selectedUser.status;
    let message = '';

    switch (statusAction) {
      case 'approve':
        newStatus = 'active';
        message = `User "${selectedUser.full_name}" has been approved and activated.`;
        break;
      case 'suspend':
        newStatus = 'suspended';
        message = `User "${selectedUser.full_name}" has been suspended.`;
        break;
      case 'activate':
        newStatus = 'active';
        message = `User "${selectedUser.full_name}" has been activated.`;
        break;
      case 'lock':
        newStatus = 'locked';
        message = `User "${selectedUser.full_name}" has been locked.`;
        break;
    }

    const updatedUsers = users.map(user =>
      user.id === selectedUser.id
        ? { ...user, status: newStatus, is_active: newStatus === 'active' }
        : user
    );

    setUsers(updatedUsers);
    setIsStatusDialogOpen(false);
    setSelectedUser(null);
    setStatusAction(null);

    toast({
      title: 'Status Updated',
      description: message,
    });
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setUsers(users.filter(user => user.id !== selectedUser.id));
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);

    toast({
      title: 'User Deleted',
      description: `User "${selectedUser.full_name}" has been deleted.`,
    });
  };

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || '',
      employee_id: user.employee_id || '',
      national_id: user.national_id || '',
      role_id: user.role_id,
      clearance_level: user.clearance_level,
      assigned_province: user.assigned_province || '',
      assigned_district: user.assigned_district || '',
      department: user.department || '',
      position: user.position || '',
      notes: '',
    });
    setIsEditDialogOpen(true);
  };

  const openStatusDialog = (user: AdminUser, action: 'approve' | 'suspend' | 'activate' | 'lock') => {
    setSelectedUser(user);
    setStatusAction(action);
    setIsStatusDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">Manage system users, roles, and access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-amber-200 bg-amber-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{suspendedCount}</p>
              </div>
              <UserX className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, email, or employee ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_approval">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {MOCK_ROLES.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadUsers}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">MFA</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map(user => {
                  const StatusIcon = STATUS_CONFIG[user.status].icon;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback style={{ backgroundColor: `${user.role_color}20`, color: user.role_color }}>
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-900">{user.full_name}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                            {user.employee_id && (
                              <p className="text-xs text-slate-400">ID: {user.employee_id}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: user.role_color }}
                          />
                          <span className="text-sm">{user.role_name}</span>
                        </div>
                        <p className="text-xs text-slate-400">Level {user.clearance_level}</p>
                      </td>
                      <td className="px-4 py-3">
                        {user.assigned_province ? (
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <MapPin className="h-3 w-3" />
                            {user.assigned_province}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">National</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_CONFIG[user.status].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {STATUS_CONFIG[user.status].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {user.mfa_enabled ? (
                          <Badge className="bg-green-100 text-green-700">
                            <Shield className="mr-1 h-3 w-3" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400">
                            Disabled
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.last_login_at ? (
                          <span className="text-sm text-slate-600">
                            {formatRelativeTime(user.last_login_at)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setIsViewDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'pending_approval' && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => openStatusDialog(user, 'approve')}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Approve User
                              </DropdownMenuItem>
                            )}
                            {user.status === 'active' && (
                              <DropdownMenuItem
                                className="text-amber-600"
                                onClick={() => openStatusDialog(user, 'suspend')}
                              >
                                <Lock className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            {(user.status === 'suspended' || user.status === 'inactive') && (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => openStatusDialog(user, 'activate')}
                              >
                                <Unlock className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedUser(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Update user information and access settings.'
                : 'Add a new user to the system. They will need approval before access is granted.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="role">Role & Access</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="full_name"
                      className="pl-10"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Kewa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.kewa@pngec.gov.pg"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+675 7XXX XXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="employee_id"
                      className="pl-10"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="EMP001"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="department"
                      className="pl-10"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="IT Department"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="position"
                      className="pl-10"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="System Administrator"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="role" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="role">Assign Role *</Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => {
                    const role = MOCK_ROLES.find(r => r.id === value);
                    setFormData({
                      ...formData,
                      role_id: value,
                      clearance_level: role?.level || 1,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_ROLES.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          {role.name}
                          <Badge variant="outline" className="ml-2">L{role.level}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clearance_level">Clearance Level</Label>
                <Select
                  value={formData.clearance_level.toString()}
                  onValueChange={(value) => setFormData({ ...formData, clearance_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Level {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Higher clearance levels grant access to more sensitive data.
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Role Assignment</p>
                    <p className="text-sm text-amber-700">
                      New users will be created with "Pending Approval" status.
                      An administrator must approve them before they can access the system.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="province">Assigned Province</Label>
                <Select
                  value={formData.assigned_province}
                  onValueChange={(value) => setFormData({ ...formData, assigned_province: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">National (All Provinces)</SelectItem>
                    {MOCK_PROVINCES.map(province => (
                      <SelectItem key={province.id} value={province.name}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Leave empty for national-level access to all provinces.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this user..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
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
              {isEditDialogOpen ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback
                  style={{
                    backgroundColor: `${selectedUser?.role_color}20`,
                    color: selectedUser?.role_color
                  }}
                >
                  {selectedUser?.full_name ? getInitials(selectedUser.full_name) : '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedUser?.full_name}</p>
                <p className="text-sm font-normal text-slate-500">{selectedUser?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Role</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: selectedUser.role_color }}
                    />
                    <span className="font-medium">{selectedUser.role_name}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className={STATUS_CONFIG[selectedUser.status].color}>
                    {STATUS_CONFIG[selectedUser.status].label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Clearance Level</p>
                  <p className="font-medium">Level {selectedUser.clearance_level}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">MFA Status</p>
                  <p className="font-medium">{selectedUser.mfa_enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              {selectedUser.assigned_province && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Assigned Location</p>
                  <p className="font-medium">{selectedUser.assigned_province}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Employee ID</p>
                  <p className="font-medium">{selectedUser.employee_id || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Department</p>
                  <p className="font-medium">{selectedUser.department || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Position</p>
                  <p className="font-medium">{selectedUser.position || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Last Login</p>
                  <p className="font-medium">
                    {selectedUser.last_login_at
                      ? formatRelativeTime(selectedUser.last_login_at)
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedUser) openEditDialog(selectedUser);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction === 'approve' && 'Approve User'}
              {statusAction === 'suspend' && 'Suspend User'}
              {statusAction === 'activate' && 'Activate User'}
              {statusAction === 'lock' && 'Lock User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction === 'approve' && (
                <>Are you sure you want to approve "{selectedUser?.full_name}"? They will gain access to the system based on their assigned role.</>
              )}
              {statusAction === 'suspend' && (
                <>Are you sure you want to suspend "{selectedUser?.full_name}"? They will immediately lose access to the system.</>
              )}
              {statusAction === 'activate' && (
                <>Are you sure you want to activate "{selectedUser?.full_name}"? They will regain access to the system.</>
              )}
              {statusAction === 'lock' && (
                <>Are you sure you want to lock "{selectedUser?.full_name}"? They will be locked out until an administrator unlocks them.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                statusAction === 'approve' || statusAction === 'activate'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
              onClick={handleStatusChange}
            >
              {statusAction === 'approve' && 'Approve'}
              {statusAction === 'suspend' && 'Suspend'}
              {statusAction === 'activate' && 'Activate'}
              {statusAction === 'lock' && 'Lock'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUser?.full_name}"? This action cannot be undone.
              All associated data including audit logs will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
