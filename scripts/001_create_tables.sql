-- F1 Prediction League - Database Schema
-- Groups table for friend groups (invite code system)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Players (no auth, just name + group)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, name)
);

-- Drivers (seeded with 2026 lineup)
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  short_name TEXT NOT NULL,
  number INTEGER,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL
);

-- Races (seeded with 2026 calendar)
CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY,
  round INTEGER NOT NULL,
  race_name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  race_date DATE NOT NULL,
  qualifying_date TIMESTAMPTZ,
  is_sprint BOOLEAN DEFAULT false,
  results_fetched BOOLEAN DEFAULT false,
  qualifying_fetched BOOLEAN DEFAULT false
);

-- Actual race results (populated by API fetch)
CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id TEXT NOT NULL REFERENCES races(id),
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  position INTEGER NOT NULL,
  points NUMERIC DEFAULT 0,
  UNIQUE(race_id, driver_id)
);

-- Actual qualifying results (for pole position)
CREATE TABLE IF NOT EXISTS qualifying_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id TEXT NOT NULL REFERENCES races(id),
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  grid_position INTEGER NOT NULL,
  UNIQUE(race_id, driver_id)
);

-- Race predictions (winner + podium + P4-P10 + pole)
CREATE TABLE IF NOT EXISTS race_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  race_id TEXT NOT NULL REFERENCES races(id),
  pole_prediction TEXT REFERENCES drivers(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, race_id)
);

-- Individual position predictions within a race prediction
CREATE TABLE IF NOT EXISTS race_prediction_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES race_predictions(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  predicted_position INTEGER NOT NULL CHECK (predicted_position BETWEEN 1 AND 10),
  UNIQUE(prediction_id, predicted_position),
  UNIQUE(prediction_id, driver_id)
);

-- WDC end-of-season predictions
CREATE TABLE IF NOT EXISTS wdc_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id)
);

-- Individual driver positions within WDC prediction
CREATE TABLE IF NOT EXISTS wdc_prediction_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES wdc_predictions(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES drivers(id),
  predicted_position INTEGER NOT NULL CHECK (predicted_position BETWEEN 1 AND 22),
  UNIQUE(prediction_id, predicted_position),
  UNIQUE(prediction_id, driver_id)
);

-- Scoring ledger (computed after each race)
CREATE TABLE IF NOT EXISTS player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  race_id TEXT REFERENCES races(id),
  score_type TEXT NOT NULL CHECK (score_type IN ('race', 'pole', 'wdc')),
  points INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB,
  UNIQUE(player_id, race_id, score_type)
);

-- Disable RLS (trusted friend group model, invite code acts as access control)
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE races DISABLE ROW LEVEL SECURITY;
ALTER TABLE race_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE qualifying_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE race_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE race_prediction_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wdc_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE wdc_prediction_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_scores DISABLE ROW LEVEL SECURITY;
