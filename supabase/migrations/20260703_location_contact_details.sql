-- Per-location contact details for receipts/invoices.
-- Lets each store (e.g. the Dubai UAE entity) print its own legal name,
-- address, phone and email on its receipts.

alter table public.locations
  add column if not exists legal_name text,
  add column if not exists phone text,
  add column if not exists email text;

-- Dubai store details (SOURCED WRISTS WATCHES TRADING LLC)
update public.locations
set legal_name = 'SOURCED WRISTS WATCHES TRADING LLC',
    address    = 'Azizi Riviera 36, Retail Unit 16, Al Merkadh',
    phone      = '+971 54 399 6688',
    email      = 'Support@sourceduk.co.uk'
where name = 'Dubai';

-- London store details (Sourced UK)
update public.locations
set legal_name = 'Sourced UK',
    address    = 'Office 14, 101 Clerkenwell Road, London, EC1R 5BX, UK',
    phone      = '+44 7757 152031'
where name = 'London';
