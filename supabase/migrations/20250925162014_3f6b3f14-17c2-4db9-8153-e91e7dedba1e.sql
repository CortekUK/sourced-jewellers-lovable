-- Fix audit trigger function to use lowercase action values
-- This resolves the constraint violation when adding suppliers/products

CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  pk TEXT;
BEGIN
  -- try id bigserial; fallback to primary key guess
  BEGIN
    pk := COALESCE(NEW.id::TEXT, OLD.id::TEXT);
  EXCEPTION WHEN others THEN
    pk := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(OLD)->>'id', 'unknown');
  END;

  INSERT INTO public.audit_log(table_name, row_pk, action, old_data, new_data, actor, occurred_at)
  VALUES (TG_TABLE_NAME, pk, LOWER(TG_OP::TEXT),  -- Convert to lowercase to match constraint
          CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
          CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
          auth.uid(), now());
  RETURN NULL;
END $function$;