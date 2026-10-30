-- ==========================================================
-- 0002_oauth_support.sql: OAuth & New User Trigger + Resilient Onboarding
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/tbzjvwpfjocydzhtdtjf/sql/new
-- ==========================================================

-- 1. Automatic profile creation trigger on auth.users (Google OAuth, GitHub, Email OTP)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, referral_code, balance, onboarded)
  VALUES (
    new.id,
    COALESCE(new.email, 'user@campus.ac.in'),
    'HAWA-' || upper(substr(md5(new.id::text || clock_timestamp()::text), 1, 6)),
    100,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Resilient complete_onboarding RPC (Upserts profile if not already created)
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_display_name TEXT,
  p_hostel TEXT,
  p_referral_code TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_referrer_id UUID;
  v_starting_coins BIGINT := 100;
  v_clean_ref TEXT;
  v_user_email TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate referral code if provided
  IF p_referral_code IS NOT NULL AND trim(p_referral_code) != '' THEN
    v_clean_ref := upper(trim(p_referral_code));
    SELECT id INTO v_referrer_id FROM public.profiles WHERE referral_code = v_clean_ref;
    
    IF v_referrer_id IS NOT NULL AND v_referrer_id != v_user_id THEN
      v_starting_coins := v_starting_coins + 50; -- New user gets +50
    ELSE
      v_referrer_id := NULL;
    END IF;
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Upsert profile (handles both existing row and newly signed up OAuth user)
  INSERT INTO public.profiles (
    id, email, display_name, hostel, balance, referral_code, referred_by, onboarded
  )
  VALUES (
    v_user_id,
    COALESCE(v_user_email, 'student@campus.ac.in'),
    trim(p_display_name),
    trim(p_hostel),
    v_starting_coins,
    'HAWA-' || upper(substr(md5(v_user_id::text || clock_timestamp()::text), 1, 6)),
    v_referrer_id,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = trim(p_display_name),
    hostel = trim(p_hostel),
    balance = v_starting_coins,
    referred_by = v_referrer_id,
    onboarded = true;

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_starting_coins,
    'bonus_applied', v_referrer_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
