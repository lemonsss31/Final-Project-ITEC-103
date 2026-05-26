/* ═══════════════════════════════════════════════
   main.js  —  Entry point · Left panel · Search
   ═══════════════════════════════════════════════ */

window.currentUser = null;

async function init() {
  buildAuthHTML();
  buildUploadModal();
  buildLeftPanel();

  const r = await api('/api/auth/me');
  if (r.ok && r.data.user) {
    window.currentUser = r.data.user;
    enterApp();
  } else {
    showLogin();
  }
}

function enterApp() {
  document.getElementById('auth-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('nav-username').textContent = window.currentUser.username;
  updateNavAvatar(window.currentUser.avatar, window.currentUser.username);
  loadTags();
  loadPhotos();
  refreshLeftPanelTags();
}

// ── LEFT PANEL ────────────────────────────────────
function buildLeftPanel() {
  const panel = document.getElementById('left-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="lp-section-label">Navigate</div>
    <button class="lp-btn active" id="lp-all" onclick="lp_allPhotos(this)">
      <span class="lp-icon">✦</span> All Wally
    </button>
    <button class="lp-btn" id="lp-mine" onclick="lp_myPhotos(this)">
      <span class="lp-icon">👤</span> My Wally
    </button>
    <button class="lp-btn" onclick="loadRandomPhoto()">
      <span class="lp-icon">🎲</span> Random Wally
    </button>

    <div class="lp-divider"></div>
    <div class="lp-section-label">Upload</div>
    <button class="lp-btn" onclick="openUploadModal()">
      <span class="lp-icon">＋</span> Upload Wally
    </button>

    <div class="lp-divider"></div>
    <div class="lp-section-label">Sort By</div>
    <button class="lp-btn active" id="lp-sort-new" onclick="lp_sort('newest', this)">
      <span class="lp-icon">🕐</span> Newest Bayola First
    </button>
    <button class="lp-btn" id="lp-sort-liked" onclick="lp_sort('liked', this)">
      <span class="lp-icon">❤️</span> Most Bayo-Liked
    </button>

    <div class="lp-divider"></div>
    <div class="lp-trending" id="lp-trending-box">
      <div class="lp-trending-title">Trending Bayolas</div>
      <div id="lp-trending-tags" style="color:var(--muted);font-size:12px">Loading…</div>
    </div>

    <div class="lp-divider"></div>
    <div class="lp-section-label">Community</div>
    <button class="lp-btn" onclick="openUsersBrowser()">
      <span class="lp-icon">👥</span> Browse Bayolas
    </button>

    <div style="margin-top:auto;padding-top:16px;">
      <button class="lp-btn" onclick="openSidebar()">
        <span class="lp-icon">⚙️</span> My Bayola
      </button>
      <button class="lp-btn" onclick="doLogout()" style="color:var(--rose)">
        <span class="lp-icon">🚪</span> Logout
      </button>
    </div>
  `;
}

window._currentSort = 'newest';

function lp_setActive(btn, groupPrefix) {
  document.querySelectorAll(`[id^="${groupPrefix}"]`).forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function lp_allPhotos(btn) {
  lp_setActive(btn, 'lp-all');
  clearNavSearch();
  const allPill = document.querySelector('.tag-pill');
  if (allPill) filterTag(null, allPill);
  else loadPhotos();
}

function lp_myPhotos(btn) {
  lp_setActive(btn, 'lp-mine');
  if (window.currentUser) {
    loadPhotosByUser(window.currentUser.id, window.currentUser.username);
  }
}

function lp_sort(mode, btn) {
  window._currentSort = mode;
  document.querySelectorAll('[id^="lp-sort"]').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadPhotos(window.activeTag, mode);
}

async function refreshLeftPanelTags() {
  const r = await api('/api/tags');
  const box = document.getElementById('lp-trending-tags');
  if (!box) return;
  if (!r.ok || !r.data.length) {
    box.innerHTML = '<span style="color:var(--muted)">No tags yet</span>';
    return;
  }
  box.innerHTML = r.data.slice(0,6).map(t =>
    `<span class="lp-tag-item" onclick="lp_filterTag('${escHtml(t.tag)}')">
      #${escHtml(t.tag)} <span class="lp-tag-count">${t.count}</span>
    </span>`
  ).join('');
}

function lp_filterTag(tag) {
  const pill = Array.from(document.querySelectorAll('.tag-pill'))
    .find(p => p.textContent.startsWith('#'+tag));
  if (pill) filterTag(tag, pill);
  else loadPhotos(tag);
}

// ── NAV SEARCH ────────────────────────────────────
let _searchDebounce = null;

function handleNavSearch(val) {
  const clearBtn = document.getElementById('nav-search-clear');
  if (clearBtn) clearBtn.classList.toggle('hidden', !val.trim());
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(() => {
    const tag = val.trim();
    if (!tag) {
      const allPill = document.querySelector('.tag-pill');
      if (allPill) filterTag(null, allPill);
      return;
    }
    showSearchBanner(tag);
    loadPhotos(tag, window._currentSort);
    activeTag = tag;
  }, 350);
}

function commitNavSearch() {
  const val = (document.getElementById('nav-search-input')?.value||'').trim();
  if (val) { showSearchBanner(val); loadPhotos(val, window._currentSort); activeTag = val; }
}

function showSearchBanner(tag) {
  document.getElementById('search-banner')?.remove();
  const hero = document.querySelector('.gallery-hero');
  if (!hero) return;
  const banner = document.createElement('div');
  banner.id = 'search-banner';
  banner.className = 'search-banner';
  banner.innerHTML = `
    <span>Showing results for <strong>#${escHtml(tag)}</strong></span>
    <button onclick="clearNavSearch()" style="background:none;border:none;color:var(--rose);cursor:pointer;font-size:13px">✕ Clear</button>`;
  hero.insertAdjacentElement('afterend', banner);
  document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
}

function clearNavSearch() {
  const input = document.getElementById('nav-search-input');
  if (input) input.value = '';
  document.getElementById('nav-search-clear')?.classList.add('hidden');
  document.getElementById('search-banner')?.remove();
  const allPill = document.querySelector('.tag-pill');
  if (allPill) filterTag(null, allPill);
}

// ── ESCAPE ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeLightbox();
    closeUploadModal();
    closeSidebar();
    clearNavSearch();
    document.getElementById('random-spotlight')?.remove();
    document.getElementById('user-profile-card')?.remove();
    document.getElementById('edit-modal-overlay')?.remove();
  }
});

init();
