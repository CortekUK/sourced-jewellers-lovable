-- ============================================================
-- RBAC Migration Step 1: Add Manager Role to Enum
-- Run this FIRST, then run step 2 in a separate transaction
-- ============================================================

-- Add 'manager' to the user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';
