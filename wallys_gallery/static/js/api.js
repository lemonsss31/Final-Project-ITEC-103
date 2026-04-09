/* ═══════════════════════════════════════════════
   api.js  —  Fetch wrapper & Toast notifications
              (used by ALL other JS files)
   ═══════════════════════════════════════════════ */

// ── TOAST ────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons  = { success: '✓', error: '✕', info: 'ℹ' };
  const el     = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span> ${msg}`;
  document.getElementById('toast-container').appendChild(el);

  setTimeout(() => {
    el.style.animation = 'fadeOut .3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// ── API FETCH WRAPPER ────────────────────────────
async function api(path, opts = {}) {
  const res  = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── ESCAPE HTML (prevents XSS) ───────────────────
function escHtml(str = '') {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

// ── TIME AGO ─────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const d   = new Date(ts.replace(' ', 'T') + 'Z');
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60)    return 'just now';
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
