/* ═══════════════════════════════════════════════
   gallery.js  —  Photo grid · Likes · Comments
                  Tags · Lightbox · Edit · Profile card
   ═══════════════════════════════════════════════ */

let activeTag = null;

// ── PAGINATION STATE ──────────────────────────────
let _allPhotos  = [];   // full fetched list
let _currentPage = 1;
const PAGE_SIZE  = 10;

// ── TAGS ──────────────────────────────────────────
async function loadTags() {
  const r = await api('/api/tags');
  if (!r.ok) return;
  const bar = document.getElementById('tags-bar');
  bar.querySelectorAll('.tag-pill:not(:first-of-type)').forEach(p => p.remove());
  r.data.forEach(t => {
    const btn = document.createElement('button');
    btn.className   = 'tag-pill';
    btn.textContent = `#${t.tag} (${t.count})`;
    btn.onclick     = () => filterTag(t.tag, btn);
    bar.appendChild(btn);
  });
}

function filterTag(tag, el) {
  activeTag = tag;
  document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  loadPhotos(tag);
}

// ── LOAD PHOTOS ───────────────────────────────────
async function loadPhotos(tag = null, sort = 'newest') {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = [280,200,340,260,180,300,250,220]
    .map(h => `<div class="skeleton sk-card" style="height:${h}px"></div>`)
    .join('');

  const url = tag ? `/api/photos?tag=${encodeURIComponent(tag)}` : '/api/photos';
  const r   = await api(url);
  if (!r.ok) { toast('Failed to load photos','error'); return; }

  let photos = r.data;
  if (sort === 'liked') photos = [...photos].sort((a,b) => b.likes - a.likes);

  _allPhotos   = photos;
  _currentPage = 1;
  renderPage();
}

function renderPage() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';

  if (!_allPhotos.length) {
    grid.innerHTML = `
      <div class="empty-state" style="column-span:all">
        <div class="icon">📷</div>
        <p>No photos yet${activeTag ? ` tagged #${activeTag}` : ''}.</p>
        <p style="font-size:12px;margin-top:8px">Be the first to upload!</p>
      </div>`;
    renderPagination();
    return;
  }

  const start = (_currentPage - 1) * PAGE_SIZE;
  const slice = _allPhotos.slice(start, start + PAGE_SIZE);
  slice.forEach((p, i) => grid.insertAdjacentHTML('beforeend', buildPhotoCard(p, i)));
  renderPagination();
}

function renderPagination() {
  document.getElementById('pagination-bar')?.remove();
  const totalPages = Math.ceil(_allPhotos.length / PAGE_SIZE);
  if (totalPages <= 1) return;

  const bar = document.createElement('div');
  bar.id = 'pagination-bar';
  bar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:28px 0 12px;column-span:all;width:100%';

  const prevBtn = `<button onclick="changePage(${_currentPage - 1})"
    style="padding:7px 16px;border-radius:8px;border:1px solid var(--border);background:transparent;color:${_currentPage === 1 ? 'var(--muted)' : 'var(--text)'};cursor:${_currentPage === 1 ? 'not-allowed' : 'pointer'};font-family:var(--font-body);font-size:13px"
    ${_currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;

  const nextBtn = `<button onclick="changePage(${_currentPage + 1})"
    style="padding:7px 16px;border-radius:8px;border:1px solid var(--border);background:transparent;color:${_currentPage === totalPages ? 'var(--muted)' : 'var(--text)'};cursor:${_currentPage === totalPages ? 'not-allowed' : 'pointer'};font-family:var(--font-body);font-size:13px"
    ${_currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;

  let pageButtons = '';
  for (let i = 1; i <= totalPages; i++) {
    const active = i === _currentPage;
    pageButtons += `<button onclick="changePage(${i})"
      style="width:34px;height:34px;border-radius:8px;border:1px solid ${active ? 'var(--accent)' : 'var(--border)'};
      background:${active ? 'var(--accent)' : 'transparent'};color:${active ? '#fff' : 'var(--text)'};
      cursor:pointer;font-family:var(--font-body);font-size:13px;font-weight:${active ? '600' : '400'}">${i}</button>`;
  }

  bar.innerHTML = prevBtn + pageButtons + nextBtn;

  // Insert after photo-grid
  const grid = document.getElementById('photo-grid');
  grid.insertAdjacentElement('afterend', bar);
}

function changePage(page) {
  const totalPages = Math.ceil(_allPhotos.length / PAGE_SIZE);
  if (page < 1 || page > totalPages) return;
  _currentPage = page;
  renderPage();
  // Scroll back to top of gallery
  document.getElementById('gallery-page')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── BUILD CARD ────────────────────────────────────
function buildPhotoCard(p, i) {
  const delay   = Math.min(i * 0.05, 0.4).toFixed(2);
  const isOwner = window.currentUser && p.owner_id === window.currentUser.id;
  const initial = (p.username||'?').charAt(0).toUpperCase();

  const avatarHtml = p.avatar
    ? `<img src="${p.avatar}" alt="${initial}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
    : `<div class="avatar">${initial}</div>`;

  const tagsHtml = (p.tags||[])
    .map(t => `<span class="photo-tag" onclick="filterTag('${escHtml(t)}',this)">#${escHtml(t)}</span>`)
    .join('');

  // edit button only for owner within 30 min window
  const editBtn = (isOwner && p.editable)
    ? `<button class="edit-btn" onclick="openEditModal(${p.id})" title="Edit post">✏️</button>`
    : '';

  return `
  <div class="photo-card" id="card-${p.id}" style="animation-delay:${delay}s" data-created="${p.created_at}">
    <div class="photo-img-wrap" onclick="openLightbox('/${p.path}')">
      <img src="/${p.path}" alt="${escHtml(p.caption)}" loading="lazy" />
    </div>
    <div class="photo-body">
      <div class="photo-user">
        ${avatarHtml}
        <span class="photo-username-link" onclick="openUserProfile(${p.owner_id},'${escHtml(p.username)}')">${escHtml(p.username)}</span>
      </div>
      ${p.caption ? `<p class="photo-caption" id="cap-${p.id}">${escHtml(p.caption)}</p>` : `<p class="photo-caption" id="cap-${p.id}" style="display:none"></p>`}
      ${tagsHtml ? `<div class="photo-tags" id="tags-${p.id}">${tagsHtml}</div>` : `<div class="photo-tags" id="tags-${p.id}"></div>`}
      <div class="photo-actions">
        <button class="like-btn ${p.liked_by_me?'liked':''}" id="like-${p.id}" onclick="toggleLike(${p.id})">
          ${p.liked_by_me?'❤️':'🤍'}
        </button>
        <span class="like-count" id="lc-${p.id}">${p.likes}</span>
        <button class="comment-toggle" onclick="toggleComments(${p.id})">
          💬 <span id="cc-${p.id}">${p.comment_count}</span>
        </button>
        <span class="photo-time">${timeAgo(p.created_at)}</span>
        ${editBtn}
        ${isOwner ? `<button class="delete-btn" onclick="deletePhoto(${p.id})" title="Delete">🗑</button>` : ''}
      </div>
    </div>
    <div class="comments-panel" id="comments-${p.id}">
      <div class="comment-list" id="clist-${p.id}"></div>
      <div class="comment-input-row">
        <input class="input" id="cinput-${p.id}" placeholder="Write a comment…" maxlength="500"
          onkeydown="if(event.key==='Enter') submitComment(${p.id})" />
        <button class="btn btn-cyan btn-sm" onclick="submitComment(${p.id})">Post</button>
      </div>
    </div>
  </div>`;
}

// ── LIKES ─────────────────────────────────────────
async function toggleLike(id) {
  const r = await api(`/api/photos/${id}/like`, { method:'POST' });
  if (!r.ok) { toast('Login to like photos','error'); return; }
  const btn = document.getElementById(`like-${id}`);
  const cnt = document.getElementById(`lc-${id}`);
  btn.textContent = r.data.liked ? '❤️' : '🤍';
  btn.classList.toggle('liked', r.data.liked);
  cnt.textContent = r.data.likes;
}

// ── COMMENTS ──────────────────────────────────────
async function toggleComments(id) {
  const panel = document.getElementById(`comments-${id}`);
  if (panel.classList.toggle('open')) loadComments(id);
}
async function loadComments(photoId) {
  const r = await api(`/api/photos/${photoId}/comments`);
  if (!r.ok) return;
  const list = document.getElementById(`clist-${photoId}`);
  list.innerHTML = r.data.length
    ? r.data.map(c => buildCommentHTML(c, photoId)).join('')
    : '<p style="font-size:12px;color:var(--muted);text-align:center;padding:8px">No comments yet.</p>';
  list.scrollTop = list.scrollHeight;
}
function buildCommentHTML(c, photoId) {
  const isOwner = window.currentUser && c.user_id === window.currentUser.id;
  return `
  <div class="comment-item" id="comment-${c.id}">
    <div>
      <div class="comment-author">${escHtml(c.username)}</div>
      <div class="comment-text">${escHtml(c.content)}</div>
    </div>
    ${isOwner ? `<button class="comment-del" onclick="deleteComment(${c.id},${photoId})" title="Delete">✕</button>` : ''}
  </div>`;
}
async function submitComment(photoId) {
  const input   = document.getElementById(`cinput-${photoId}`);
  const content = input.value.trim();
  if (!content) return;
  const r = await api(`/api/photos/${photoId}/comments`, { method:'POST', body: JSON.stringify({content}) });
  if (!r.ok) { toast(r.data.error||'Error posting comment','error'); return; }
  input.value = '';
  const list  = document.getElementById(`clist-${photoId}`);
  const empty = list.querySelector('p');
  if (empty) empty.remove();
  list.insertAdjacentHTML('beforeend', buildCommentHTML(r.data, photoId));
  list.scrollTop = list.scrollHeight;
  const cc = document.getElementById(`cc-${photoId}`);
  cc.textContent = parseInt(cc.textContent) + 1;
}
async function deleteComment(commentId, photoId) {
  const r = await api(`/api/comments/${commentId}`, { method:'DELETE' });
  if (!r.ok) return;
  document.getElementById(`comment-${commentId}`)?.remove();
  const cc = document.getElementById(`cc-${photoId}`);
  cc.textContent = Math.max(0, parseInt(cc.textContent) - 1);
}

// ── DELETE PHOTO ──────────────────────────────────
async function deletePhoto(id) {
  if (!confirm('Delete this photo permanently?')) return;
  const r = await api(`/api/photos/${id}`, { method:'DELETE' });
  if (r.ok) {
    document.getElementById(`card-${id}`)?.remove();
    toast('Photo deleted','info');
    loadTags();
    if (typeof refreshLeftPanelTags === 'function') refreshLeftPanelTags();
  } else {
    toast(r.data.error||'Could not delete','error');
  }
}

/* EDIT MODAL (within 30mins) */
function openEditModal(photoId) {
  document.getElementById('edit-modal-overlay')?.remove();

  const capEl  = document.getElementById(`cap-${photoId}`);
  const tagsEl = document.getElementById(`tags-${photoId}`);
  const currentCaption = capEl ? capEl.textContent.trim() : '';
  const currentTags    = tagsEl
    ? Array.from(tagsEl.querySelectorAll('.photo-tag'))
        .map(t => t.textContent.replace('#','').trim()).join(', ')
    : '';

  const overlay = document.createElement('div');
  overlay.id = 'edit-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:600;background:#00000099;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:overlayIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px;width:100%;max-width:480px;animation:cardIn .3s ease">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <h3 style="font-family:var(--font-head);font-size:20px">Edit Post</h3>
        <button class="modal-close" onclick="document.getElementById('edit-modal-overlay').remove()">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="input-group">
          <label>Caption</label>
          <textarea class="input" id="edit-caption" rows="3" placeholder="Say something about this photo…" maxlength="100"
            oninput="document.getElementById('edit-caption-count').textContent = this.value.length">${escHtml(currentCaption)}</textarea>
          <div style="font-size:11px;color:var(--muted);text-align:right;margin-top:4px">
            <span id="edit-caption-count">${escHtml(currentCaption).length}</span>/100
          </div>
        </div>
        <div class="input-group">
          <label>Tags</label>
          <input class="input" id="edit-tags" value="${escHtml(currentTags)}" placeholder="nature, travel, portrait" />
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Separate with commas · max 5 tags</div>
        </div>
        <div style="background:#7c3aed18;border:1px solid #7c3aed33;border-radius:8px;padding:10px 14px;font-size:12px;display:flex;align-items:center;gap:8px">
          <span>⏱</span>
          <span id="edit-countdown" style="font-weight:600;color:var(--accent2)">calculating…</span>
        </div>
        <button class="btn btn-primary btn-full" id="edit-save-btn" onclick="saveEdit(${photoId})">Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  startEditCountdown(photoId);
}

function startEditCountdown(photoId) {
  const el = document.getElementById('edit-countdown');
  if (!el) return;

  const card = document.getElementById(`card-${photoId}`);
  const createdRaw = card?.dataset?.created || '';

  let secsLeft = 1800; 
  if (createdRaw) {
    const createdAt = new Date(createdRaw.replace(' ', 'T') + 'Z');
    const elapsed   = Math.floor((Date.now() - createdAt.getTime()) / 1000);
    secsLeft        = Math.max(0, 1800 - elapsed);
  }

  if (secsLeft <= 0) {
    el.textContent = 'expired — you can no longer edit this post';
    el.style.color = 'var(--rose)';
    const btn = document.getElementById('edit-save-btn');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; btn.textContent = 'Edit window expired'; }
    return;
  }

  function tick() {
    if (secsLeft <= 0) {
      el.textContent = 'expired';
      el.style.color = 'var(--rose)';
      const btn = document.getElementById('edit-save-btn');
      if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; btn.textContent = 'Edit window expired'; }
      return;
    }
    const m = Math.floor(secsLeft / 60);
    const s = secsLeft % 60;
    el.textContent = `${m}m ${s.toString().padStart(2, '0')}s remaining`;
    el.style.color = secsLeft < 300 ? 'var(--gold)' : 'var(--accent2)';
    secsLeft--;
    setTimeout(tick, 1000);
  }
  tick();
}

async function saveEdit(photoId) {
  const caption = document.getElementById('edit-caption')?.value.trim() || '';
  const tags    = document.getElementById('edit-tags')?.value.trim() || '';
  const btn     = document.getElementById('edit-save-btn');
  if (btn) { btn.innerHTML = '<div class="spinner"></div>'; btn.disabled = true; }

  const r = await api(`/api/photos/${photoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ caption, tags })
  });

  if (r.ok) {
    toast('Post updated!', 'success');
    document.getElementById('edit-modal-overlay')?.remove();
    const capEl  = document.getElementById(`cap-${photoId}`);
    const tagsEl = document.getElementById(`tags-${photoId}`);
    if (capEl) {
      capEl.textContent = r.data.caption;
      capEl.style.display = r.data.caption ? '' : 'none';
    }
    if (tagsEl) {
      tagsEl.innerHTML = (r.data.tags||[])
        .map(t => `<span class="photo-tag" onclick="filterTag('${escHtml(t)}',this)">#${escHtml(t)}</span>`)
        .join('');
    }
    loadTags();
    if (typeof refreshLeftPanelTags === 'function') refreshLeftPanelTags();
  } else {
    toast(r.data.error || 'Could not save', 'error');
    if (btn) { btn.innerHTML = 'Save Changes'; btn.disabled = false; }
  }
}

/* ------- LIGHTBOX ---------- */
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target.id === 'lightbox') closeLightbox();
});

/* ------- RANDOM PHOTO ---------- */
async function loadRandomPhoto() {
  const r = await api('/api/photos/random');
  if (!r.ok) { toast('No photos available yet','info'); return; }
  // open the photo in a mini spotlight overlay
  showRandomSpotlight(r.data);
}

function showRandomSpotlight(p) {
  document.getElementById('random-spotlight')?.remove();

  const initial = (p.username||'?').charAt(0).toUpperCase();
  const avatarHtml = p.avatar
    ? `<img src="${p.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover" />`
    : `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff">${initial}</div>`;

  const tagsHtml = (p.tags||[]).map(t => `<span class="photo-tag">#${escHtml(t)}</span>`).join('');

  const overlay = document.createElement('div');
  overlay.id = 'random-spotlight';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:400;background:#000000cc;backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:overlayIn .25s ease';
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;max-width:560px;width:100%;overflow:hidden;animation:cardIn .3s ease;position:relative">
      <button onclick="document.getElementById('random-spotlight').remove()" style="position:absolute;top:12px;right:12px;z-index:1;background:#00000077;border:1px solid #ffffff33;color:#fff;width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">✕</button>
      <button onclick="loadRandomPhoto()" style="position:absolute;top:12px;right:56px;z-index:1;background:#7c3aedaa;border:1px solid var(--accent);color:#fff;padding:0 14px;height:36px;border-radius:8px;cursor:pointer;font-size:12px;font-family:var(--font-body);display:flex;align-items:center;gap:6px">🎲 Another</button>
      <img src="/${p.path}" style="width:100%;max-height:400px;object-fit:cover;display:block;image-rendering:auto" />
      <div style="padding:16px 20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          ${avatarHtml}
          <span style="font-size:13px;font-weight:600;color:var(--accent2);cursor:pointer" onclick="document.getElementById('random-spotlight').remove();openUserProfile(${p.owner_id},'${escHtml(p.username)}')">${escHtml(p.username)}</span>
          <span style="font-size:11px;color:var(--muted);margin-left:auto">${timeAgo(p.created_at)}</span>
        </div>
        ${p.caption ? `<p style="font-size:13px;color:var(--text);margin-bottom:8px;line-height:1.5">${escHtml(p.caption)}</p>` : ''}
        ${tagsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">${tagsHtml}</div>` : ''}
        <div style="display:flex;align-items:center;gap:12px;padding-top:10px;border-top:1px solid var(--border)">
          <span style="font-size:13px;color:var(--muted)">❤️ ${p.likes} likes</span>
          <span style="font-size:13px;color:var(--muted)">💬 ${p.comment_count} comments</span>
          <button onclick="openLightbox('/${p.path}');document.getElementById('random-spotlight').remove()" style="margin-left:auto;background:none;border:1px solid var(--border);color:var(--muted);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-family:var(--font-body)">View Full</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

/* ------- USER PROF CARD ---------- */
async function openUserProfile(userId, username) {

  document.getElementById('user-profile-card')?.remove();

  const card = document.createElement('div');
  card.id = 'user-profile-card';
  card.style.cssText = 'position:fixed;inset:0;z-index:550;display:flex;align-items:center;justify-content:center;padding:20px';
  card.innerHTML = `
    <div class="upc-backdrop" onclick="document.getElementById('user-profile-card').remove()" style="position:absolute;inset:0;background:#00000099;backdrop-filter:blur(6px);animation:overlayIn .2s ease"></div>
    <div class="upc-panel" style="position:relative;z-index:1;background:var(--surface);border:1px solid var(--border);border-radius:20px;width:100%;max-width:400px;overflow:hidden;animation:cardIn .3s ease">
      <div style="padding:24px">
        <div class="skeleton" style="height:16px;width:60%;margin-bottom:12px;border-radius:8px"></div>
        <div class="skeleton" style="height:12px;width:40%;border-radius:8px"></div>
      </div>
    </div>`;
  document.body.appendChild(card);

  const r = await api(`/api/users/${userId}`);
  if (!r.ok) {
    card.remove();
    toast('Could not load profile','error');
    return;
  }
  const u = r.data;
  const initial = (u.username||'?').charAt(0).toUpperCase();

  const avatarHtml = u.avatar
    ? `<img src="${u.avatar}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" />`
    : `<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--cyan));display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;border:2px solid var(--border);flex-shrink:0">${initial}</div>`;

  const isMe = u.is_me;
  const followBtn = isMe ? '' : `
    <button id="upc-follow-btn" onclick="upcToggleFollow(${userId})"
      style="padding:8px 20px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-family:var(--font-body);font-weight:500;
      background:${u.is_following ? 'transparent' : 'var(--accent)'};
      color:${u.is_following ? 'var(--muted)' : '#fff'};
      border:1px solid ${u.is_following ? 'var(--border)' : 'var(--accent)'};
      transition:all .2s">
      ${u.is_following ? 'Following' : '＋ Follow'}
    </button>`;

  card.querySelector('.upc-panel').innerHTML = `
    <!-- Header image strip -->
    <div style="height:6px;background:linear-gradient(90deg,var(--accent),var(--cyan))"></div>

    <div style="padding:24px">
      <!-- Top row: avatar + name + follow -->
      <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:20px">
        ${avatarHtml}
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:600;color:var(--text);margin-bottom:2px">${escHtml(u.username)}</div>
          ${u.bio ? `<div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">${escHtml(u.bio)}</div>` : '<div style="font-size:12px;color:var(--muted);margin-bottom:10px;font-style:italic">No bio yet</div>'}
          ${followBtn}
        </div>
        <button onclick="document.getElementById('user-profile-card').remove()" style="background:none;border:1px solid var(--border);color:var(--muted);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center">✕</button>
      </div>

      <!-- Stats grid -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:20px">
        ${[
          ['📸', u.photos, 'Posts'],
          ['❤️', u.total_likes, 'Likes'],
          ['💬', u.total_comments, 'Comments'],
          ['👥', u.followers, 'Followers'],
          ['➡️', u.following, 'Following'],
        ].map(([icon,val,label]) => `
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 4px;text-align:center">
            <div style="font-size:14px">${icon}</div>
            <div style="font-size:16px;font-weight:700;color:var(--accent2)">${val}</div>
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px">${label}</div>
          </div>`).join('')}
      </div>

      <!-- View photos button -->
      <button onclick="document.getElementById('user-profile-card').remove();loadPhotosByUser(${userId},'${escHtml(u.username)}')"
        class="btn btn-ghost btn-full btn-sm">
        View ${escHtml(u.username)}'s Wally →
      </button>
    </div>`;
}

async function upcToggleFollow(userId) {
  const r = await api(`/api/users/${userId}/follow`, { method:'POST' });
  if (!r.ok) { toast(r.data.error||'Error','error'); return; }

  const btn = document.getElementById('upc-follow-btn');
  if (btn) {
    btn.textContent = r.data.following ? 'Following' : '＋ Follow';
    btn.style.background = r.data.following ? 'transparent' : 'var(--accent)';
    btn.style.color      = r.data.following ? 'var(--muted)' : '#fff';
    btn.style.borderColor= r.data.following ? 'var(--border)' : 'var(--accent)';
  }
  toast(r.data.following ? 'Now following!' : 'Unfollowed', 'info');
}

// ── MY PHOTOS ─────────────────────────────────────
async function loadPhotosByUser(userId, username) {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = [280,200,340,260,180,300]
    .map(h => `<div class="skeleton sk-card" style="height:${h}px"></div>`)
    .join('');
  document.querySelectorAll('.tag-pill').forEach(p => p.classList.remove('active'));
  const r = await api(`/api/users/${userId}/photos`);
  if (!r.ok) { toast('Failed to load photos','error'); return; }
  grid.innerHTML = '';
  if (!r.data.length) {
    grid.innerHTML = `
      <div class="empty-state" style="column-span:all">
        <div class="icon">📷</div>
        <p>No photos from <strong>${escHtml(username)}</strong> yet.</p>
      </div>`;
    return;
  }
  r.data.forEach((p,i) => grid.insertAdjacentHTML('beforeend', buildPhotoCard(p,i)));
}
