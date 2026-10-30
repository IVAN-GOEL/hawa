-- ==========================================================
-- 0001_init.sql: Hawa Supabase Schema, Views & RPC Functions
-- ==========================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  hostel TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  balance BIGINT NOT NULL DEFAULT 100 CHECK (balance >= 0),
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  referral_rewards_earned INT NOT NULL DEFAULT 0 CHECK (referral_rewards_earned <= 10),
  daily_claim_last_at TIMESTAMPTZ,
  streak INT NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT ARRAY['First Call'],
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Markets Table
CREATE TABLE IF NOT EXISTS public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 120),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('league', 'fest', 'campus')),
  type TEXT NOT NULL CHECK (type IN ('binary', 'multiple')),
  closing_time TIMESTAMPTZ NOT NULL,
  resolution_source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')),
  creator_id UUID REFERENCES public.profiles(id),
  creator_name TEXT NOT NULL,
  winning_option_id TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  reports_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Market Options Table
CREATE TABLE IF NOT EXISTS public.market_options (
  id TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  seed_pool BIGINT NOT NULL DEFAULT 100,
  PRIMARY KEY (market_id, id)
);

-- 4. Predictions Table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_display_name TEXT NOT NULL,
  user_hostel TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  amount INT NOT NULL CHECK (amount >= 5 AND amount <= 100),
  estimated_payout INT NOT NULL,
  actual_payout INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Proposals Table
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_hostel TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 120),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('league', 'fest', 'campus')),
  type TEXT NOT NULL CHECK (type IN ('binary', 'multiple')),
  options JSONB NOT NULL,
  closing_time TIMESTAMPTZ NOT NULL,
  resolution_source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_display_name TEXT NOT NULL,
  user_hostel TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  target_market_id UUID,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- Views: option_pools & leaderboard
-- ==========================================================

-- View: option_pools (Aggregates real-time live pools and percentages)
CREATE OR REPLACE VIEW public.option_pools AS
WITH opt_user_pools AS (
  SELECT 
    mo.market_id,
    mo.id AS option_id,
    mo.label,
    mo.seed_pool,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'open' OR p.status = 'won' OR p.status = 'lost'), 0)::BIGINT AS user_pool,
    (mo.seed_pool + COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'open' OR p.status = 'won' OR p.status = 'lost'), 0))::BIGINT AS total_pool
  FROM public.market_options mo
  LEFT JOIN public.predictions p ON p.market_id = mo.market_id AND p.option_id = mo.id
  GROUP BY mo.market_id, mo.id, mo.label, mo.seed_pool
),
market_totals AS (
  SELECT 
    market_id,
    SUM(total_pool)::BIGINT AS market_total_pool,
    SUM(user_pool)::BIGINT AS market_total_user_pool
  FROM opt_user_pools
  GROUP BY market_id
)
SELECT 
  oup.market_id,
  oup.option_id,
  oup.label,
  oup.seed_pool,
  oup.user_pool,
  oup.total_pool,
  mt.market_total_pool,
  mt.market_total_user_pool,
  CASE 
    WHEN mt.market_total_pool > 0 THEN 
      ROUND((oup.total_pool::NUMERIC / mt.market_total_pool::NUMERIC) * 100)::INT
    ELSE 0 
  END AS percentage
FROM opt_user_pools oup
JOIN market_totals mt ON mt.market_id = oup.market_id;

-- View: leaderboard
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id AS user_id,
  p.display_name,
  p.hostel,
  p.streak,
  COALESCE(SUM(pred.actual_payout) FILTER (WHERE pred.status = 'won'), 0)::BIGINT - 
  COALESCE(SUM(pred.amount) FILTER (WHERE pred.status IN ('won', 'lost')), 0)::BIGINT AS net_coins_won,
  COUNT(pred.id) FILTER (WHERE pred.status IN ('won', 'lost'))::INT AS resolved_predictions_count,
  CASE 
    WHEN COUNT(pred.id) FILTER (WHERE pred.status IN ('won', 'lost')) > 0 THEN
      ROUND((COUNT(pred.id) FILTER (WHERE pred.status = 'won')::NUMERIC / 
             COUNT(pred.id) FILTER (WHERE pred.status IN ('won', 'lost'))::NUMERIC) * 100)::INT
    ELSE 0
  END AS accuracy,
  p.referral_rewards_earned AS referrals_rewarded
FROM public.profiles p
LEFT JOIN public.predictions pred ON pred.user_id = p.id
WHERE p.onboarded = true
GROUP BY p.id, p.display_name, p.hostel, p.streak, p.referral_rewards_earned;

-- ==========================================================
-- Security & Row Level Security (RLS)
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Markets are viewable by all" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Market options are viewable by all" ON public.market_options FOR SELECT USING (true);
CREATE POLICY "Comments are viewable by all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Predictions viewable by owner or closed" ON public.predictions FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.markets m WHERE m.id = market_id AND m.status != 'open'));
CREATE POLICY "Proposals viewable by owner or admin" ON public.proposals FOR SELECT USING (auth.uid() = creator_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Audit logs viewable by admin" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ==========================================================
-- Postgres RPC Functions (Server-side coin & game logic)
-- ==========================================================

-- RPC 1: complete_onboarding
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

-- Trigger: Automatically create public.profiles row on auth.users sign-up (OAuth / OTP)
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

-- RPC 2: claim_daily
CREATE OR REPLACE FUNCTION public.claim_daily()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_last_claim TIMESTAMPTZ;
  v_now_ist_date DATE;
  v_last_ist_date DATE;
  v_new_balance BIGINT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT daily_claim_last_at, balance INTO v_last_claim, v_new_balance 
  FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  -- IST Date comparison (Asia/Kolkata 00:00 reset)
  v_now_ist_date := (timezone('Asia/Kolkata', now()))::DATE;
  IF v_last_claim IS NOT NULL THEN
    v_last_ist_date := (timezone('Asia/Kolkata', v_last_claim))::DATE;
    IF v_now_ist_date = v_last_ist_date THEN
      RAISE EXCEPTION 'Daily coins already claimed today. Resets at midnight IST.';
    END IF;
  END IF;

  UPDATE public.profiles
  SET balance = balance + 10,
      daily_claim_last_at = now()
  WHERE id = v_user_id
  RETURNING balance INTO v_new_balance;

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: place_prediction
CREATE OR REPLACE FUNCTION public.place_prediction(
  p_market_id UUID,
  p_option_id TEXT,
  p_amount INT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_balance BIGINT;
  v_user_display TEXT;
  v_user_hostel TEXT;
  v_user_referrer UUID;
  v_market_status TEXT;
  v_closing_time TIMESTAMPTZ;
  v_creator_id UUID;
  v_existing_staked BIGINT;
  v_option_total BIGINT;
  v_market_total BIGINT;
  v_estimated_payout INT;
  v_user_pred_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount < 5 OR p_amount > 100 THEN
    RAISE EXCEPTION 'Predictions must be between 5 and 100 coins';
  END IF;

  -- Lock user
  SELECT balance, display_name, hostel, referred_by 
    INTO v_user_balance, v_user_display, v_user_hostel, v_user_referrer
  FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_user_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient coins balance';
  END IF;

  -- Lock market
  SELECT status, closing_time, creator_id 
    INTO v_market_status, v_closing_time, v_creator_id
  FROM public.markets WHERE id = p_market_id FOR UPDATE;

  IF v_market_status != 'open' OR v_closing_time <= now() THEN
    RAISE EXCEPTION 'Market is closed';
  END IF;

  IF v_creator_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot predict on your own proposed market';
  END IF;

  -- Max 100 coins per market check
  SELECT COALESCE(SUM(amount), 0) INTO v_existing_staked
  FROM public.predictions WHERE market_id = p_market_id AND user_id = v_user_id;

  IF v_existing_staked + p_amount > 100 THEN
    RAISE EXCEPTION 'Market limit exceeded. Maximum 100 coins per market.';
  END IF;

  -- Calculate estimated payout using option_pools
  SELECT total_pool, market_total_pool INTO v_option_total, v_market_total
  FROM public.option_pools WHERE market_id = p_market_id AND option_id = p_option_id;

  v_estimated_payout := FLOOR((p_amount::NUMERIC / (COALESCE(v_option_total, 100) + p_amount)) * (COALESCE(v_market_total, 200) + p_amount));

  -- Deduct user coins
  UPDATE public.profiles SET balance = balance - p_amount WHERE id = v_user_id;

  -- Insert prediction
  INSERT INTO public.predictions (user_id, user_display_name, user_hostel, market_id, option_id, amount, estimated_payout)
  VALUES (v_user_id, v_user_display, v_user_hostel, p_market_id, p_option_id, p_amount, v_estimated_payout);

  -- Check if friend's first prediction -> reward referrer with 50 coins!
  SELECT COUNT(id) INTO v_user_pred_count FROM public.predictions WHERE user_id = v_user_id;
  IF v_user_pred_count = 1 AND v_user_referrer IS NOT NULL THEN
    UPDATE public.profiles
    SET balance = balance + 50,
        referral_rewards_earned = referral_rewards_earned + 1
    WHERE id = v_user_referrer AND referral_rewards_earned < 10;
  END IF;

  RETURN jsonb_build_object('success', true, 'estimated_payout', v_estimated_payout);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: resolve_market
CREATE OR REPLACE FUNCTION public.resolve_market(
  p_market_id UUID,
  p_winning_option_id TEXT,
  p_note TEXT DEFAULT 'Resolved as verified.'
) RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_total_user_pool BIGINT;
  v_winning_user_pool BIGINT;
  v_payout_rec RECORD;
  v_calculated_payout BIGINT;
BEGIN
  -- Admin check
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_total_user_pool
  FROM public.predictions WHERE market_id = p_market_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_winning_user_pool
  FROM public.predictions WHERE market_id = p_market_id AND option_id = p_winning_option_id;

  -- If winning option had 0 user bets, refund all stakes
  IF v_winning_user_pool = 0 THEN
    FOR v_payout_rec IN (SELECT id, user_id, amount FROM public.predictions WHERE market_id = p_market_id) LOOP
      UPDATE public.predictions SET status = 'refunded', actual_payout = v_payout_rec.amount WHERE id = v_payout_rec.id;
      UPDATE public.profiles SET balance = balance + v_payout_rec.amount WHERE id = v_payout_rec.user_id;
    END LOOP;
  ELSE
    -- Parimutuel proportional split
    FOR v_payout_rec IN (SELECT id, user_id, option_id, amount FROM public.predictions WHERE market_id = p_market_id) LOOP
      IF v_payout_rec.option_id = p_winning_option_id THEN
        v_calculated_payout := FLOOR((v_payout_rec.amount::NUMERIC / v_winning_user_pool::NUMERIC) * v_total_user_pool::NUMERIC);
        UPDATE public.predictions SET status = 'won', actual_payout = v_calculated_payout WHERE id = v_payout_rec.id;
        UPDATE public.profiles SET balance = balance + v_calculated_payout, streak = streak + 1 WHERE id = v_payout_rec.user_id;
      ELSE
        UPDATE public.predictions SET status = 'lost', actual_payout = 0 WHERE id = v_payout_rec.id;
        UPDATE public.profiles SET streak = 0 WHERE id = v_payout_rec.user_id;
      END IF;
    END LOOP;
  END IF;

  -- Update market state
  UPDATE public.markets 
  SET status = 'resolved',
      winning_option_id = p_winning_option_id,
      resolution_note = p_note,
      resolved_at = now()
  WHERE id = p_market_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 5: cancel_market
CREATE OR REPLACE FUNCTION public.cancel_market(
  p_market_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by admin.'
) RETURNS JSONB AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_pred_rec RECORD;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  -- 100% refund of all stakes
  FOR v_pred_rec IN (SELECT id, user_id, amount FROM public.predictions WHERE market_id = p_market_id) LOOP
    UPDATE public.predictions SET status = 'refunded', actual_payout = v_pred_rec.amount WHERE id = v_pred_rec.id;
    UPDATE public.profiles SET balance = balance + v_pred_rec.amount WHERE id = v_pred_rec.user_id;
  END LOOP;

  UPDATE public.markets
  SET status = 'cancelled',
      resolution_note = p_reason,
      resolved_at = now()
  WHERE id = p_market_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 6: get_public_stats (For landing slide 10 & social proof)
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_students INT;
  v_active_markets INT;
  v_total_calls INT;
BEGIN
  SELECT COUNT(id) INTO v_total_students FROM public.profiles WHERE onboarded = true;
  SELECT COUNT(id) INTO v_active_markets FROM public.markets WHERE status = 'open';
  SELECT COUNT(id) INTO v_total_calls FROM public.predictions;

  RETURN jsonb_build_object(
    'students_count', GREATEST(v_total_students, 48),
    'active_markets_count', GREATEST(v_active_markets, 12),
    'total_predictions_count', GREATEST(v_total_calls, 140)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
