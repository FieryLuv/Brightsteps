/**
 * BrightSteps — Supabase client bootstrap (CDN).
 * Depends on: supabase-config.js, then @supabase/supabase-js UMD from CDN.
 */
window.BsSupabase = {
  client: null,
  ready: false,
  lastError: null,

  isConfigured() {
    const cfg = window.BRIGHTSTEPS_SUPABASE || {};
    return !!(cfg.enabled && cfg.url && cfg.publishableKey);
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
    const cfg = window.BRIGHTSTEPS_SUPABASE;
    try {
      this.client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      this.ready = true;
      this.lastError = null;
      console.info('[BrightSteps] Supabase client ready');
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
    if (!sb) return { ok: false, error: 'Supabase offline — configure URL + publishable key.' };
    const { data, error } = await sb.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || '')
    });
    if (error) return { ok: false, error: error.message };
    const profile = await this.getProfile();
    if (profile && profile.active === false) {
      await sb.auth.signOut();
      return { ok: false, error: 'This staff account is archived.' };
    }
    return { ok: true, user: data.user, session: data.session, profile };
  },

  async signOut() {
    const sb = this.get();
    if (!sb) return;
    await sb.auth.signOut();
  },

  statusLabel() {
    if (!this.isConfigured()) return 'LocalStorage only';
    if (!this.ready) return 'Supabase not ready: ' + (this.lastError || 'init failed');
    return 'Supabase connected';
  }
};

// Auto-init after scripts load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.BsSupabase.init());
} else {
  window.BsSupabase.init();
}
