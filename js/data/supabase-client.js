/**
 * BrightSteps — Supabase client bootstrap (CDN).
 * Depends on: supabase-config.js, then @supabase/supabase-js UMD from CDN.
 */
window.BsSupabase = {
  client: null,
  ready: false,
  lastError: null,

  _apiKey() {
    const cfg = window.BRIGHTSTEPS_SUPABASE || {};
    // Prefer legacy anon JWT (eyJ...) if provided — most reliable with supabase-js CDN.
    // Else use publishable key (sb_publishable_...).
    return (cfg.anonKey || cfg.publishableKey || '').trim();
  },

  _projectUrl() {
    const cfg = window.BRIGHTSTEPS_SUPABASE || {};
    let u = String(cfg.url || '').trim().replace(/\/+$/, '');
    // Must be origin only: https://xxxx.supabase.co  (no /rest/v1, no path)
    try {
      if (u) {
        const parsed = new URL(u);
        u = parsed.origin;
      }
    } catch (e) { /* keep as-is */ }
    return u;
  },

  isConfigured() {
    const cfg = window.BRIGHTSTEPS_SUPABASE || {};
    return !!(cfg.enabled && this._projectUrl() && this._apiKey());
  },

  /**
   * Create client once. Safe to call multiple times.
   * @returns {object|null} supabase client or null if offline mode
   */
  init() {
    if (this.client) return this.client;
    if (!this.isConfigured()) {
      this.ready = false;
      this.lastError = 'Supabase not configured — using LocalStorage.';
      return null;
    }
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      this.ready = false;
      this.lastError = 'supabase-js not loaded. Check the CDN script tag in index.html.';
      console.error(this.lastError);
      return null;
    }
    const url = this._projectUrl();
    const key = this._apiKey();
    try {
      this.client = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      this.ready = true;
      this.lastError = null;
      console.info('[BrightSteps] Supabase client ready', url);
      return this.client;
    } catch (e) {
      this.ready = false;
      this.lastError = e.message || String(e);
      console.error('[BrightSteps] Supabase init failed', e);
      return null;
    }
  },

  get() {
    return this.client || this.init();
  },

  /** Current session user or null */
  async getUser() {
    const sb = this.get();
    if (!sb) return null;
    const { data, error } = await sb.auth.getUser();
    if (error) return null;
    return data.user || null;
  },

  /** Profile row for current user */
  async getProfile() {
    const sb = this.get();
    const user = await this.getUser();
    if (!sb || !user) return null;
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.warn('[BrightSteps] profile fetch', error.message);
      return null;
    }
    return data;
  },

  /**
   * Email/password staff login → returns { ok, profile, error }
   */
  async signIn(email, password) {
    const sb = this.get();
    if (!sb) return { ok: false, error: 'Supabase offline — configure URL + API key.' };
    const { data, error } = await sb.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || '')
    });
    if (error) {
      const msg = error.message || 'Login failed';
      // Common misconfig hints
      if (/invalid path|requested path is invalid/i.test(msg)) {
        return {
          ok: false,
          error: msg + ' — Check Project URL is only https://YOUR-REF.supabase.co (no extra path), and prefer the legacy anon key (eyJ…) if publishable key fails.'
        };
      }
      return { ok: false, error: msg };
    }
    let profile = null;
    try {
      profile = await this.getProfile();
    } catch (e) {
      console.warn('[BrightSteps] profile fetch failed after login', e);
    }
    // Profile may be missing if RLS/Data API not exposed yet — still allow session
    if (profile && profile.active === false) {
      await sb.auth.signOut();
      return { ok: false, error: 'This staff account is archived.' };
    }
    if (!profile && data.user) {
      const meta = data.user.user_metadata || {};
      profile = {
        id: data.user.id,
        full_name: meta.full_name || data.user.email || '',
        role: meta.role || 'faculty',
        is_head: meta.role === 'head',
        active: true
      };
    }
    return { ok: true, user: data.user, session: data.session, profile };
  },

  async signOut() {
    const sb = this.get();
    if (!sb) return;
    await sb.auth.signOut();
  },

  statusLabel() {
    const cfg = window.BRIGHTSTEPS_SUPABASE || {};
    if (!cfg.enabled) return 'Supabase disabled in config';
    if (!this._projectUrl()) return 'LocalStorage only (missing project url)';
    if (!this._apiKey()) return 'LocalStorage only (missing anonKey or publishableKey)';
    if (!this.ready) {
      try { this.init(); } catch (e) { /* ignore */ }
    }
    if (!this.ready) return 'Supabase not ready: ' + (this.lastError || 'init failed');
    const keyKind = (cfg.anonKey && String(cfg.anonKey).trim())
      ? 'anon'
      : 'publishable';
    return 'Supabase connected (' + keyKind + ' key)';
  }
};

// Auto-init after scripts load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.BsSupabase.init());
} else {
  window.BsSupabase.init();
}
