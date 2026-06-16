-- Allow STAFF (not just owners) to upload/manage product documents.
-- Previously product documents (e.g. Rolex cards, certificates, invoices) could only be
-- uploaded by users with role 'owner', so staff/managers got blocked uploads — while the
-- part-exchange-docs and expense-receipts buckets already allowed staff. This aligns
-- product documents with those buckets.

-- Storage bucket: product-docs
drop policy if exists "product-docs insert (owner)" on storage.objects;
drop policy if exists "product-docs update (owner)" on storage.objects;
drop policy if exists "product-docs delete (owner)" on storage.objects;

create policy "product-docs insert (staff)" on storage.objects
  for insert to public
  with check (bucket_id = 'product-docs' and is_staff(auth.uid()));

create policy "product-docs update (staff)" on storage.objects
  for update to public
  using (bucket_id = 'product-docs' and is_staff(auth.uid()))
  with check (bucket_id = 'product-docs' and is_staff(auth.uid()));

create policy "product-docs delete (staff)" on storage.objects
  for delete to public
  using (bucket_id = 'product-docs' and is_staff(auth.uid()));

-- Metadata table: public.product_documents
drop policy if exists "product_documents insert (owner)" on public.product_documents;
drop policy if exists "product_documents update (owner)" on public.product_documents;
drop policy if exists "product_documents delete (owner)" on public.product_documents;

create policy "product_documents insert (staff)" on public.product_documents
  for insert to public with check (is_staff(auth.uid()));

create policy "product_documents update (staff)" on public.product_documents
  for update to public using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

create policy "product_documents delete (staff)" on public.product_documents
  for delete to public using (is_staff(auth.uid()));
