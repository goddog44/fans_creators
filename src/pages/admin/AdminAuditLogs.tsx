import { useEffect, useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { auditService, userService } from '@/services';
import type { AuditLog, User } from '@/types';
import { formatDateTime } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    Promise.all([auditService.getAll(), userService.getAll()]).then(([l, u]) => {
      setLogs(l);
      const map: Record<string, User> = {};
      u.forEach((user) => { map[user.id] = user; });
      setUsers(map);
      setLoading(false);
    });
  }, []);

  const actions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((l) => {
    const matchQuery = !query || l.action.toLowerCase().includes(query.toLowerCase()) || l.entity.toLowerCase().includes(query.toLowerCase()) || l.entityId.includes(query);
    const matchAction = filterAction === 'ALL' || l.action === filterAction;
    return matchQuery && matchAction;
  });

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Audit Logs" subtitle="System activity and change history" />

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search logs..." className="pl-10" />
        </div>
        <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-auto">
          <option value="ALL">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </Select>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState icon={<FileText className="w-8 h-8" />} title="No audit logs found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'id', label: 'ID', render: (l: AuditLog) => <span className="text-xs font-mono text-ink-500">{l.id}</span> },
              { key: 'actor', label: 'Actor', render: (l: AuditLog) => (
                <div className="flex items-center gap-2">
                  <Avatar src={users[l.actorId]?.avatar || ''} size="xs" />
                  <span className="text-sm font-medium">{users[l.actorId]?.name || l.actorId}</span>
                </div>
              )},
              { key: 'action', label: 'Action', render: (l: AuditLog) => <span className="text-sm font-semibold">{l.action.replace(/_/g, ' ')}</span> },
              { key: 'entity', label: 'Entity', render: (l: AuditLog) => <span className="text-sm">{l.entity}</span> },
              { key: 'entityId', label: 'Entity ID', render: (l: AuditLog) => <span className="text-xs font-mono text-ink-500">{l.entityId}</span> },
              { key: 'ip', label: 'IP', render: (l: AuditLog) => <span className="text-xs text-ink-500">{l.ip}</span> },
              { key: 'date', label: 'Date', render: (l: AuditLog) => <span className="text-sm text-ink-500">{formatDateTime(l.createdAt)}</span> },
            ]}
            data={filtered}
            rowKey={(l) => l.id}
          />
        </Card>
      )}
    </DashboardShell>
  );
}
