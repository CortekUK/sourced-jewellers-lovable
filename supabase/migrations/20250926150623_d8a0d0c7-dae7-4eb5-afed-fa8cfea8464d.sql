-- Fix function security warnings by setting search_path
create or replace function public.gen_internal_sku()
returns trigger 
language plpgsql 
security definer
set search_path = public
as $$
begin
  if new.internal_sku is null then
    new.internal_sku := 'LIT-' || lpad(nextval('product_sku_seq')::text, 5, '0');
  end if;
  return new;
end $$;

create or replace function public.set_serial_sold_at()
returns trigger 
language plpgsql 
security definer
set search_path = public
as $$
begin
  if new.status = 'sold' and (old.status is distinct from 'sold') then
    new.sold_at := now();
  end if;
  return new;
end $$;