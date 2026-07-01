alter table public.bills add column if not exists start_month date not null default date_trunc('month',now())::date;

create table public.collection_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  due_day integer not null default 1 check (due_day between 1 and 31),
  start_month date not null default date_trunc('month',now())::date,
  is_active boolean not null default false,
  reminder_days integer[] not null default array[7,1,0],
  reminder_time time not null default '09:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id,profile_id)
);

create table public.collection_occurrences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  template_id uuid not null references public.collection_templates(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  billing_month date not null,
  due_on date not null,
  expected_amount numeric(12,2) not null check (expected_amount >= 0),
  received_amount numeric(12,2) not null default 0 check (received_amount >= 0),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (template_id,billing_month)
);

create table public.collection_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  collection_occurrence_id uuid not null references public.collection_occurrences(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  received_at timestamptz not null default now(),
  received_by_profile_id uuid not null references public.profiles(id),
  note text,
  client_mutation_id uuid not null unique default gen_random_uuid(),
  created_by_auth_user_id uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index collection_occurrences_household_month_idx on public.collection_occurrences(household_id,billing_month);
create index collection_occurrences_profile_due_idx on public.collection_occurrences(profile_id,due_on);
create index collection_payments_occurrence_idx on public.collection_payments(collection_occurrence_id,received_at) where archived_at is null;

create or replace function public.validate_collection_tenant_and_amount()
returns trigger language plpgsql security definer set search_path = public,pg_temp as $$
declare occurrence_household uuid; receiver_household uuid; expected numeric(12,2); already_received numeric(12,2);
begin
  select household_id,expected_amount into occurrence_household,expected from public.collection_occurrences where id=new.collection_occurrence_id;
  select household_id into receiver_household from public.profiles where id=new.received_by_profile_id;
  if occurrence_household is null or occurrence_household<>new.household_id or receiver_household<>new.household_id then
    raise exception 'Collection payment belongs to another household';
  end if;
  select coalesce(sum(amount),0) into already_received from public.collection_payments
   where collection_occurrence_id=new.collection_occurrence_id and archived_at is null and id is distinct from new.id;
  if new.archived_at is null and already_received+new.amount>expected then raise exception 'Payment exceeds the remaining contribution balance'; end if;
  return new;
end $$;

create trigger validate_collection_payment before insert or update on public.collection_payments
for each row execute function public.validate_collection_tenant_and_amount();

create or replace function public.recalculate_collection_balance()
returns trigger language plpgsql security definer set search_path = public,pg_temp as $$
declare
  target_id uuid := coalesce(new.collection_occurrence_id,old.collection_occurrence_id);
  total numeric(12,2);
  settled timestamptz;
  target_amount numeric(12,2);
begin
  select coalesce(sum(amount),0),max(received_at)
    into total,settled
    from public.collection_payments
   where collection_occurrence_id=target_id and archived_at is null;
  select expected_amount into target_amount from public.collection_occurrences where id=target_id;
  update public.collection_occurrences
     set received_amount=total,
         settled_at=case when total >= target_amount and target_amount > 0 then settled else null end
   where id=target_id;
  return coalesce(new,old);
end $$;

create trigger collection_balance_after_payment
after insert or update or delete on public.collection_payments
for each row execute function public.recalculate_collection_balance();

create or replace function public.generate_financial_occurrences(months_ahead integer default 12)
returns void language plpgsql security definer set search_path = public,pg_temp as $$
begin
  insert into public.bill_occurrences(household_id,bill_id,billing_month,due_on,amount)
  select b.household_id,b.id,m.month_start::date,
    make_date(extract(year from m.month_start)::int,extract(month from m.month_start)::int,
      least(b.due_day,extract(day from (m.month_start + interval '1 month - 1 day'))::int)),b.default_amount
  from public.bills b
  cross join lateral generate_series(
    greatest(date_trunc('month',now()),date_trunc('month',b.start_month::timestamptz)),
    date_trunc('month',now()) + make_interval(months => months_ahead - 1),
    interval '1 month'
  ) m(month_start)
  where b.is_active
  on conflict (bill_id,billing_month) do nothing;

  insert into public.collection_occurrences(household_id,template_id,profile_id,billing_month,due_on,expected_amount)
  select t.household_id,t.id,t.profile_id,m.month_start::date,
    make_date(extract(year from m.month_start)::int,extract(month from m.month_start)::int,
      least(t.due_day,extract(day from (m.month_start + interval '1 month - 1 day'))::int)),t.amount
  from public.collection_templates t
  cross join lateral generate_series(
    greatest(date_trunc('month',now()),date_trunc('month',t.start_month::timestamptz)),
    date_trunc('month',now()) + make_interval(months => months_ahead - 1),
    interval '1 month'
  ) m(month_start)
  where t.is_active and t.amount > 0
  on conflict (template_id,billing_month) do nothing;
end $$;

create or replace function public.generate_bill_occurrences(months_ahead integer default 12)
returns void language sql security definer set search_path = public,pg_temp as $$
  select public.generate_financial_occurrences(months_ahead)
$$;

create or replace function public.update_bill_series(
  occurrence_id uuid,
  next_amount numeric,
  next_due_day integer,
  next_responsible_profile_id uuid,
  change_scope text default 'month'
) returns void language plpgsql security invoker set search_path = public,pg_temp as $$
declare target public.bill_occurrences%rowtype;
begin
  if next_amount < 0 or next_due_day not between 1 and 31 or change_scope not in ('month','future') then
    raise exception 'Invalid bill update';
  end if;
  select * into target from public.bill_occurrences where id=occurrence_id;
  if not found or not public.is_household_member(target.household_id) then raise exception 'Bill not found'; end if;
  if target.paid_at is not null then raise exception 'Paid history cannot be changed'; end if;

  if change_scope='month' then
    update public.bill_occurrences set amount=next_amount,
      due_on=make_date(extract(year from billing_month)::int,extract(month from billing_month)::int,
        least(next_due_day,extract(day from (billing_month + interval '1 month - 1 day'))::int))
    where id=occurrence_id;
  else
    update public.bills set default_amount=next_amount,due_day=next_due_day,
      responsible_profile_id=next_responsible_profile_id where id=target.bill_id;
    update public.bill_occurrences set amount=next_amount,
      due_on=make_date(extract(year from billing_month)::int,extract(month from billing_month)::int,
        least(next_due_day,extract(day from (billing_month + interval '1 month - 1 day'))::int))
    where bill_id=target.bill_id and billing_month>=target.billing_month and paid_at is null;
  end if;
end $$;

create or replace function public.delete_bill_series(occurrence_id uuid, change_scope text default 'month')
returns void language plpgsql security invoker set search_path = public,pg_temp as $$
declare target public.bill_occurrences%rowtype;
begin
  if change_scope not in ('month','future') then raise exception 'Invalid bill deletion scope'; end if;
  select * into target from public.bill_occurrences where id=occurrence_id;
  if not found or not public.is_household_member(target.household_id) then raise exception 'Bill not found'; end if;
  if target.paid_at is not null then raise exception 'Paid history cannot be deleted'; end if;
  if change_scope='month' then
    delete from public.bill_occurrences where id=occurrence_id;
  else
    update public.bills set is_active=false where id=target.bill_id;
    delete from public.bill_occurrences where bill_id=target.bill_id and billing_month>=target.billing_month and paid_at is null;
  end if;
end $$;

create or replace function public.save_collection_template(
  target_profile_id uuid,
  next_amount numeric,
  next_due_day integer,
  next_start_month date,
  next_is_active boolean
) returns uuid language plpgsql security invoker set search_path = public,pg_temp as $$
declare target_household uuid; target_template uuid;
begin
  if next_amount < 0 or next_due_day not between 1 and 31 then raise exception 'Invalid contribution settings'; end if;
  select household_id into target_household from public.profiles where id=target_profile_id and is_active;
  if target_household is null or not public.is_household_member(target_household) then raise exception 'Profile not found'; end if;
  insert into public.collection_templates(household_id,profile_id,amount,due_day,start_month,is_active)
  values(target_household,target_profile_id,next_amount,next_due_day,date_trunc('month',next_start_month)::date,next_is_active)
  on conflict(household_id,profile_id) do update set amount=excluded.amount,due_day=excluded.due_day,
    start_month=excluded.start_month,is_active=excluded.is_active,updated_at=now()
  returning id into target_template;
  update public.collection_occurrences set expected_amount=next_amount,
    due_on=make_date(extract(year from billing_month)::int,extract(month from billing_month)::int,
      least(next_due_day,extract(day from (billing_month + interval '1 month - 1 day'))::int))
  where template_id=target_template and billing_month>=date_trunc('month',next_start_month)::date and received_amount=0;
  perform public.generate_financial_occurrences(12);
  return target_template;
end $$;

create or replace function public.refresh_financial_occurrences()
returns trigger language plpgsql security definer set search_path = public,pg_temp as $$
begin
  perform public.generate_financial_occurrences(12);
  return new;
end $$;

create trigger bills_refresh_occurrences
after insert or update of is_active on public.bills
for each statement execute function public.refresh_financial_occurrences();

create trigger collections_refresh_occurrences
after insert or update of is_active on public.collection_templates
for each statement execute function public.refresh_financial_occurrences();

create or replace function public.ensure_collection_template_for_profile()
returns trigger language plpgsql security definer set search_path = public,pg_temp as $$
begin
  insert into public.collection_templates(household_id,profile_id,amount,due_day,start_month,is_active)
  values(new.household_id,new.id,0,1,date_trunc('month',now())::date,false)
  on conflict (household_id,profile_id) do nothing;
  return new;
end $$;

create trigger profile_collection_template
after insert on public.profiles
for each row execute function public.ensure_collection_template_for_profile();

drop view if exists public.activity_feed;
create view public.activity_feed with (security_invoker=true) as
select id,household_id,'water'::text as type,occurred_at,performed_by_profile_id as profile_id,plant_id as entity_id,note,archived_at from public.plant_care_logs where action='water'
union all select id,household_id,'trim',occurred_at,performed_by_profile_id,plant_id,note,archived_at from public.plant_care_logs where action='trim'
union all select id,household_id,'maintenance',occurred_at,performed_by_profile_id,ac_unit_id,note,archived_at from public.ac_maintenance_logs
union all select id,household_id,'payment',paid_at,paid_by_profile_id,bill_occurrence_id,note,archived_at from public.bill_payments
union all select id,household_id,'collection',received_at,received_by_profile_id,collection_occurrence_id,note,archived_at from public.collection_payments;

create view public.collection_balances with (security_invoker=true) as
select o.id,o.household_id,o.template_id,o.profile_id,o.billing_month,o.due_on,o.expected_amount,o.received_amount,
  greatest(o.expected_amount-o.received_amount,0)::numeric(12,2) remaining_amount,o.settled_at,
  case when o.received_amount >= o.expected_amount and o.expected_amount > 0 then 'paid'
       when o.received_amount > 0 then 'partial' else 'unpaid' end status
from public.collection_occurrences o;

create view public.monthly_financial_summary with (security_invoker=true) as
with months as (
  select household_id,billing_month as finance_month from public.collection_occurrences
  union select household_id,billing_month from public.bill_occurrences
  union select household_id,date_trunc('month',received_at)::date from public.collection_payments where archived_at is null
  union select household_id,date_trunc('month',paid_at)::date from public.bill_occurrences where paid_at is not null
)
select m.household_id,m.finance_month as month,
  coalesce((select sum(expected_amount) from public.collection_occurrences c where c.household_id=m.household_id and c.billing_month=m.finance_month),0)::numeric(12,2) expected_collections,
  coalesce((select sum(amount) from public.collection_payments p where p.household_id=m.household_id and p.archived_at is null and date_trunc('month',p.received_at)::date=m.finance_month),0)::numeric(12,2) actual_collections,
  coalesce((select sum(amount) from public.bill_occurrences b where b.household_id=m.household_id and b.billing_month=m.finance_month),0)::numeric(12,2) expected_expenses,
  coalesce((select sum(amount) from public.bill_occurrences b where b.household_id=m.household_id and b.paid_at is not null and date_trunc('month',b.paid_at)::date=m.finance_month),0)::numeric(12,2) actual_expenses
from months m;

create view public.collection_notification_jobs with (security_invoker=true) as
select concat('collection-',lead_day,'-',o.id,'-',o.due_on) job_key,o.household_id,o.profile_id,
  ((o.due_on-lead_day)::timestamp + t.reminder_time) at time zone h.timezone scheduled_for,
  concat('Contribution due from ',p.name) title,
  concat(p.name,' has ',to_char(greatest(o.expected_amount-o.received_amount,0),'FM999999990D00'),' QAR remaining ',case when lead_day=0 then 'today.' else concat('in ',lead_day,' days.') end) body,
  '/profit-loss'::text url
from public.collection_occurrences o
join public.collection_templates t on t.id=o.template_id
join public.profiles p on p.id=o.profile_id
join public.households h on h.id=o.household_id
cross join lateral unnest(t.reminder_days) lead_day
where o.received_amount<o.expected_amount;

alter table public.collection_templates enable row level security;
alter table public.collection_occurrences enable row level security;
alter table public.collection_payments enable row level security;

do $$ declare t text; begin
  foreach t in array array['collection_templates','collection_occurrences','collection_payments'] loop
    execute format('create policy %I_member_select on public.%I for select to authenticated using (public.is_household_member(household_id))',t,t);
    execute format('create policy %I_member_insert on public.%I for insert to authenticated with check (public.is_household_member(household_id))',t,t);
    execute format('create policy %I_member_update on public.%I for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id))',t,t);
    execute format('create policy %I_member_delete on public.%I for delete to authenticated using (public.is_household_member(household_id))',t,t);
  end loop;
end $$;

create trigger audit_collection_templates after insert or update or delete on public.collection_templates for each row execute function public.capture_audit_event();
create trigger audit_collection_payments after insert or update or delete on public.collection_payments for each row execute function public.capture_audit_event();

grant select,insert,update,delete on public.collection_templates,public.collection_occurrences,public.collection_payments to authenticated;
grant select on public.collection_balances,public.monthly_financial_summary,public.collection_notification_jobs to authenticated;
grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant usage on schema public to service_role;
grant select,insert,update,delete on all tables in schema public to service_role;
grant execute on function public.generate_financial_occurrences(integer) to service_role;
grant execute on function public.update_bill_series(uuid,numeric,integer,uuid,text) to authenticated;
grant execute on function public.delete_bill_series(uuid,text) to authenticated;
grant execute on function public.save_collection_template(uuid,numeric,integer,date,boolean) to authenticated;

insert into public.collection_templates(household_id,profile_id,amount,due_day,start_month,is_active)
select p.household_id,p.id,0,1,date_trunc('month',now())::date,false from public.profiles p
on conflict (household_id,profile_id) do nothing;

insert into public.bills(household_id,kind,default_amount,due_day,is_active)
select h.id,'Water & Electricity'::public.bill_kind,0,1,false from public.households h
on conflict (household_id,kind) do nothing;

select public.generate_financial_occurrences(12);

select cron.unschedule(jobid) from cron.job where jobname='flat7-generate-bills';
select cron.schedule('flat7-generate-finances','10 0 * * *',$$select public.generate_financial_occurrences(12);$$)
where not exists(select 1 from cron.job where jobname='flat7-generate-finances');

alter publication supabase_realtime add table public.collection_templates;
alter publication supabase_realtime add table public.collection_occurrences;
alter publication supabase_realtime add table public.collection_payments;
