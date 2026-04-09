/* ═══════════════════════════════════════════════
   auth.js  —  Login · Register · Forgot Password
   ═══════════════════════════════════════════════ */

function buildAuthHTML() {
  document.getElementById('auth-page').innerHTML = `

    <div id="login-card" class="auth-card">
      <div class="auth-logo">
        <h1>Wally's Gallery</h1>
        <p>Ang Gallery ng Isang Wally Bayola</p>
      </div>
      <div class="auth-form">
        <div class="input-group">
          <label>Username or Email</label>
          <input class="input" id="login-identifier"
            placeholder="Enter username or email" autocomplete="username" />
        </div>
        <div class="input-group">
          <label>Password</label>
          <input class="input" id="login-password"
            type="password" placeholder="••••••••" autocomplete="current-password" />
        </div>
        <button class="btn btn-primary btn-full" id="login-btn" onclick="doLogin()">
          Sign In
        </button>
        <div class="auth-divider">or</div>
        <button class="btn btn-ghost btn-full" onclick="showRegister()">
          Create Account
        </button>
        <div style="text-align:center">
          <button class="link-btn" onclick="showForgot()">Forgot your password?</button>
        </div>
      </div>
    </div>

    <div id="register-card" class="auth-card hidden">
      <div class="auth-logo">
        <h1>Wally's Gallery</h1>
        <p>Maging Isang Wally Bayola</p>
      </div>
      <div class="auth-form">
        <div class="input-group">
          <label>Username</label>
          <input class="input" id="reg-username"
            placeholder="3-20 chars, letters & numbers" />
        </div>
        <div class="input-group">
          <label>Email</label>
          <div class="otp-row">
            <input class="input" id="reg-email" type="email" placeholder="wallybayola@example.com" />
            <button class="btn btn-cyan" id="send-otp-btn"
              onclick="sendRegisterOTP()" style="white-space:nowrap">Send OTP</button>
          </div>
        </div>
        <div class="input-group hidden" id="reg-otp-group">
          <label>OTP Code</label>
          <input class="input" id="reg-otp"
            placeholder="6-digit code from your email" maxlength="6" />
        </div>
        <div class="input-group">
          <label>Password
            <span style="color:var(--muted);font-size:11px;text-transform:none">(min 8 chars)</span>
          </label>
          <input class="input" id="reg-password" type="password"
            placeholder="••••••••" oninput="checkStrength()" />
          <div class="strength-bar">
            <div class="strength-fill" id="strength-fill" style="width:0%"></div>
          </div>
          <div id="strength-label" style="font-size:11px;color:var(--muted);margin-top:2px"></div>
        </div>
        <button class="btn btn-primary btn-full" onclick="doRegister()">
          Create Account
        </button>
        <div class="auth-divider">Isang Bayola na?</div>
        <button class="btn btn-ghost btn-full" onclick="showLogin()">Sign In</button>
      </div>
    </div>

    <div id="forgot-card" class="auth-card hidden">
      <div class="auth-logo">
        <h1>Wally's Gallery</h1>
        <p>Reset your password</p>
      </div>
      <div class="auth-form">
        <div class="input-group">
          <label>Email</label>
          <div class="otp-row">
            <input class="input" id="forgot-email" type="email"
              placeholder="your registered email" />
            <button class="btn btn-cyan" onclick="sendResetOTP()"
              style="white-space:nowrap">Send OTP</button>
          </div>
        </div>
        <div id="forgot-step2" class="hidden" style="display:none">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="input-group">
              <label>OTP Code</label>
              <input class="input" id="forgot-otp" placeholder="6-digit code" maxlength="6" />
            </div>
            <div class="input-group">
              <label>New Password</label>
              <input class="input" id="forgot-new-pass"
                type="password" placeholder="min 8 characters" />
            </div>
            <button class="btn btn-primary btn-full" onclick="doResetPassword()">
              Reset Password
            </button>
          </div>
        </div>
        <button class="btn btn-ghost btn-full" onclick="showLogin()">Back to Login</button>
      </div>
    </div>
  `;

  document.getElementById('login-identifier').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
}

// ── SHOW / HIDE CARDS ────────────────────────────────────────────────────────
function showLogin() {
  document.getElementById('register-card')?.classList.add('hidden');
  document.getElementById('forgot-card')?.classList.add('hidden');
  document.getElementById('login-card')?.classList.remove('hidden');
  document.getElementById('auth-page').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showRegister() {
  document.getElementById('login-card').classList.add('hidden');
  document.getElementById('forgot-card').classList.add('hidden');
  document.getElementById('register-card').classList.remove('hidden');

  document.getElementById('reg-username').value = '';
  document.getElementById('reg-email').value    = '';
  document.getElementById('reg-otp').value      = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('reg-otp-group').classList.add('hidden');

  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if (fill)  { fill.style.width = '0%'; fill.style.background = ''; }
  if (label) { label.textContent = ''; }

  const otpBtn = document.getElementById('send-otp-btn');
  if (otpBtn) { otpBtn.textContent = 'Send OTP'; otpBtn.disabled = false; }
}

function showForgot() {
  document.getElementById('login-card').classList.add('hidden');
  document.getElementById('register-card').classList.add('hidden');
  document.getElementById('forgot-card').classList.remove('hidden');
}

// ── PASSWORD STRENGTH ────────────────────────────────────────────────────────
function checkStrength() {
  const p     = document.getElementById('reg-password').value;
  const fill  = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  let score = 0;
  if (p.length >= 8)           score++;
  if (/[A-Z]/.test(p))         score++;
  if (/[0-9]/.test(p))         score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
  const labels = ['Too short','Weak','Fair','Strong'];
  if (p.length === 0) { fill.style.width = '0%'; label.textContent = ''; return; }
  const idx = Math.min(score - 1, 3);
  fill.style.width      = (Math.min(score, 4) / 4 * 100) + '%';
  fill.style.background = colors[idx];
  label.textContent     = labels[idx];
  label.style.color     = colors[idx];
}

// ── OTP TIMER ────────────────────────────────────────────────────────────────
function startOTPTimer(btn, sec = 60) {
  btn.disabled = true;
  const iv = setInterval(() => {
    btn.textContent = `Resend (${sec}s)`;
    sec--;
    if (sec < 0) { clearInterval(iv); btn.textContent = 'Send OTP'; btn.disabled = false; }
  }, 1000);
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
async function doLogin() {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password   = document.getElementById('login-password').value;
  if (!identifier || !password) { toast('Fill in all fields', 'error'); return; }
  const btn     = document.getElementById('login-btn');
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled  = true;
  const r = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  });
  btn.innerHTML = 'Sign In';
  btn.disabled  = false;
  if (r.ok) {
    window.currentUser = r.data.user;
    toast(`Welcome back, ${r.data.user.username}!`, 'success');
    enterApp();
  } else {
    toast(r.data.error || 'Login failed', 'error');
  }
}

// ── REGISTER ─────────────────────────────────────────────────────────────────
async function sendRegisterOTP() {
  const email = document.getElementById('reg-email').value.trim();
  if (!email) { toast('Enter your email first', 'error'); return; }
  const btn     = document.getElementById('send-otp-btn');
  btn.innerHTML = '<div class="spinner"></div>';
  btn.disabled  = true;
  const r = await api('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose: 'verify' })
  });
  btn.innerHTML = 'Send OTP';
  if (r.ok) {
    toast('OTP sent to your email!', 'success');
    document.getElementById('reg-otp-group').classList.remove('hidden');
    startOTPTimer(btn);
  } else {
    btn.disabled = false;
    toast(r.data.error || 'Failed to send OTP', 'error');
  }
}

async function doRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const otp      = document.getElementById('reg-otp').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!username || !email || !otp || !password) { toast('Fill in all fields', 'error'); return; }
  if (password.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
  const r = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, otp, password })
  });
  if (r.ok) {
    window.currentUser = r.data.user;
    toast('Account created! Welcome!', 'success');
    enterApp();
  } else {
    toast(r.data.error || 'Registration failed', 'error');
  }
}

// ── FORGOT PASSWORD ──────────────────────────────────────────────────────────
async function sendResetOTP() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { toast('Enter your email', 'error'); return; }
  const r = await api('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, purpose: 'reset' })
  });
  if (r.ok) {
    toast('OTP sent!', 'success');
    const step2 = document.getElementById('forgot-step2');
    step2.classList.remove('hidden');
    step2.style.display = 'block';
  } else {
    toast(r.data.error || 'Error', 'error');
  }
}

async function doResetPassword() {
  const email    = document.getElementById('forgot-email').value.trim();
  const otp      = document.getElementById('forgot-otp').value.trim();
  const new_pass = document.getElementById('forgot-new-pass').value;
  if (new_pass.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
  const r = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password: new_pass })
  });
  if (r.ok) {
    toast('Password reset! Please log in.', 'success');
    showLogin();
  } else {
    toast(r.data.error || 'Error', 'error');
  }
}

// ── LOGOUT with confirmation ──────────────────────────────────────────────────
function doLogout() {
  const existing = document.getElementById('logout-confirm-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'logout-confirm-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:#00000099;backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;animation:overlayIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:36px 32px;width:100%;max-width:360px;text-align:center;animation:cardIn .3s ease;">
      <div style="font-size:42px;margin-bottom:12px">👋</div>
      <h3 style="font-family:var(--font-head);font-size:22px;margin-bottom:8px">Log out?</h3>
      <p style="font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.5">Are you sure you want to leave Wally's Gallery?</p>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost btn-full" onclick="document.getElementById('logout-confirm-overlay').remove()">Cancel</button>
        <button class="btn btn-danger btn-full" onclick="confirmLogout()">Bye Bayola</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function confirmLogout() {
  document.getElementById('logout-confirm-overlay')?.remove();
  await api('/api/auth/logout', { method: 'POST' });
  window.currentUser = null;
  showLogin();
  // clear login fields
  const li = document.getElementById('login-identifier');
  const lp = document.getElementById('login-password');
  if (li) li.value = '';
  if (lp) lp.value = '';
  toast('Bye Bayola. See you!', 'info');
}
