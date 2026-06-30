begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users(id,instance_id,aud,role)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated');

select public.initialize_household(
  '00000000-0000-4000-8000-000000000001',
  'Test household',
  'A1B2C3D4',
  'Test person',
  'Test room',
  'not-a-real-pin-hash',
  'not-a-real-recovery-hash'
);

set local role anon;
select is((select count(*) from public.households),0::bigint,'anonymous clients cannot see the household');
select is((select count(*) from public.household_secrets),0::bigint,'anonymous clients cannot see secrets');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select is((select count(*) from public.households),1::bigint,'joined device can read its household');
select is((select count(*) from public.rooms),1::bigint,'joined device can read its rooms');
select is((select count(*) from public.household_secrets),0::bigint,'joined device still cannot read secrets');
reset role;

select * from finish();
rollback;
