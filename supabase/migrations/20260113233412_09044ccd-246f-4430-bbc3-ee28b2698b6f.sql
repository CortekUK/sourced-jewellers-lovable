CREATE OR REPLACE FUNCTION public.update_customer_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  silver_threshold NUMERIC := 500;
  gold_threshold NUMERIC := 2000;
  platinum_threshold NUMERIC := 5000;
  settings_values JSONB;
BEGIN
  IF NEW.customer_id IS NOT NULL AND NOT NEW.is_voided THEN
    -- Try to get custom thresholds from app_settings
    SELECT values INTO settings_values
    FROM public.app_settings
    WHERE id = 1;
    
    IF settings_values IS NOT NULL AND settings_values->'vipTierThresholds' IS NOT NULL THEN
      silver_threshold := COALESCE((settings_values->'vipTierThresholds'->>'silver')::NUMERIC, 500);
      gold_threshold := COALESCE((settings_values->'vipTierThresholds'->>'gold')::NUMERIC, 2000);
      platinum_threshold := COALESCE((settings_values->'vipTierThresholds'->>'platinum')::NUMERIC, 5000);
    END IF;
    
    UPDATE public.customers SET 
      lifetime_spend = lifetime_spend + NEW.total,
      total_purchases = total_purchases + 1,
      vip_tier = CASE 
        WHEN lifetime_spend + NEW.total >= platinum_threshold THEN 'platinum'
        WHEN lifetime_spend + NEW.total >= gold_threshold THEN 'gold'
        WHEN lifetime_spend + NEW.total >= silver_threshold THEN 'silver'
        ELSE 'standard'
      END
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$function$