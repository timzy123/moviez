/* ── MOVIEZ SUPABASE UTILS ── */

const SUPABASE_URL = 'https://pnlrmmxaagwritrfpjte.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHJtbXhhYWd3cml0cmZwanRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjQ3MjcsImV4cCI6MjA4OTI0MDcyN30.khxQtOzE4G0hdSgVYkFdkS5FXusvoUo5LlzMp4JJWqQ';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ── HELPERS ── */
function getRank(n) {
  if (n >= 100) return 'Cinéaste';
  if (n >= 50)  return 'Cinephile';
  if (n >= 30)  return 'Movie Freak';
  if (n >= 20)  return 'Movie Buff';
  if (n >= 10)  return 'Movie Watcher';
  return 'Newbie';
}

function timeAgo(ts) {
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60)    return 'just now';
  if (d < 3600)  return Math.floor(d / 60) + ' min ago';
  if (d < 86400) return Math.floor(d / 3600) + ' hr ago';
  return Math.floor(d / 86400) + ' days ago';
}

function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function pad(n) { return String(n).padStart(2, '0'); }

function toast(msg, dur = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), dur);
}

/* ── AUTH HELPERS ── */
async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function requireAuth() {
  const user = await getUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  const profile = await getProfile(user.id);
  return { user, profile };
}

/* ── STREAK UPDATE ── */
async function updateStreak(userId, profile, perfect) {
  const today = new Date().toISOString().split('T')[0];
  const last = profile.last_watched_date;

  if (last === today) return profile;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  let newStreak = profile.streak_count || 0;
  if (last === yStr) {
    newStreak++;
  } else if (last === null || last === undefined) {
    newStreak = 1;
  } else {
    newStreak = 1;
  }

  const updates = {
    last_watched_date: today,
    streak_count: newStreak,
    total_watched: (profile.total_watched || 0) + 1,
    stars_earned: (profile.stars_earned || 0) + (perfect ? 1 : 0)
  };

  await sb.from('profiles').update(updates).eq('id', userId);
  return { ...profile, ...updates };
}

/* ── TIMER ── */
function startTimer() {
  function tick() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.floor((midnight - now) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    const el = document.getElementById('timer');
    if (el) el.textContent = pad(h) + ':' + pad(m) + ':' + pad(s);
    const fill = document.getElementById('timer-fill');
    if (fill) fill.style.width = Math.round(((86400 - diff) / 86400) * 100) + '%';
  }
  tick();
  setInterval(tick, 1000);
}
