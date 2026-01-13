-- Update app_settings with store branding configuration
UPDATE app_settings SET values = jsonb_set(
  COALESCE(values, '{}'::jsonb), 
  '{store}', 
  '{
    "name": "Lost In Time Jewellers",
    "tagline": "Premium Jewelry & Timepieces", 
    "address": "123 High Street, London SW1A 1AA",
    "phone": "020 7123 4567",
    "email": "info@lostintime.com"
  }'::jsonb
) WHERE id = 1;

UPDATE app_settings SET values = jsonb_set(
  COALESCE(values, '{}'::jsonb),
  '{branding}', 
  '{
    "logo_light": "/logo-light.png",
    "logo_dark": "/logo-dark.png", 
    "primary_gold": "#D4AF37"
  }'::jsonb
) WHERE id = 1;