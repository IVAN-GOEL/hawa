-- Hawa (PostgreSQL / Supabase Schema)
-- Production migration for live database & OAuth

-- 1. Profiles (linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  hostel TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  balance BIGINT NOT NULL DEFAULT 100 CHECK (balance >= 0),
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  referral_rewards_earned INT NOT NULL DEFAULT 0 CHECK (referral_rewards_earned <= 10),
  daily_claim_last_at TIMESTAMPTZ,
  streak INT NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT ARRAY['First Call'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Markets
CREATE TABLE IF NOT EXISTS public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('league', 'fest', 'campus')),
  type TEXT NOT NULL CHECK (type IN ('binary', 'multiple')),
  closing_time TIMESTAMPTZ NOT NULL,
  resolution_source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')),
  creator_id UUID REFERENCES public.profiles(id),
  total_pool BIGINT NOT NULL DEFAULT 0,
  total_user_pool BIGINT NOT NULL DEFAULT 0,
  winning_option_id TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  reports_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Options
CREATE TABLE IF NOT EXISTS public.market_options (
  id TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  user_pool BIGINT NOT NULL DEFAULT 0,
  seed_pool BIGINT NOT NULL DEFAULT 100,
  total_pool BIGINT NOT NULL DEFAULT 100,
  percentage INT NOT NULL DEFAULT 50,
  PRIMARY KEY (market_id, id)
);

-- 4. Predictions
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  amount INT NOT NULL CHECK (amount >= 5 AND amount <= 100),
  estimated_payout INT NOT NULL,
  actual_payout INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Proposals
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
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

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_market_id UUID,
  details TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies: public reads for markets and options
CREATE POLICY "Markets are viewable by authenticated users" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Market options are viewable by authenticated users" ON public.market_options FOR SELECT USING (true);
CREATE POLICY "User predictions viewable by owner or market closed" ON public.predictions FOR SELECT USING (auth.uid() = user_id);

-- Atomic Prediction RPC with Row Lock (prevents double spend)
CREATE OR REPLACE FUNCTION place_prediction_atomic(
  p_market_id UUID,
  p_option_id TEXT,
  p_amount INT
) RETURNS JSONB AS $$
DECLARE
  v_user_balance BIGINT;
  v_market_status TEXT;
  v_closing_time TIMESTAMPTZ;
  v_creator_id UUID;
  v_option_pool BIGINT;
  v_market_pool BIGINT;
  v_new_prediction_id UUID;
BEGIN
  -- Lock user profile row
  SELECT balance INTO v_user_balance FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF v_user_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient coins balance';
  END IF;

  -- Lock market row
  SELECT status, closing_time, creator_id, total_pool
    INTO v_market_status, v_closing_time, v_creator_id, v_market_pool
    FROM public.markets WHERE id = p_market_id FOR UPDATE;

  IF v_market_status != 'open' OR v_closing_time <= now() THEN
    RAISE EXCEPTION 'Market is closed';
  END IF;

  IF v_creator_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot predict on own proposed market';
  END IF;

  -- Deduct user coins
  UPDATE public.profiles SET balance = balance - p_amount WHERE id = auth.uid();

  -- Update option & market pools
  UPDATE public.market_options
    SET user_pool = user_pool + p_amount, total_pool = total_pool + p_amount
    WHERE market_id = p_market_id AND id = p_option_id;

  UPDATE public.markets
    SET total_user_pool = total_user_pool + p_amount, total_pool = total_pool + p_amount
    WHERE id = p_market_id;

  -- Insert prediction
  INSERT INTO public.predictions (user_id, market_id, option_id, amount, estimated_payout)
    VALUES (auth.uid(), p_market_id, p_option_id, p_amount, FLOOR((p_amount::NUMERIC / (v_option_pool + p_amount)) * (v_market_pool + p_amount)))
    RETURNING id INTO v_new_prediction_id;

  RETURN jsonb_build_object('success', true, 'prediction_id', v_new_prediction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
