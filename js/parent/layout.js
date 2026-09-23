/**
 * Parent shell — header + optional multi-child switcher + full-width content.
 */

const ParentLayout = {
  render(user) {
    const app = document.getElementById('app');
    const children = user.children || [];
    const active = children.find(c => c.id === user.activeChildId) || children[0];
    const activeName = active ? active.name : (user.childName || 'Child');
    const activeCode = active && active.childCode ? active.childCode : '';

    let switcher = '';
    if (children.length > 1) {
      const chips = children.map(c => {
        const isActive = active && c.id === active.id;
        return `<button type="button"
          class="btn ${isActive ? 'btn-blue' : ''}"
          style="padding:0.35rem 0.75rem;font-size:0.82rem;${isActive ? '' : 'background:#e8e8e8;color:var(--text);'}"
          onclick="BrightSteps.selectChild(${c.id})">${c.name}
          <span style="opacity:0.85;font-weight:500;">${c.childCode ? ' · ' + c.childCode : ''}</span>
        </button>`;
      }).join('');
      switcher = `
        <div style="background:#e3f2fd;padding:0.65rem 2rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;border-bottom:1px solid var(--border);">
          <span style="font-size:0.85rem;font-weight:600;color:var(--primary-dark);margin-right:0.35rem;">Your children:</span>
          ${chips}
        </div>`;
    }

    app.innerHTML = `
      <header class="parent-header">
        <div class="logo">🌱 BrightSteps</div>
        <div class="user-info">
          ${user.name} · Parent / Guardian
          ${activeCode ? `<span class="text-muted" style="margin-left:0.35rem;font-size:0.85rem;">(${activeCode})</span>` : ''}
          <button class="btn" style="margin-left:1rem; padding:0.3rem 0.7rem; font-size:0.8rem;" onclick="BrightSteps.logout()">Logout</button>
        </div>
      </header>
      ${switcher}
      <div style="padding:1.75rem 2rem; overflow-y:auto; height:calc(100vh - var(--header-height)${children.length > 1 ? ' - 48px' : ''});" id="main-content"></div>
    `;
    ParentDashboard.render(document.getElementById('main-content'), user);
  }
};

if (typeof window !== 'undefined') window.ParentLayout = ParentLayout;
