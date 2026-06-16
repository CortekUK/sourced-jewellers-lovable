-- 1) Barcode should not be globally unique (jewellery items can share/lack barcodes;
--    internal_sku remains the true unique key). Replace the unique constraint with a
--    plain index so saving a product never fails on "barcode already exists".
alter table public.products drop constraint if exists products_barcode_key;
create index if not exists products_barcode_idx on public.products using btree (barcode);

-- 2) Add "Year of production" specification (used mainly for watches)
alter table public.products add column if not exists year_of_production text;
comment on column public.products.year_of_production is 'Year the item was produced (e.g. watches)';
