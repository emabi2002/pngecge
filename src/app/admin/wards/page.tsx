'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronRight,
  ChevronDown,
  Building,
  Map,
  Users,
  MoreVertical,
  Eye,
  FolderTree,
  Globe,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

type GeoLevel = 'national' | 'regional' | 'provincial' | 'district' | 'llg' | 'ward';

interface GeographicUnit {
  id: string;
  code: string;
  name: string;
  level: GeoLevel;
  parent_id?: string;
  parent_name?: string;
  population?: number;
  registered_voters: number;
  is_active: boolean;
  children_count: number;
  created_at: string;
}

const LEVEL_CONFIG: Record<GeoLevel, { label: string; color: string; icon: typeof Globe; plural: string }> = {
  national: { label: 'National', color: 'bg-red-100 text-red-700', icon: Globe, plural: 'National' },
  regional: { label: 'Region', color: 'bg-orange-100 text-orange-700', icon: Map, plural: 'Regions' },
  provincial: { label: 'Province', color: 'bg-amber-100 text-amber-700', icon: Building, plural: 'Provinces' },
  district: { label: 'District', color: 'bg-green-100 text-green-700', icon: Layers, plural: 'Districts' },
  llg: { label: 'LLG', color: 'bg-blue-100 text-blue-700', icon: FolderTree, plural: 'LLGs' },
  ward: { label: 'Ward', color: 'bg-purple-100 text-purple-700', icon: MapPin, plural: 'Wards' },
};

const LEVEL_HIERARCHY: GeoLevel[] = ['national', 'regional', 'provincial', 'district', 'llg', 'ward'];

// PNG Provinces data
const PNG_PROVINCES = [
  { code: 'NCD', name: 'National Capital District' },
  { code: 'CEN', name: 'Central Province' },
  { code: 'GUL', name: 'Gulf Province' },
  { code: 'WES', name: 'Western Province' },
  { code: 'MIL', name: 'Milne Bay Province' },
  { code: 'ORO', name: 'Oro Province' },
  { code: 'SHP', name: 'Southern Highlands Province' },
  { code: 'EHP', name: 'Eastern Highlands Province' },
  { code: 'WHP', name: 'Western Highlands Province' },
  { code: 'SIM', name: 'Simbu Province' },
  { code: 'ENG', name: 'Enga Province' },
  { code: 'JIW', name: 'Jiwaka Province' },
  { code: 'HEL', name: 'Hela Province' },
  { code: 'MOR', name: 'Morobe Province' },
  { code: 'MAD', name: 'Madang Province' },
  { code: 'ESP', name: 'East Sepik Province' },
  { code: 'WSP', name: 'West Sepik Province' },
  { code: 'MAN', name: 'Manus Province' },
  { code: 'NIR', name: 'New Ireland Province' },
  { code: 'ENB', name: 'East New Britain Province' },
  { code: 'WNB', name: 'West New Britain Province' },
  { code: 'BOU', name: 'Autonomous Region of Bougainville' },
];

export default function GeographicUnitsPage() {
  const { toast } = useToast();
  const [units, setUnits] = useState<GeographicUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [selectedParent, setSelectedParent] = useState<GeographicUnit | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<GeographicUnit | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    level: 'provincial' as GeoLevel,
    parent_id: '',
    population: 0,
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    setLoading(true);
    // Generate mock data based on PNG provinces
    const mockUnits: GeographicUnit[] = [];

    // Add provinces
    PNG_PROVINCES.forEach((prov, idx) => {
      const provinceId = `prov-${idx + 1}`;
      mockUnits.push({
        id: provinceId,
        code: prov.code,
        name: prov.name,
        level: 'provincial',
        population: Math.floor(Math.random() * 500000) + 100000,
        registered_voters: Math.floor(Math.random() * 200000) + 50000,
        is_active: true,
        children_count: Math.floor(Math.random() * 8) + 2,
        created_at: '2024-01-01T00:00:00Z',
      });

      // Add some districts for first few provinces
      if (idx < 5) {
        for (let d = 1; d <= 3; d++) {
          const districtId = `dist-${idx}-${d}`;
          mockUnits.push({
            id: districtId,
            code: `${prov.code}-D${d}`,
            name: `${prov.name.split(' ')[0]} District ${d}`,
            level: 'district',
            parent_id: provinceId,
            parent_name: prov.name,
            population: Math.floor(Math.random() * 100000) + 20000,
            registered_voters: Math.floor(Math.random() * 50000) + 10000,
            is_active: true,
            children_count: Math.floor(Math.random() * 10) + 5,
            created_at: '2024-01-01T00:00:00Z',
          });

          // Add LLGs
          if (d === 1) {
            for (let l = 1; l <= 2; l++) {
              const llgId = `llg-${idx}-${d}-${l}`;
              mockUnits.push({
                id: llgId,
                code: `${prov.code}-D${d}-L${l}`,
                name: `LLG ${l} of District ${d}`,
                level: 'llg',
                parent_id: districtId,
                parent_name: `${prov.name.split(' ')[0]} District ${d}`,
                population: Math.floor(Math.random() * 30000) + 5000,
                registered_voters: Math.floor(Math.random() * 15000) + 2000,
                is_active: true,
                children_count: Math.floor(Math.random() * 20) + 10,
                created_at: '2024-01-01T00:00:00Z',
              });
            }
          }
        }
      }
    });

    setUnits(mockUnits);
    setLoading(false);
  };

  const getUnitsByLevel = (level: GeoLevel) => units.filter(u => u.level === level);
  const getChildUnits = (parentId: string) => units.filter(u => u.parent_id === parentId);

  const filteredUnits = units.filter(unit => {
    const matchesSearch =
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || unit.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const stats = {
    provinces: getUnitsByLevel('provincial').length,
    districts: getUnitsByLevel('district').length,
    llgs: getUnitsByLevel('llg').length,
    wards: getUnitsByLevel('ward').length,
    totalVoters: units.reduce((sum, u) => sum + u.registered_voters, 0),
  };

  const toggleExpand = (unitId: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      level: 'provincial',
      parent_id: '',
      population: 0,
    });
    setSelectedParent(null);
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Code and name are required.',
        variant: 'destructive',
      });
      return;
    }

    const newUnit: GeographicUnit = {
      id: `unit-${Date.now()}`,
      code: formData.code,
      name: formData.name,
      level: formData.level,
      parent_id: formData.parent_id || undefined,
      parent_name: selectedParent?.name,
      population: formData.population,
      registered_voters: 0,
      is_active: true,
      children_count: 0,
      created_at: new Date().toISOString(),
    };

    setUnits([...units, newUnit]);
    setIsCreateDialogOpen(false);
    resetForm();

    toast({
      title: 'Geographic Unit Created',
      description: `${LEVEL_CONFIG[formData.level].label} "${formData.name}" has been created.`,
    });
  };

  const handleEdit = async () => {
    if (!selectedUnit) return;

    const updatedUnits = units.map(unit =>
      unit.id === selectedUnit.id
        ? {
            ...unit,
            code: formData.code,
            name: formData.name,
            population: formData.population,
          }
        : unit
    );

    setUnits(updatedUnits);
    setIsEditDialogOpen(false);
    setSelectedUnit(null);
    resetForm();

    toast({
      title: 'Geographic Unit Updated',
      description: `${LEVEL_CONFIG[selectedUnit.level].label} "${formData.name}" has been updated.`,
    });
  };

  const handleDelete = async () => {
    if (!selectedUnit) return;

    // Check for children
    const children = getChildUnits(selectedUnit.id);
    if (children.length > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This ${LEVEL_CONFIG[selectedUnit.level].label.toLowerCase()} has ${children.length} child units. Delete them first.`,
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
      return;
    }

    setUnits(units.filter(u => u.id !== selectedUnit.id));
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);

    toast({
      title: 'Geographic Unit Deleted',
      description: `${LEVEL_CONFIG[selectedUnit.level].label} "${selectedUnit.name}" has been deleted.`,
    });
  };

  const openCreateDialog = (parent?: GeographicUnit) => {
    resetForm();
    if (parent) {
      const parentLevelIdx = LEVEL_HIERARCHY.indexOf(parent.level);
      const childLevel = LEVEL_HIERARCHY[parentLevelIdx + 1] || 'ward';
      setFormData(prev => ({
        ...prev,
        level: childLevel as GeoLevel,
        parent_id: parent.id,
      }));
      setSelectedParent(parent);
    }
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (unit: GeographicUnit) => {
    setSelectedUnit(unit);
    setFormData({
      code: unit.code,
      name: unit.name,
      level: unit.level,
      parent_id: unit.parent_id || '',
      population: unit.population || 0,
    });
    setIsEditDialogOpen(true);
  };

  const renderUnitTree = (parentId?: string, depth: number = 0) => {
    const childUnits = parentId
      ? getChildUnits(parentId)
      : units.filter(u => u.level === 'provincial' && !u.parent_id);

    if (childUnits.length === 0) return null;

    return (
      <div className={depth > 0 ? 'ml-6 border-l border-slate-200 pl-4' : ''}>
        {childUnits.map(unit => {
          const LevelIcon = LEVEL_CONFIG[unit.level].icon;
          const isExpanded = expandedUnits.has(unit.id);
          const hasChildren = unit.children_count > 0 || getChildUnits(unit.id).length > 0;

          return (
            <div key={unit.id} className="mb-2">
              <div className="flex items-center justify-between rounded-lg border bg-white p-3 hover:border-emerald-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(unit.id)}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  ) : (
                    <div className="w-6" />
                  )}

                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${LEVEL_CONFIG[unit.level].color.split(' ')[0]}`}>
                    <LevelIcon className={`h-4 w-4 ${LEVEL_CONFIG[unit.level].color.split(' ')[1]}`} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{unit.name}</span>
                      <Badge variant="outline" className="text-xs">{unit.code}</Badge>
                      <Badge className={`text-xs ${LEVEL_CONFIG[unit.level].color}`}>
                        {LEVEL_CONFIG[unit.level].label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {unit.registered_voters.toLocaleString()} voters
                      </span>
                      {unit.children_count > 0 && (
                        <span>{unit.children_count} sub-units</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateDialog(unit)}
                    className="text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Child
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedUnit(unit);
                        setIsViewDialogOpen(true);
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(unit)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedUnit(unit);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {isExpanded && renderUnitTree(unit.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
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
          <h1 className="text-2xl font-bold text-slate-900">Geographic Units</h1>
          <p className="text-slate-500">Manage provinces, districts, LLGs, and wards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUnits}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => openCreateDialog()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Provinces</p>
                <p className="text-2xl font-bold text-amber-600">{stats.provinces}</p>
              </div>
              <Building className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Districts</p>
                <p className="text-2xl font-bold text-green-600">{stats.districts}</p>
              </div>
              <Layers className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">LLGs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.llgs}</p>
              </div>
              <FolderTree className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Wards</p>
                <p className="text-2xl font-bold text-purple-600">{stats.wards}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Voters</p>
                <p className="text-2xl font-bold">{(stats.totalVoters / 1000000).toFixed(2)}M</p>
              </div>
              <Users className="h-8 w-8 text-slate-400" />
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
                placeholder="Search by name or code..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="provincial">Provinces</SelectItem>
                <SelectItem value="district">Districts</SelectItem>
                <SelectItem value="llg">LLGs</SelectItem>
                <SelectItem value="ward">Wards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchical Tree View */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Hierarchy</CardTitle>
          <CardDescription>Click to expand and view sub-units</CardDescription>
        </CardHeader>
        <CardContent>
          {searchQuery || levelFilter !== 'all' ? (
            // Flat list when filtering
            <div className="space-y-2">
              {filteredUnits.map(unit => {
                const LevelIcon = LEVEL_CONFIG[unit.level].icon;
                return (
                  <div key={unit.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${LEVEL_CONFIG[unit.level].color.split(' ')[0]}`}>
                        <LevelIcon className={`h-4 w-4 ${LEVEL_CONFIG[unit.level].color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{unit.name}</span>
                          <Badge variant="outline" className="text-xs">{unit.code}</Badge>
                        </div>
                        {unit.parent_name && (
                          <p className="text-xs text-slate-500">Parent: {unit.parent_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={LEVEL_CONFIG[unit.level].color}>
                      {LEVEL_CONFIG[unit.level].label}
                    </Badge>
                  </div>
                );
              })}
              {filteredUnits.length === 0 && (
                <p className="text-center text-slate-500 py-8">No units found matching your criteria.</p>
              )}
            </div>
          ) : (
            // Tree view when not filtering
            renderUnitTree()
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedUnit(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Edit Geographic Unit' : 'Create Geographic Unit'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Update the geographic unit details.'
                : selectedParent
                  ? `Add a new ${LEVEL_CONFIG[formData.level].label.toLowerCase()} under ${selectedParent.name}.`
                  : 'Add a new geographic unit to the system.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!isEditDialogOpen && !selectedParent && (
              <div className="space-y-2">
                <Label>Unit Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value as GeoLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVEL_HIERARCHY.filter(l => l !== 'national' && l !== 'regional').map(level => (
                      <SelectItem key={level} value={level}>
                        {LEVEL_CONFIG[level].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedParent && (
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Parent Unit</p>
                <p className="font-medium">{selectedParent.name}</p>
                <Badge className={`mt-1 ${LEVEL_CONFIG[selectedParent.level].color}`}>
                  {LEVEL_CONFIG[selectedParent.level].label}
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Unit Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., NCD"
                  disabled={isEditDialogOpen}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="population">Population</Label>
                <Input
                  id="population"
                  type="number"
                  value={formData.population}
                  onChange={(e) => setFormData({ ...formData, population: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Unit Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., National Capital District"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={isEditDialogOpen ? handleEdit : handleCreate}
            >
              {isEditDialogOpen ? 'Save Changes' : 'Create Unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUnit?.name}</DialogTitle>
            <DialogDescription>Geographic unit details</DialogDescription>
          </DialogHeader>

          {selectedUnit && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Code</p>
                  <p className="font-medium">{selectedUnit.code}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Level</p>
                  <Badge className={LEVEL_CONFIG[selectedUnit.level].color}>
                    {LEVEL_CONFIG[selectedUnit.level].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Population</p>
                  <p className="font-medium">{selectedUnit.population?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Registered Voters</p>
                  <p className="font-medium">{selectedUnit.registered_voters.toLocaleString()}</p>
                </div>
                {selectedUnit.parent_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Parent</p>
                    <p className="font-medium">{selectedUnit.parent_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge variant={selectedUnit.is_active ? 'default' : 'secondary'}>
                    {selectedUnit.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Sub-units</p>
                  <p className="font-medium">{selectedUnit.children_count}</p>
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
                if (selectedUnit) openEditDialog(selectedUnit);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Geographic Unit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUnit?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
