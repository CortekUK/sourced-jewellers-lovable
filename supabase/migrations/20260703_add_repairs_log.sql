-- Repairs Log: track repairs / polishes / resizes etc.
-- Full workflow tracker for jewellery repairs.

create table if not exists public.repairs (
  id                bigint generated always as identity primary key,
  -- Optional link to an existing customer, plus free-text fallback so a repair
  -- can be logged without creating a customer record first.
  customer_id       bigint references public.customers(id) on delete set null,
  customer_name     text,
  customer_phone    text,
  -- What came in and what we're doing to it
  item_description  text not null,
  repair_type       text not null default 'repair',
  work_details      text,
  -- Workflow
  status            text not null default 'received',
  quoted_cost       numeric(10,2),
  location_id       bigint references public.locations(id) on delete set null,
  assigned_to       uuid references auth.users(id) on delete set null,
  -- Dates
  received_at       timestamptz not null default now(),
  promised_at       timestamptz,
  completed_at      timestamptz,
  -- Meta
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint repairs_status_check check (
    status in ('received','in_progress','ready','collected','cancelled')
  ),
  constraint repairs_type_check check (
    repair_type in ('repair','polish','resize','rhodium','stone_setting','engraving','valuation','cleaning','restringing','other')
  )
);

create index if not exists idx_repairs_status on public.repairs (status);
create index if not exists idx_repairs_customer_id on public.repairs (customer_id);
create index if not exists idx_repairs_received_at on public.repairs (received_at desc);

-- Keep updated_at fresh
drop trigger if exists set_repairs_updated_at on public.repairs;
create trigger set_repairs_updated_at
  before update on public.repairs
  for each row execute function public.set_updated_at();

-- Row Level Security: mirrors the cash_drawer_movements model
alter table public.repairs enable row level security;

drop policy if exists "Staff can view repairs" on public.repairs;
create policy "Staff can view repairs"
  on public.repairs for select
  using (is_staff(auth.uid()));

drop policy if exists "Staff can insert repairs" on public.repairs;
create policy "Staff can insert repairs"
  on public.repairs for insert
  with check (is_staff(auth.uid()));

drop policy if exists "Staff can update repairs" on public.repairs;
create policy "Staff can update repairs"
  on public.repairs for update
  using (is_staff(auth.uid()));

drop policy if exists "Owners can delete repairs" on public.repairs;
create policy "Owners can delete repairs"
  on public.repairs for delete
  using (is_owner(auth.uid()));
