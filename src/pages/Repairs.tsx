import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimpleTable, Column } from '@/components/ui/simple-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { RepairModal } from '@/components/repairs/RepairModal';
import { usePermissions, CRM_MODULES } from '@/hooks/usePermissions';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Plus,
  Wrench,
  Clock,
  PackageCheck,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
} from 'lucide-react';
import {
  useRepairs,
  useRepairStats,
  useUpdateRepair,
  useDeleteRepair,
  RepairWithDetails,
  RepairStatus,
  REPAIR_STATUS_LABELS,
  REPAIR_TYPE_LABELS,
  REPAIR_STATUS_ORDER,
} from '@/hooks/useRepairs';

const STATUS_STYLES: Record<RepairStatus, string> = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ready: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  collected: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export default function Repairs() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const canAdd = canCreate(CRM_MODULES.REPAIRS);
  const canModify = canEdit(CRM_MODULES.REPAIRS);
  const canRemove = canDelete(CRM_MODULES.REPAIRS);

  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all' | 'open'>('open');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RepairWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RepairWithDetails | null>(null);

  const { data: repairs, isLoading } = useRepairs({ status: statusFilter });
  const { data: stats } = useRepairStats();
  const updateRepair = useUpdateRepair();
  const deleteRepair = useDeleteRepair();

  const filtered = useMemo(() => {
    const rows = repairs ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [
        r.item_description,
        r.customer_name,
        r.customer?.name,
        r.customer_phone,
        r.customer?.phone,
        r.notes,
        r.work_details,
      ]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [repairs, search]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (repair: RepairWithDetails) => {
    setEditing(repair);
    setModalOpen(true);
  };

  const quickStatus = (repair: RepairWithDetails, status: RepairStatus) => {
    updateRepair.mutate({
      id: repair.id,
      updates: {
        status,
        completed_at:
          status === 'collected'
            ? (repair.completed_at ?? new Date().toISOString())
            : status === 'received' || status === 'in_progress'
              ? null
              : repair.completed_at,
      },
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteRepair.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: Column<RepairWithDetails>[] = [
    {
      key: 'customer',
      title: 'Customer',
      render: (_v, r) => {
        const name = r.customer_name || r.customer?.name || '—';
        const phone = r.customer_phone || r.customer?.phone;
        return (
          <div className="min-w-0">
            <div className="font-medium truncate">{name}</div>
            {phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {phone}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'item_description',
      title: 'Item / Work',
      render: (_v, r) => (
        <div className="min-w-0">
          <div className="truncate">{r.item_description}</div>
          <div className="text-xs text-muted-foreground">
            {REPAIR_TYPE_LABELS[r.repair_type]}
            {r.work_details ? ` · ${r.work_details}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (_v, r) => (
        <Badge variant="outline" className={cn('border-0', STATUS_STYLES[r.status])}>
          {REPAIR_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: 'quoted_cost',
      title: 'Quoted',
      align: 'right',
      render: (_v, r) => (r.quoted_cost != null ? formatCurrency(r.quoted_cost) : '—'),
    },
    {
      key: 'received_at',
      title: 'Received',
      render: (_v, r) => (r.received_at ? format(new Date(r.received_at), 'dd MMM yyyy') : '—'),
    },
    {
      key: 'promised_at',
      title: 'Promised',
      render: (_v, r) =>
        r.promised_at ? format(new Date(r.promised_at), 'dd MMM yyyy') : '—',
    },
    {
      key: 'actions',
      title: '',
      align: 'right',
      render: (_v, r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canModify && (
              <DropdownMenuItem onClick={() => openEdit(r)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {canModify && (
              <>
                <DropdownMenuSeparator />
                {REPAIR_STATUS_ORDER.filter((s) => s !== r.status).map((s) => (
                  <DropdownMenuItem key={s} onClick={() => quickStatus(r, s)}>
                    Mark {REPAIR_STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {canRemove && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(r)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AppLayout
      title="Repairs"
      subtitle="Track repairs, polishes, resizes and other workshop jobs"
    >
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <StatCard
            label="Open Jobs"
            value={stats?.open ?? 0}
            hint="Not yet collected"
            icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            label="In Progress"
            value={stats?.inProgress ?? 0}
            hint="Being worked on"
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          />
          <StatCard
            label="Ready for Collection"
            value={stats?.ready ?? 0}
            hint="Waiting for customer"
            icon={<PackageCheck className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search item, customer or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as RepairStatus | 'all' | 'open')}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (active)</SelectItem>
                <SelectItem value="all">All</SelectItem>
                {REPAIR_STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {REPAIR_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canAdd && (
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Log Repair
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <SimpleTable
              data={filtered}
              columns={columns}
              loading={isLoading}
              emptyMessage="No repairs to show. Log the first one to get started."
            />
          </CardContent>
        </Card>
      </div>

      <RepairModal open={modalOpen} onOpenChange={setModalOpen} repair={editing} />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this repair?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the repair record for “
              {deleteTarget?.item_description}”. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
