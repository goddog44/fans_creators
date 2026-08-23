import { useEffect, useState } from 'react';
import { Search, Eye, Check, X, AlertTriangle } from 'lucide-react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader, StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/ui/Card';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { reportService, userService } from '@/services';
import type { Report, User, ReportStatus } from '@/types';
import { formatDateTime } from '@/lib/format';
import { adminNavItems } from '@/lib/nav';

export function AdminReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selected, setSelected] = useState<Report | null>(null);
  const [action, setAction] = useState<{ type: string; report: Report } | null>(null);

  useEffect(() => {
    Promise.all([reportService.getAll(), userService.getAll()]).then(([r, u]) => {
      setReports(r);
      const map: Record<string, User> = {};
      u.forEach((user) => { map[user.id] = user; });
      setUsers(map);
      setLoading(false);
    });
  }, []);

  const handleAction = async () => {
    if (!action) return;
    const newStatus: ReportStatus = action.type === 'resolve' ? 'RESOLVED' : action.type === 'review' ? 'UNDER_REVIEW' : 'REJECTED';
    await reportService.setStatus(action.report.id, newStatus);
    setReports((prev) => prev.map((r) => (r.id === action.report.id ? { ...r, status: newStatus } : r)));
    toast(`Report ${action.type}d`);
    setAction(null);
  };

  const filtered = reports.filter((r) => {
    const matchQuery = !query || r.description.toLowerCase().includes(query.toLowerCase()) || r.reason.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const openCount = reports.filter((r) => r.status === 'OPEN').length;
  const reviewCount = reports.filter((r) => r.status === 'UNDER_REVIEW').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <DashboardShell navItems={adminNavItems} brandColor="ink">
      <PageHeader title="Reports" subtitle="Handle user reports and complaints" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open" value={openCount} icon={<AlertTriangle className="w-5 h-5" />} tone="warning" />
        <StatCard label="Under Review" value={reviewCount} icon={<Eye className="w-5 h-5" />} tone="accent" />
        <StatCard label="Resolved" value={resolvedCount} icon={<Check className="w-5 h-5" />} tone="success" />
        <StatCard label="Total" value={reports.length} icon={<AlertTriangle className="w-5 h-5" />} tone="neutral" />
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reports..." className="pl-10" />
        </div>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-auto">
          <option value="ALL">All Statuses</option><option value="OPEN">Open</option><option value="UNDER_REVIEW">Under Review</option><option value="RESOLVED">Resolved</option><option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {loading ? <LoadingState /> : filtered.length === 0 ? <EmptyState title="No reports found" /> : (
        <Card>
          <Table
            columns={[
              { key: 'id', label: 'ID', render: (r: Report) => <span className="text-xs font-mono text-ink-500">{r.id}</span> },
              { key: 'reporter', label: 'Reporter', render: (r: Report) => <span className="text-sm font-medium">{users[r.reporterId]?.name || '—'}</span> },
              { key: 'entity', label: 'Entity', render: (r: Report) => <Badge tone="neutral">{r.entityType}</Badge> },
              { key: 'reason', label: 'Reason', render: (r: Report) => <span className="text-sm">{r.reason.replace(/_/g, ' ')}</span> },
              { key: 'status', label: 'Status', render: (r: Report) => <StatusBadge status={r.status} /> },
              { key: 'date', label: 'Date', render: (r: Report) => <span className="text-sm text-ink-500">{formatDateTime(r.createdAt)}</span> },
              { key: 'actions', label: 'Actions', render: (r: Report) => (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(r)}><Eye className="w-3.5 h-3.5" /></Button>
                  {r.status === 'OPEN' && <Button size="sm" variant="ghost" className="text-accent-600" onClick={() => setAction({ type: 'review', report: r })}><Eye className="w-3.5 h-3.5" /></Button>}
                  {r.status !== 'RESOLVED' && <Button size="sm" variant="ghost" className="text-success-600" onClick={() => setAction({ type: 'resolve', report: r })}><Check className="w-3.5 h-3.5" /></Button>}
                  {r.status !== 'REJECTED' && <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => setAction({ type: 'reject', report: r })}><X className="w-3.5 h-3.5" /></Button>}
                </div>
              )},
            ]}
            data={filtered}
            rowKey={(r) => r.id}
          />
        </Card>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Report Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-ink-500">ID</span><span className="text-sm font-mono">{selected.id}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Reporter</span><span className="text-sm font-semibold">{users[selected.reporterId]?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Entity Type</span><Badge tone="neutral">{selected.entityType}</Badge></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Entity ID</span><span className="text-sm font-mono">{selected.entityId}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Reason</span><span className="text-sm font-semibold">{selected.reason.replace(/_/g, ' ')}</span></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Status</span><StatusBadge status={selected.status} /></div>
            <div><span className="text-sm text-ink-500 block mb-1">Description</span><p className="text-sm text-ink-800 p-3 bg-ink-50 rounded-xl">{selected.description}</p></div>
            <div className="flex justify-between"><span className="text-sm text-ink-500">Date</span><span className="text-sm">{formatDateTime(selected.createdAt)}</span></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!action} onClose={() => setAction(null)} onConfirm={handleAction} title={`${action?.type === 'resolve' ? 'Resolve' : action?.type === 'review' ? 'Review' : 'Reject'} Report`} message={`Are you sure you want to ${action?.type} this report?`} confirmLabel={action?.type === 'resolve' ? 'Resolve' : action?.type === 'review' ? 'Review' : 'Reject'} danger={action?.type === 'reject'} />
    </DashboardShell>
  );
}
