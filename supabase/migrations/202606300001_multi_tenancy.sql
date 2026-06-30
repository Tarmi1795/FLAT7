alter table public.households drop constraint if exists households_singleton_key;
alter table public.households drop constraint if exists households_singleton_check;
alter table public.households drop column if exists singleton;
alter table public.households add column if not exists join_code text;

update public.households
set join_code = upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8))
where join_code is null;

alter table public.households alter column join_code set not null;
alter table public.households add constraint households_join_code_format check (join_code ~ '^[A-Z0-9]{8}$');
alter table public.households add constraint households_join_code_key unique (join_code);

drop function if exists public.initialize_household(uuid,text,text,text,text);
create or replace function public.initialize_household(
  p_auth_user_id uuid,
  p_household_name text,
  p_household_code text,
  p_profile_name text,
  p_room_name text,
  p_pin_hash text,
  p_recovery_hash text
)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare h_id uuid; p_id uuid;
begin
  if exists(select 1 from public.device_memberships where auth_user_id = p_auth_user_id) then
    raise exception 'This device already belongs to a household';
  end if;
  insert into public.households(name, join_code)
  values (trim(p_household_name), upper(trim(p_household_code))) returning id into h_id;
  insert into public.household_secrets(household_id,pin_hash,recovery_hash) values (h_id,p_pin_hash,p_recovery_hash);
  insert into public.profiles(household_id,name,initials) values (h_id,trim(p_profile_name),upper(left(trim(p_profile_name),2))) returning id into p_id;
  insert into public.rooms(household_id,name,primary_profile_id) values (h_id,trim(p_room_name),p_id);
  insert into public.device_memberships(auth_user_id,household_id,selected_profile_id) values (p_auth_user_id,h_id,p_id);
  insert into public.bills(household_id,kind,responsible_profile_id,default_amount,due_day) values
    (h_id,'Internet',p_id,0,1),(h_id,'Rent',p_id,0,1);
  perform public.generate_bill_occurrences(12);
  return h_id;
end $$;

revoke all on function public.initialize_household(uuid,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.initialize_household(uuid,text,text,text,text,text,text) to service_role;
