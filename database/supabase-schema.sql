-- PTEMaster Supabase Schema (Part 4 of the build spec)
-- Run this in the Supabase SQL editor after creating your project.

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  plan        text NOT NULL DEFAULT 'free', -- free | credits | smart_prep | annual
  credits     int  NOT NULL DEFAULT 0,
  joined_at   timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz,
  streak_days int NOT NULL DEFAULT 0,
  xp_points   int NOT NULL DEFAULT 0
);

-- ── test_attempts ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  test_id      text NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  scores       jsonb, -- { speaking, writing, reading, listening, overall }
  answers      jsonb  -- array of { q_id, answer, score, time_taken }
);

-- ── coaching_sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES test_attempts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  messages   jsonb, -- array of { role, label, content, timestamp }
  drills     jsonb  -- array of { id, type, instruction, content, focus_tag, completed }
);

-- ── action_plan ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_plan (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  session_id   uuid REFERENCES coaching_sessions(id) ON DELETE SET NULL,
  drill        jsonb NOT NULL, -- { type, instruction, content, focus_tag }
  assigned_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz  -- null until done
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plan      ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_profile
  ON profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_own_attempts
  ON test_attempts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_own_sessions
  ON coaching_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY user_own_action_plan
  ON action_plan FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_attempts_user     ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test     ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user     ON coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_attempt  ON coaching_sessions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_action_plan_user  ON action_plan(user_id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, plan, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free',
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
