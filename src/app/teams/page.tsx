'use client';

import { UsersRound, MapPin, Tablet, Calendar, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const teams = [
  { id: 'TEAM-EHP-001', name: 'Eastern Highlands Team Alpha', leader: 'Tom Wari', members: 12, devices: 8, ward: 'Goroka District', status: 'active', registrations: 4521 },
  { id: 'TEAM-WHP-001', name: 'Western Highlands Team Bravo', leader: 'Lucy Kuman', members: 10, devices: 6, ward: 'Hagen District', status: 'active', registrations: 3892 },
  { id: 'TEAM-NCD-001', name: 'NCD Metro Team', leader: 'Janet Ravu', members: 15, devices: 12, ward: 'Moresby Districts', status: 'active', registrations: 6234 },
  { id: 'TEAM-ESP-001', name: 'East Sepik Coastal Team', leader: 'David Sana', members: 8, devices: 5, ward: 'Wewak District', status: 'on_break', registrations: 2341 },
];

export default function FieldTeamsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Field Teams</h2>
          <p className="text-sm text-slate-500">Manage registration teams and field operations</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="h-4 w-4" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Teams</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{teams.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{teams.filter(t => t.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Members</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{teams.reduce((sum, t) => sum + t.members, 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Registrations</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{teams.reduce((sum, t) => sum + t.registrations, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{team.name}</h3>
                  <p className="font-mono text-xs text-slate-500">{team.id}</p>
                </div>
                <Badge className={team.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}>
                  {team.status === 'active' ? 'Active' : 'On Break'}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-slate-400" />
                  <span>{team.members} members</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tablet className="h-4 w-4 text-slate-400" />
                  <span>{team.devices} devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{team.ward}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{team.registrations.toLocaleString()} regs</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">Team Leader: {team.leader}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
