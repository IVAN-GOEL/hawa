-- ==========================================================
-- seed.sql: Initial Campus Seed Data for Supabase
-- ==========================================================

-- Seed Markets
INSERT INTO public.markets (id, title, description, category, type, closing_time, resolution_source, status, creator_name, reports_count, created_at)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Will Hostel A beat Hostel C in the inter-hostel football final?', 'The grudge match of the season. Golden boot leader vs clean-sheet defence.', 'league', 'binary', timezone('utc'::text, now() + interval '48 hours'), 'Sports Council match sheet', 'open', 'Aarav Patel', 0, now()),
  ('a2222222-2222-2222-2222-222222222222', 'Who will win the inter-department cricket league?', 'CS, Mechanical, Electrical, and Civil clash in the semi-finals.', 'league', 'multiple', timezone('utc'::text, now() + interval '72 hours'), 'Trophy ceremony presentation', 'open', 'Vikram Malhotra', 0, now()),
  ('a3333333-3333-3333-3333-333333333333', 'Who will be the main artist at the upcoming fest?', 'Cultural team teased an indie headliner announcement.', 'fest', 'multiple', timezone('utc'::text, now() + interval '96 hours'), 'Official Fest Instagram teaser poster', 'open', 'Ananya Iyer', 0, now()),
  ('a4444444-4444-4444-4444-444444444444', 'Will the mess serve biryani this Sunday?', 'Weekly mess committee menu vote rumor.', 'campus', 'binary', timezone('utc'::text, now() + interval '30 hours'), 'Sunday lunch counter notice', 'open', 'Sneha Reddy', 0, now()),
  ('a5555555-5555-5555-5555-555555555555', 'Will the library extend its hours during exam week?', 'Student senate petition for 24/7 access.', 'campus', 'binary', timezone('utc'::text, now() + interval '84 hours'), 'Dean student welfare memo', 'open', 'Pooja Nair', 0, now())
ON CONFLICT (id) DO NOTHING;

-- Seed Options for Markets
INSERT INTO public.market_options (market_id, id, label, seed_pool)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'opt-1-yes', 'Yes', 100),
  ('a1111111-1111-1111-1111-111111111111', 'opt-1-no', 'No', 100),
  ('a2222222-2222-2222-2222-222222222222', 'opt-2-cs', 'CS', 100),
  ('a2222222-2222-2222-2222-222222222222', 'opt-2-mech', 'Mechanical', 100),
  ('a2222222-2222-2222-2222-222222222222', 'opt-2-ee', 'Electrical', 100),
  ('a2222222-2222-2222-2222-222222222222', 'opt-2-civil', 'Civil', 100),
  ('a3333333-3333-3333-3333-333333333333', 'opt-3-echo', 'The Echo Waves', 100),
  ('a3333333-3333-3333-3333-333333333333', 'opt-3-tarang', 'DJ Tarang', 100),
  ('a3333333-3333-3333-3333-333333333333', 'opt-3-zariya', 'Zariya Collective', 100),
  ('a4444444-4444-4444-4444-444444444444', 'opt-4-yes', 'Yes', 100),
  ('a4444444-4444-4444-4444-444444444444', 'opt-4-no', 'No', 100),
  ('a5555555-5555-5555-5555-555555555555', 'opt-5-yes', 'Yes', 100),
  ('a5555555-5555-5555-5555-555555555555', 'opt-5-no', 'No', 100)
ON CONFLICT (market_id, id) DO NOTHING;
