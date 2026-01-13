-- Update store information in app_settings with correct address and phone
UPDATE public.app_settings
SET values = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(values, '{}'::jsonb),
      '{store}',
      COALESCE(values->'store', '{}'::jsonb)
    ),
    '{store,address}',
    '"Clippers House, Clippers Quay, Salford M50 3XP"'
  ),
  '{store,phone}',
  '"07379 002973"'
)
WHERE id = 1;