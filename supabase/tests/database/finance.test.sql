begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users(id,instance_id,aud,role)
values ('00000000-0000-4000-8000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated'),
       ('00000000-0000-4000-8000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated');

select public.initialize_household(
  '00000000-0000-4000-8000-000000000011','Finance household','F1N4NC3S','Finance person','Finance room',
  'not-a-real-pin-hash','not-a-real-recovery-hash'
);

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000011',true);
set local role authenticated;

select is((select count(*) from public.collection_templates),1::bigint,'new profiles receive one inactive collection template');
select public.save_collection_template((select id from public.profiles where name='Finance person'),1000,31,date_trunc('month',now())::date,true);
select ok((select is_active from public.collection_templates),'collection template can be activated by its household');
select is((select count(*) from public.collection_occurrences),12::bigint,'twelve collection months are generated idempotently');
select is((select due_on from public.collection_occurrences where billing_month=date '2027-02-01'),date '2027-02-28','invalid due days map to month end');

insert into public.collection_payments(household_id,collection_occurrence_id,amount,received_by_profile_id)
select household_id,id,400,(select id from public.profiles where name='Finance person')
from public.collection_occurrences where billing_month=date_trunc('month',now())::date;
select is((select status from public.collection_balances where billing_month=date_trunc('month',now())::date),'partial','partial receipts remain outstanding');

insert into public.collection_payments(household_id,collection_occurrence_id,amount,received_by_profile_id)
select household_id,id,600,(select id from public.profiles where name='Finance person')
from public.collection_occurrences where billing_month=date_trunc('month',now())::date;
select is((select status from public.collection_balances where billing_month=date_trunc('month',now())::date),'paid','multiple receipts settle the contribution');
select is((select actual_collections from public.monthly_financial_summary where month=date_trunc('month',now())::date),1000::numeric,'monthly cash collections sum dated payments');
reset role;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
set local role authenticated;
select is((select count(*) from public.collection_occurrences),0::bigint,'an unjoined device cannot read collection balances');
reset role;

select * from finish();
rollback;
