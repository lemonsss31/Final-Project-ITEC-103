/* ═══════════════════════════════════════════════
   sidebar.js  —  Profile Sidebar
                  Avatar · Bio · Stats · Follow counts
                  Account deletion
   ═══════════════════════════════════════════════ */

function buildSidebar() {
  document.getElementById('profile-sidebar')?.remove();
  const sidebar = document.createElement('div');
  sidebar.id = 'profile-sidebar';
  sidebar.className = 'profile-sidebar hidden';
  sidebar.innerHTML = `
    <div class="sidebar-backdrop" onclick="closeSidebar()"></div>
    <div class="sidebar-panel">

      <div class="sidebar-header">
        <h3>Bayola's Account</h3>
        <button class="modal-close" onclick="closeSidebar()">✕</button>
      </div>

      <!-- Avatar + name -->
      <div class="sidebar-avatar-wrap">
        <div class="sidebar-avatar-container" onclick="triggerAvatarUpload()" title="Change profile picture">
          <div class="sidebar-avatar" id="sb-avatar-display">?</div>
          <div class="sidebar-avatar-overlay">📷</div>
        </div>
        <div>
          <div class="sidebar-name" id="sb-name">—</div>
          <div class="sidebar-email" id="sb-email">—</div>
          <button class="sb-change-pic-btn" onclick="triggerAvatarUpload()">Change photo</button>
        </div>
      </div>
      <input type="file" id="avatar-file-input"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        style="display:none" onchange="handleAvatarChange(event)" />

      <!-- Stats -->
      <div class="sidebar-stats">
        <div class="sb-stat">
          <span class="sb-stat-val" id="sb-photos">—</span>
          <span class="sb-stat-label">Wallys</span>
        </div>
        <div class="sb-stat">
          <span class="sb-stat-val" id="sb-followers">—</span>
          <span class="sb-stat-label">Followers</span>
        </div>
        <div class="sb-stat">
          <span class="sb-stat-val" id="sb-following">—</span>
          <span class="sb-stat-label">Following</span>
        </div>
      </div>

      <!-- Bio -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">Bio-la</div>
        <div id="sb-bio-display" style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:8px;font-style:italic">No bio yet</div>
        <div id="sb-bio-edit" style="display:none;flex-direction:column;gap:8px">
          <textarea class="input" id="sb-bio-input" rows="3" maxlength="200"
            placeholder="Tell the gallery about yourself… (max 200 chars)"></textarea>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" style="flex:1" onclick="saveBio()">Save</button>
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="cancelBioEdit()">Cancel</button>
          </div>
        </div>
        <button class="sb-action-btn" id="sb-bio-edit-btn" onclick="startBioEdit()" style="margin-top:4px">
          <span>✏️</span> Edit Bio-la
        </button>
      </div>

      <!-- Account Info -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">Bayola's Info</div>
        <div class="sb-info-row">
          <span class="sb-info-label">Username</span>
          <span class="sb-info-val" id="sb-info-username">—</span>
        </div>
        <div class="sb-info-row">
          <span class="sb-info-label">Email</span>
          <span class="sb-info-val" id="sb-info-email">—</span>
        </div>
        <div class="sb-info-row">
          <span class="sb-info-label">Bayola since</span>
          <span class="sb-info-val" id="sb-info-joined">—</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="sidebar-section">
        <div class="sidebar-section-title">Quick Actions</div>
        <button class="sb-action-btn" onclick="closeSidebar(); openUploadModal()">
          <span>🖼️</span> Upload a Wally
        </button>
        <button class="sb-action-btn" onclick="closeSidebar(); filterTag(null, document.querySelector('.tag-pill'))">
          <span>✦</span> Browse All Wally
        </button>
        <button class="sb-action-btn" onclick="closeSidebar(); filterMyPhotos()">
          <span>👤</span> My Wally Only
        </button>
        <button class="sb-action-btn" onclick="closeSidebar(); loadRandomPhoto()">
          <span>🎲</span> Random Wally
        </button>
      </div>

      <!-- Danger Zone -->
      <div class="sidebar-section sidebar-danger-zone">
        <div class="sidebar-section-title" style="color:var(--rose)">Bayola's Danger Zone</div>
        <p style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.5">
          Wally will delete ypur account permanently. All your photos, likes, and comments will be bayola'ed forever.
        </p>
        <button class="btn btn-danger btn-full btn-sm" onclick="confirmDeleteAccount()">
          Delete Bayola's Account
        </button>
      </div>

    </div>
  `;
  document.body.appendChild(sidebar);
}

// ── OPEN / CLOSE ──────────────────────────────────
async function openSidebar() {
  buildSidebar();
  const sidebar = document.getElementById('profile-sidebar');
  sidebar.classList.remove('hidden');
  requestAnimationFrame(() => sidebar.classList.add('open'));

  const r = await api('/api/auth/me');
  if (!r.ok || !r.data.user) return;
  const u = r.data.user;

  setAvatarDisplay(u.avatar, u.username);
  document.getElementById('sb-name').textContent          = u.username;
  document.getElementById('sb-email').textContent         = u.email;
  document.getElementById('sb-info-username').textContent = u.username;
  document.getElementById('sb-info-email').textContent    = u.email;

  const bioDisplay = document.getElementById('sb-bio-display');
  if (bioDisplay) {
    bioDisplay.textContent  = u.bio || 'No bio yet';
    bioDisplay.style.fontStyle = u.bio ? 'normal' : 'italic';
  }
  const bioInput = document.getElementById('sb-bio-input');
  if (bioInput) bioInput.value = u.bio || '';

  if (u.created_at) {
    const d = new Date(u.created_at.replace(' ','T')+'Z');
    document.getElementById('sb-info-joined').textContent =
      d.toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'});
  }

  loadSidebarStats(u.id);
}

function closeSidebar() {
  const sidebar = document.getElementById('profile-sidebar');
  if (!sidebar) return;
  sidebar.classList.remove('open');
  setTimeout(() => sidebar.classList.add('hidden'), 300);
}

// ── AVATAR ────────────────────────────────────────
function setAvatarDisplay(avatarUrl, username) {
  const el = document.getElementById('sb-avatar-display');
  if (!el) return;
  const initial = (username||'?').charAt(0).toUpperCase();
  if (avatarUrl) {
    el.innerHTML = `<img src="${avatarUrl}?t=${Date.now()}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  } else {
    el.textContent = initial;
  }
  updateNavAvatar(avatarUrl, username);
}

function updateNavAvatar(avatarUrl, username) {
  const navAv = document.getElementById('nav-avatar');
  if (!navAv) return;
  const initial = (username||'?').charAt(0).toUpperCase();
  if (avatarUrl) {
    navAv.innerHTML = `<img src="${avatarUrl}?t=${Date.now()}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  } else {
    navAv.textContent = initial;
  }
}

function triggerAvatarUpload() {
  document.getElementById('avatar-file-input')?.click();
}

async function handleAvatarChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2*1024*1024) { toast('Image too large. Max 2MB.','error'); return; }
  const avEl = document.getElementById('sb-avatar-display');
  if (avEl) avEl.style.opacity = '0.5';
  toast('Uploading photo...','info');
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const r = await api('/api/auth/update-avatar', {
      method:'POST', body: JSON.stringify({avatar: ev.target.result})
    });
    if (avEl) avEl.style.opacity = '1';
    if (r.ok) {
      toast('Profile picture updated!','success');
      if (window.currentUser) window.currentUser.avatar = r.data.avatar;
      setAvatarDisplay(r.data.avatar, window.currentUser?.username);
    } else {
      toast(r.data.error||'Upload failed','error');
    }
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// ── BIO ───────────────────────────────────────────
function startBioEdit() {
  document.getElementById('sb-bio-display').style.display = 'none';
  document.getElementById('sb-bio-edit-btn').style.display = 'none';
  const editEl = document.getElementById('sb-bio-edit');
  editEl.style.display = 'flex';
  document.getElementById('sb-bio-input')?.focus();
}

function cancelBioEdit() {
  document.getElementById('sb-bio-display').style.display = '';
  document.getElementById('sb-bio-edit-btn').style.display = '';
  document.getElementById('sb-bio-edit').style.display = 'none';
}

async function saveBio() {
  const bio = document.getElementById('sb-bio-input')?.value.trim() || '';
  const r = await api('/api/auth/update-bio', { method:'POST', body: JSON.stringify({bio}) });
  if (r.ok) {
    toast('Bio updated!','success');
    const display = document.getElementById('sb-bio-display');
    if (display) {
      display.textContent  = r.data.bio || 'No bio yet';
      display.style.fontStyle = r.data.bio ? 'normal' : 'italic';
    }
    cancelBioEdit();
  } else {
    toast(r.data.error||'Could not save bio','error');
  }
}

// ── STATS ─────────────────────────────────────────
async function loadSidebarStats(userId) {
  const r = await api(`/api/users/${userId}/stats`);
  if (!r.ok) return;
  document.getElementById('sb-photos').textContent    = r.data.photos    ?? '—';
  document.getElementById('sb-followers').textContent = r.data.followers  ?? '—';
  document.getElementById('sb-following').textContent = r.data.following  ?? '—';
}

// ── MY PHOTOS ─────────────────────────────────────
function filterMyPhotos() {
  if (!window.currentUser) return;
  loadPhotosByUser(window.currentUser.id, window.currentUser.username);
}

// ── DELETE ACCOUNT ────────────────────────────────
function confirmDeleteAccount() {
  closeSidebar();
  setTimeout(() => {
    const overlay = document.createElement('div');
    overlay.id = 'delete-account-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9100;background:#00000099;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:overlayIn .2s ease';
    overlay.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--rose);border-radius:20px;padding:36px 32px;width:100%;max-width:400px;text-align:center;animation:cardIn .3s ease;">
        <div style="font-size:42px;margin-bottom:12px">⚠️</div>
        <h3 style="font-family:var(--font-head);font-size:22px;margin-bottom:8px;color:var(--rose)">Delete Account?</h3>
        <p style="font-size:14px;color:var(--muted);margin-bottom:16px;line-height:1.6">
          This action <strong style="color:var(--text)">cannot be undone</strong>.
          Your account, all photos, comments and likes will be permanently deleted.
        </p>
        <div class="input-group" style="text-align:left;margin-bottom:20px">
          <label style="font-size:12px;color:var(--muted);display:block;margin-bottom:6px">
            Type <strong style="color:var(--rose)">DELETE</strong> to confirm
          </label>
          <input class="input" id="delete-confirm-input" placeholder="Type DELETE here" oninput="checkDeleteInput()" />
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-ghost btn-full" onclick="document.getElementById('delete-account-overlay').remove()">Cancel</button>
          <button class="btn btn-danger btn-full" id="delete-confirm-btn" onclick="doDeleteAccount()" disabled style="opacity:0.4">Delete Forever</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });
  }, 320);
}

function checkDeleteInput() {
  const val = document.getElementById('delete-confirm-input')?.value||'';
  const btn = document.getElementById('delete-confirm-btn');
  if (!btn) return;
  const ok = val.trim()==='DELETE';
  btn.disabled = !ok;
  btn.style.opacity = ok ? '1' : '0.4';
}

async function doDeleteAccount() {
  const btn = document.getElementById('delete-confirm-btn');
  if (btn) { btn.innerHTML='<div class="spinner"></div>'; btn.disabled=true; }
  const r = await api('/api/auth/delete-account', { method:'DELETE' });
  document.getElementById('delete-account-overlay')?.remove();
  if (r.ok) {
    window.currentUser = null;
    toast('Account deleted. Goodbye!','info');
    setTimeout(() => {
      showLogin();
      const li=document.getElementById('login-identifier');
      const lp=document.getElementById('login-password');
      if (li) li.value='';
      if (lp) lp.value='';
    }, 400);
  } else {
    toast(r.data.error||'Could not delete account','error');
  }
}
