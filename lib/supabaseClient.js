/**
 * Supabase client initialisation.
 * Replace the current localStorage auth with Supabase Auth (P0.1 from spec).
 *
 * Setup steps:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
 * 3. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (server-side only, never expose client-side)
 * 4. Run the SQL in database/supabase-schema.sql in the Supabase SQL editor
 * 5. npm install @supabase/supabase-js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY — auth will use fallback');
}

// Public client — safe for client-side use
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Service client — server-side only, bypasses RLS
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Auth helpers (replace localStorage functions in app.js / standalone HTML)
 */
async function signUp({ email, password, name }) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  // Insert profile row
  if (data.user) {
    await supabaseAdmin.from('profiles').insert({
      user_id: data.user.id,
      name,
      plan: 'free',
      credits: 0,
    });
  }
  return data;
}

async function signIn({ email, password }) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function resetPassword(email) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset`,
  });
  if (error) throw error;
}

async function getProfile(userId) {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('user_id', userId).single();
  return data;
}

async function updateProfile(userId, updates) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from('profiles').update(updates).eq('user_id', userId);
}

module.exports = {
  supabase,
  supabaseAdmin,
  signUp,
  signIn,
  signOut,
  getSession,
  resetPassword,
  getProfile,
  updateProfile,
};
