/* ═══════════════════════════════════════════════
   upload.js  —  Upload Modal · Drag & Drop
                 File Preview · Submit Upload
   ═══════════════════════════════════════════════ */

let selectedFile = null;   // holds the File object chosen by user

// ── BUILD MODAL HTML ──────────────────────────────
function buildUploadModal() {
  document.getElementById('upload-modal').innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Upload Wally</h3>
        <button class="modal-close" onclick="closeUploadModal()">✕</button>
      </div>

      <div class="modal-form">

        <!-- DROP ZONE -->
        <div class="drop-zone" id="drop-zone"
          onclick="document.getElementById('file-input').click()"
          ondragover="event.preventDefault(); this.classList.add('drag-over')"
          ondragleave="this.classList.remove('drag-over')"
          ondrop="handleDrop(event)">
          <input type="file" id="file-input"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onchange="previewFile(event)" />
          <div class="icon">🖼️</div>
          <p><span>Click to browse</span> or drag & drop</p>
          <p style="font-size:11px;margin-top:4px">PNG · JPG · GIF · WEBP</p>
        </div>

        <!-- PREVIEW -->
        <img class="preview-img hidden" id="upload-preview" alt="Preview" />

        <!-- CAPTION -->
        <div class="input-group">
          <label>Caption
            <span style="font-size:10px;color:var(--muted);text-transform:none">(optional)</span>
          </label>
          <textarea class="input" id="upload-caption"
            placeholder="Say something about your wally…" rows="2"
            maxlength="100"
            oninput="document.getElementById('upload-caption-count').textContent = this.value.length"></textarea>
          <div style="font-size:11px;color:var(--muted);text-align:right;margin-top:4px">
            <span id="upload-caption-count">0</span>/100
          </div>
        </div>

        <!-- TAGS -->
        <div class="input-group">
          <label>Tags
            <span style="font-size:10px;color:var(--muted);text-transform:none">(optional)</span>
          </label>
          <input class="input" id="upload-tags"
            placeholder="e.g. nature, travel, portrait" />
          <div class="tags-hint">Separate with commas · max 5 tags</div>
        </div>

        <!-- SUBMIT -->
        <button class="btn btn-primary btn-full" id="upload-btn" onclick="doUpload()">
          Upload Wally
        </button>

      </div><!-- /.modal-form -->
    </div><!-- /.modal -->
  `;
}

// ── OPEN / CLOSE ──────────────────────────────────
function openUploadModal() {
  document.getElementById('upload-modal').classList.remove('hidden');
}

function closeUploadModal() {
  document.getElementById('upload-modal').classList.add('hidden');
  document.getElementById('upload-preview').classList.add('hidden');
  document.getElementById('file-input').value    = '';
  document.getElementById('upload-caption').value = '';
  const uc = document.getElementById('upload-caption-count'); if (uc) uc.textContent = '0';
  document.getElementById('upload-tags').value    = '';
  selectedFile = null;
}

// ── FILE SELECTED VIA BROWSE ──────────────────────
function previewFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  showPreview(file);
}

// ── FILE DROPPED ──────────────────────────────────
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');

  const file = e.dataTransfer.files[0];
  if (!file) return;

  // inject into file input so validation works
  const dt = new DataTransfer();
  dt.items.add(file);
  document.getElementById('file-input').files = dt.files;

  selectedFile = file;
  showPreview(file);
}

// ── SHOW IMAGE PREVIEW ────────────────────────────
function showPreview(file) {
  const reader  = new FileReader();
  reader.onload = ev => {
    const img = document.getElementById('upload-preview');
    img.src   = ev.target.result;
    img.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

// ── SUBMIT UPLOAD ─────────────────────────────────
async function doUpload() {
  if (!selectedFile) { toast('Select a photo first', 'error'); return; }

  const btn     = document.getElementById('upload-btn');
  btn.innerHTML = '<div class="spinner"></div> Uploading…';
  btn.disabled  = true;

  const fd = new FormData();
  fd.append('file',    selectedFile);
  fd.append('caption', document.getElementById('upload-caption').value.trim());
  fd.append('tags',    document.getElementById('upload-tags').value.trim());

  const res  = await fetch('/api/photos', {
    method: 'POST',
    credentials: 'include',
    body: fd
  });
  const data = await res.json().catch(() => ({}));

  btn.innerHTML = 'Upload Photo';
  btn.disabled  = false;

  if (res.ok) {
    toast('Photo uploaded! 🎉', 'success');
    closeUploadModal();
    loadTags();
    loadPhotos(activeTag);
  } else {
    toast(data.error || 'Upload failed', 'error');
  }
}
