/**
 * BrightSteps — Supabase connection (fill once per environment).
 *
 * 1. Supabase Dashboard → Project Settings → API
 * 2. Paste Project URL + Publishable key below
 * 3. Never put the Secret key in this file
 *
 * Leave both empty to keep LocalStorage-only mode (current offline demo).
 */
window.BRIGHTSTEPS_SUPABASE = {
  /** e.g. https://xxxxxxxx.supabase.co */
  url: 'https://uisazoexicjwnsfjkctl.supabase.co',
  /** Publishable key: sb_publishable_... (or legacy anon jwt) */
  publishableKey: 'sb_publishable_LKh0_Pr_4hceuh5zMbb3_Q_aozZWwtV',
  /**
   * true  → try online Auth + DB when url/key are set
   * false → force LocalStorage only
   */
  enabled: true,
  /**
   * Optional: map offline demo usernames → Supabase Auth emails
   * so you can still type "irish" when online.
   * Example: { irish: 'irish.abordo@ncdc.medina.local', maria: 'maria.santos@ncdc.medina.local' }
   */
  usernameEmailMap: {
    irish: 'irishabordo@gmail.com',
    maria: 'mariasantos@gmai.com'
  }
};
