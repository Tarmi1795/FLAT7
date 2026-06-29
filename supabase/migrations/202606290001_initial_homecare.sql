create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create type public.plant_action as enum ('water', 'trim');
create type public.bill_kind as enum ('Internet', 'Rent');

create table public.households (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  name text not null default 'FLAT7',
  timezone text not null default 'Asia/Qatar',
  currency text not null default 'QAR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_secrets (
  household_id uuid primary key references public.households(id) on delete cascade,
  pin_hash text not null,
  recovery_hash text not null,
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  initials text not null,
  color text not null default '#34D399',
  avatar_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.device_memberships (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  selected_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  primary_profile_id uuid not null references public.profiles(id),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.plants (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  room_id uuid not null references public.rooms(id),
  assigned_profile_id uuid references public.profiles(id),
  name text not null check (char_length(name) between 1 and 80),
  species text not null default '',
  photo_path text,
  note text,
  water_every_days integer not null default 7 check (water_every_days between 1 and 365),
  trim_every_days integer not null default 60 check (trim_every_days between 1 and 730),
  last_watered_at timestamptz,
  last_trimmed_at timestamptz,
  next_water_due_on date,
  next_trim_due_on date,
  water_reminder_time time not null default '08:00',
  trim_reminder_time time not null default '08:00',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.plant_care_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  plant_id uuid not null references public.plants(id) on delete cascade,
  action public.plant_action not null,
  occurred_at timestamptz not null default now(),
  performed_by_profile_id uuid not null references public.profiles(id),
  note text,
  client_mutation_id uuid not null unique default gen_random_uuid(),
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ac_units (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  room_id uuid not null references public.rooms(id),
  assigned_profile_id uuid references public.profiles(id),
  name text not null check (char_length(name) between 1 and 80),
  note text,
  maintenance_every_months integer not null default 3 check (maintenance_every_months between 1 and 24),
  last_maintained_at timestamptz,
  next_maintenance_due_on date,
  reminder_time time not null default '09:00',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ac_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  ac_unit_id uuid not null references public.ac_units(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  performed_by_profile_id uuid not null references public.profiles(id),
  note text,
  client_mutation_id uuid not null unique default gen_random_uuid(),
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  kind public.bill_kind not null,
  responsible_profile_id uuid references public.profiles(id),
  default_amount numeric(12,2) not null default 0 check (default_amount >= 0),
  due_day integer not null check (due_day between 1 and 31),
  is_active boolean not null default true,
  reminder_days integer[] not null default array[7,1,0],
  reminder_time time not null default '09:00',
  created_at timestamptz not null default now(),
  unique (household_id, kind)
);

create table public.bill_occurrences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  bill_id uuid not null references public.bills(id) on delete cascade,
  billing_month date not null,
  due_on date not null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_at timestamptz,
  paid_by_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (bill_id, billing_month)
);

create table public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  bill_occurrence_id uuid not null references public.bill_occurrences(id) on delete cascade,
  paid_at timestamptz not null default now(),
  paid_by_profile_id uuid not null references public.profiles(id),
  receipt_path text,
  note text,
  client_mutation_id uuid not null unique default gen_random_uuid(),
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.device_memberships(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  job_key text not null,
  scheduled_for timestamptz not null,
  delivered_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (job_key, subscription_id)
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  entity_table text not null,
  entity_id uuid not null,
  operation text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.access_attempts (
  id bigint generated always as identity primary key,
  fingerprint text not null,
  auth_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index access_attempts_lookup_idx on public.access_attempts (fingerprint, created_at desc);

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.device_memberships where auth_user_id = auth.uid() and household_id = target_household)
$$;

create or replace function public.initialize_household(p_auth_user_id uuid, p_profile_name text, p_room_name text, p_pin_hash text, p_recovery_hash text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare h_id uuid; p_id uuid;
begin
  if exists(select 1 from public.households) then raise exception 'Household already initialized'; end if;
  insert into public.households(name) values ('FLAT7') returning id into h_id;
  insert into public.household_secrets(household_id,pin_hash,recovery_hash) values (h_id,p_pin_hash,p_recovery_hash);
  insert into public.profiles(household_id,name,initials) values (h_id,trim(p_profile_name),upper(left(trim(p_profile_name),2))) returning id into p_id;
  insert into public.rooms(household_id,name,primary_profile_id) values (h_id,trim(p_room_name),p_id);
  insert into public.device_memberships(auth_user_id,household_id,selected_profile_id) values (p_auth_user_id,h_id,p_id);
  insert into public.bills(household_id,kind,responsible_profile_id,default_amount,due_day) values
    (h_id,'Internet',p_id,0,10),(h_id,'Rent',p_id,0,1);
  perform public.generate_bill_occurrences(12);
  return h_id;
end $$;

create or replace function public.generate_bill_occurrences(months_ahead integer default 12)
returns void language sql security definer set search_path = public, pg_temp as $$
  insert into public.bill_occurrences(household_id,bill_id,billing_month,due_on,amount)
  select b.household_id,b.id,m.month_start::date,
    make_date(extract(year from m.month_start)::int,extract(month from m.month_start)::int,
      least(b.due_day,extract(day from (m.month_start + interval '1 month - 1 day'))::int)),b.default_amount
  from public.bills b cross join lateral generate_series(date_trunc('month',now()),date_trunc('month',now()) + make_interval(months => months_ahead - 1),interval '1 month') m(month_start)
  where b.is_active
  on conflict (bill_id,billing_month) do nothing
$$;

create or replace function public.recalculate_plant_dates()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare target_id uuid := coalesce(new.plant_id,old.plant_id); water_at timestamptz; trim_at timestamptz;
begin
  select max(occurred_at) filter(where action='water'),max(occurred_at) filter(where action='trim') into water_at,trim_at from public.plant_care_logs where plant_id=target_id and archived_at is null;
  update public.plants set last_watered_at=water_at,last_trimmed_at=trim_at,
    next_water_due_on=case when water_at is null then null else water_at::date + water_every_days end,
    next_trim_due_on=case when trim_at is null then null else trim_at::date + trim_every_days end where id=target_id;
  return coalesce(new,old);
end $$;
create trigger plant_dates_after_log after insert or update or delete on public.plant_care_logs for each row execute function public.recalculate_plant_dates();

create or replace function public.recalculate_ac_dates()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare target_id uuid := coalesce(new.ac_unit_id,old.ac_unit_id); maintained_at timestamptz;
begin
  select max(occurred_at) into maintained_at from public.ac_maintenance_logs where ac_unit_id=target_id and archived_at is null;
  update public.ac_units set last_maintained_at=maintained_at,next_maintenance_due_on=case when maintained_at is null then null else (maintained_at + make_interval(months=>maintenance_every_months))::date end where id=target_id;
  return coalesce(new,old);
end $$;
create trigger ac_dates_after_log after insert or update or delete on public.ac_maintenance_logs for each row execute function public.recalculate_ac_dates();

create or replace function public.recalculate_bill_payment()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare target_id uuid := coalesce(new.bill_occurrence_id,old.bill_occurrence_id); payment record;
begin
  select paid_at,paid_by_profile_id into payment from public.bill_payments where bill_occurrence_id=target_id and archived_at is null order by paid_at desc limit 1;
  update public.bill_occurrences set paid_at=payment.paid_at,paid_by_profile_id=payment.paid_by_profile_id where id=target_id;
  return coalesce(new,old);
end $$;
create trigger bill_status_after_payment after insert or update or delete on public.bill_payments for each row execute function public.recalculate_bill_payment();

create or replace function public.capture_audit_event()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare h uuid := coalesce(new.household_id,old.household_id); entity uuid := coalesce(new.id,old.id); profile uuid;
begin
  select selected_profile_id into profile from public.device_memberships where auth_user_id=auth.uid();
  insert into public.audit_events(household_id,actor_auth_user_id,actor_profile_id,entity_table,entity_id,operation,before_data,after_data)
  values(h,auth.uid(),profile,tg_table_name,entity,tg_op,case when tg_op='INSERT' then null else to_jsonb(old) end,case when tg_op='DELETE' then null else to_jsonb(new) end);
  return coalesce(new,old);
end $$;
create trigger audit_plant_logs after insert or update or delete on public.plant_care_logs for each row execute function public.capture_audit_event();
create trigger audit_ac_logs after insert or update or delete on public.ac_maintenance_logs for each row execute function public.capture_audit_event();
create trigger audit_bill_payments after insert or update or delete on public.bill_payments for each row execute function public.capture_audit_event();

create or replace view public.activity_feed with (security_invoker=true) as
select id,household_id,'water'::text as type,occurred_at,performed_by_profile_id as profile_id,plant_id as entity_id,note,archived_at from public.plant_care_logs where action='water'
union all select id,household_id,'trim',occurred_at,performed_by_profile_id,plant_id,note,archived_at from public.plant_care_logs where action='trim'
union all select id,household_id,'maintenance',occurred_at,performed_by_profile_id,ac_unit_id,note,archived_at from public.ac_maintenance_logs
union all select id,household_id,'payment',paid_at,paid_by_profile_id,bill_occurrence_id,note,archived_at from public.bill_payments;

create or replace view public.pending_notification_jobs as
select concat('plant-water-',p.id,'-',p.next_water_due_on) job_key,p.household_id,p.assigned_profile_id profile_id,
  (p.next_water_due_on::timestamp + p.water_reminder_time) at time zone h.timezone scheduled_for,
  concat('Water ',p.name) title,concat(p.name,' is due for watering today.') body,'/plants' url
from public.plants p join public.households h on h.id=p.household_id where p.archived_at is null and p.next_water_due_on is not null
union all select concat('plant-trim-',p.id,'-',p.next_trim_due_on),p.household_id,p.assigned_profile_id,
  (p.next_trim_due_on::timestamp + p.trim_reminder_time) at time zone h.timezone,concat('Trim ',p.name),concat(p.name,' is due for trimming today.'),'/plants'
from public.plants p join public.households h on h.id=p.household_id where p.archived_at is null and p.next_trim_due_on is not null
union all select concat('ac-7-',a.id,'-',a.next_maintenance_due_on),a.household_id,a.assigned_profile_id,
  ((a.next_maintenance_due_on-7)::timestamp + a.reminder_time) at time zone h.timezone,concat(a.name,' service is coming up'),'Maintenance is due in seven days.','/ac'
from public.ac_units a join public.households h on h.id=a.household_id where a.archived_at is null and a.next_maintenance_due_on is not null
union all select concat('ac-0-',a.id,'-',a.next_maintenance_due_on),a.household_id,a.assigned_profile_id,
  (a.next_maintenance_due_on::timestamp + a.reminder_time) at time zone h.timezone,concat('Maintain ',a.name),'Maintenance is due today.','/ac'
from public.ac_units a join public.households h on h.id=a.household_id where a.archived_at is null and a.next_maintenance_due_on is not null
union all select concat('bill-',lead_day,'-',o.id,'-',o.due_on),o.household_id,b.responsible_profile_id,
  ((o.due_on-lead_day)::timestamp + b.reminder_time) at time zone h.timezone,concat(b.kind,' bill due'),concat(b.kind,' payment is due ',case when lead_day=0 then 'today.' else concat('in ',lead_day,' days.') end),'/bills'
from public.bill_occurrences o join public.bills b on b.id=o.bill_id join public.households h on h.id=o.household_id cross join lateral unnest(b.reminder_days) lead_day where o.paid_at is null;

alter table public.households enable row level security;
alter table public.household_secrets enable row level security;
alter table public.profiles enable row level security;
alter table public.device_memberships enable row level security;
alter table public.rooms enable row level security;
alter table public.plants enable row level security;
alter table public.plant_care_logs enable row level security;
alter table public.ac_units enable row level security;
alter table public.ac_maintenance_logs enable row level security;
alter table public.bills enable row level security;
alter table public.bill_occurrences enable row level security;
alter table public.bill_payments enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.audit_events enable row level security;
alter table public.access_attempts enable row level security;

create policy membership_self_select on public.device_memberships for select to authenticated using (auth_user_id=auth.uid());
create policy membership_self_update on public.device_memberships for update to authenticated using (auth_user_id=auth.uid()) with check (auth_user_id=auth.uid());
create policy household_member_select on public.households for select to authenticated using (public.is_household_member(id));

do $$ declare t text; begin
  foreach t in array array['profiles','rooms','plants','plant_care_logs','ac_units','ac_maintenance_logs','bills','bill_occurrences','bill_payments'] loop
    execute format('create policy %I_member_select on public.%I for select to authenticated using (public.is_household_member(household_id))',t,t);
    execute format('create policy %I_member_insert on public.%I for insert to authenticated with check (public.is_household_member(household_id))',t,t);
    execute format('create policy %I_member_update on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))',t,t);
    execute format('create policy %I_member_delete on public.%I for delete to authenticated using (public.is_household_member(household_id))',t,t);
  end loop;
end $$;
create policy audit_member_select on public.audit_events for select to authenticated using (public.is_household_member(household_id));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('plant-photos','plant-photos',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('bill-receipts','bill-receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
create policy household_storage_select on storage.objects for select to authenticated using (bucket_id in ('plant-photos','bill-receipts') and public.is_household_member((storage.foldername(name))[1]::uuid));
create policy household_storage_insert on storage.objects for insert to authenticated with check (bucket_id in ('plant-photos','bill-receipts') and public.is_household_member((storage.foldername(name))[1]::uuid));
create policy household_storage_update on storage.objects for update to authenticated using (bucket_id in ('plant-photos','bill-receipts') and public.is_household_member((storage.foldername(name))[1]::uuid));
create policy household_storage_delete on storage.objects for delete to authenticated using (bucket_id in ('plant-photos','bill-receipts') and public.is_household_member((storage.foldername(name))[1]::uuid));

revoke all on function public.initialize_household(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.initialize_household(uuid,text,text,text,text) to service_role;
grant execute on function public.generate_bill_occurrences(integer) to service_role;

select cron.schedule('flat7-generate-bills','10 0 * * *',$$select public.generate_bill_occurrences(12);$$)
where not exists(select 1 from cron.job where jobname='flat7-generate-bills');
