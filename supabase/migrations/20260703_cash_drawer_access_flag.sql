-- Per-user cash drawer access.
-- Owners and managers always have access via their role; this flag grants
-- specific staff members access to add/remove cash without promoting them.

alter table public.profiles
  add column if not exists cash_drawer_access boolean not null default false;

-- Grant the initially requested staff: Mary, Eren, Afz, Biz
update public.profiles
set cash_drawer_access = true
where email in (
  'mary@sourced.uk',
  'eren@sourced.uk',
  'afz@sourced.uk',
  'biz@sourced.uk'
);
