/* ══════════════════════════════════════════════
   TrustMarket — Vanilla JS SPA (Final)
   ══════════════════════════════════════════════ */


/* ── MOCK DATA ── */
const CATEGORIES = [
  { id: "all",         label: "All",        icon: "🌐" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "vehicles",    label: "Vehicles",    icon: "🚗" },
  { id: "furniture",   label: "Furniture",   icon: "🛋️" },
  { id: "fashion",     label: "Fashion",     icon: "👗" },
  { id: "gaming",      label: "Gaming",      icon: "🎮" },
  { id: "home-decor",  label: "Home Decor",  icon: "🏠" },
  { id: "kitchen",     label: "Kitchen",     icon: "🍳" },
  { id: "footwear",    label: "Footwear",    icon: "👟" },
  { id: "collectibles",label: "Collectibles",icon: "🏆" },
  { id: "services",    label: "Services",    icon: "🛠️" },
];

const ITEMS_PER_PAGE = 12;

function enrichListing(raw) {
  let posted = "recently";
  if (raw.createdAt) {
    const diffMs = Date.now() - new Date(raw.createdAt);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) posted = `${diffMins} min ago`;
    else if (diffHours < 24) posted = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    else posted = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  const img = raw.images && raw.images.length ? raw.images[0] : `https://picsum.photos/seed/${raw._id}/400/300`;
  const sellerName = raw.sellerName || (raw.userId ? `User_${raw.userId.slice(-4)}` : "Unknown");
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerName)}&background=7c5cfc&color=fff&size=128`;
  return {
    id: raw._id,
    title: raw.title,
    price: raw.price,
    category: raw.category,
    seller: sellerName,
    avatar: avatar,
    trust: raw.trust || 70,
    img: img,
    images: raw.images || [],
    desc: raw.description || "",
    cond: raw.condition || "Good",
    loc: raw.location || "Remote",
    featured: raw.featured || false,
    isNew: raw.isNew || false,
    reviews: raw.reviews || 0,
    posted: posted,
    sellerWallet: raw.sellerWallet
  };
}


const AV = (n,c) => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=${c}&color=fff&size=128`;

let LISTINGS = [];

// Detailed Activity Logs for Audit page
const ACTIVITY_LOGS = [ ];

/* ── GLOBAL STATE ── */
const state = {
  route: "",
  productId: null,
  search: "",
  category: "all",
  sort: "newest",
  page: 1,
  wishlist: new Set(),
  loginMode: "choose",
  loginSignUp: false,
  sellImages: [], // Object URLs for preview
  sellFiles: [], // Actual file objects
  sellForm: {},
  sellDone: false,
  profileTab: "Listings",
  auditQuery: "",
  auditResult: null,
  theme: localStorage.getItem("theme") || "dark",
  user: null, 
};

// Load wishlist from backend when user is logged in
async function loadWishlist() {
  try {
    const res = await fetch('http://localhost:5000/api/user/wishlist', { credentials: 'include' });
    const data = await res.json();
    if (data.wishlist) {
      state.wishlist = new Set(data.wishlist);
      // Update wishlist count icon if exists
      const countEl = document.getElementById('wishlistCount');
      if (countEl) countEl.textContent = state.wishlist.size;

       // Inside loadWishlist, after setting state.wishlist:
      if (location.pathname === '/profile' && state.profileTab === 'Wishlist') {
        const userListings = [];
        const contentDiv = document.getElementById("profile-tab-content");
        if (contentDiv) {
          contentDiv.innerHTML = renderProfileTabContent(userListings, []);
        }
      }
      // Re-render current page to reflect wishlist status on cards
      route();
    }
  } catch (err) {
    console.log('Failed to load wishlist');
  }
}

async function fetchListings() {
  try {
    const res = await fetch('http://localhost:5000/api/listings', { credentials: 'include' });
    const data = await res.json();
    LISTINGS = (data.listings || []).map(enrichListing);
    return LISTINGS;
  } catch (err) {
    console.error('Failed to fetch listings', err);
    return [];
  }
}

async function fetchMyListings() {
  try {
    const res = await fetch('http://localhost:5000/api/listings/my', { credentials: 'include' });
    const data = await res.json();
    return (data.listings || []).map(enrichListing);
  } catch {
    return [];
  }
}

async function fetchMyPurchases() {
  try {
    const res = await fetch('http://localhost:5000/api/listings/purchased', { credentials: 'include' });
    const data = await res.json();
    return (data.listings || []).map(enrichListing);
  } catch {
    return [];
  }
}

async function fetchCurrentUser() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (data.user) {
      state.user = data.user;
      await loadWishlist();
      updateNavbarForLoggedInUser();
      // Re-render current page if it's profile or any user-dependent page
      if (location.pathname === '/profile') {
        route(); // re-run router to refresh profile
      }
    }
  } catch (err) {
    console.log('Not logged in');
  }
}

function updateNavbarForLoggedInUser() {
  const connectBtn = document.querySelector('.btn-outline');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!connectBtn) return;
  
  if (state.user && !state.user.isGuest) {
    connectBtn.textContent = `👤 ${state.user.name || state.user.email || state.user.walletAddress?.slice(0,6)}`;
    connectBtn.onclick = () => navigate('/profile');
    if (logoutBtn) logoutBtn.style.display = 'flex';
  } else if (state.user && state.user.isGuest) {
    connectBtn.textContent = `👤 Guest`;
    connectBtn.onclick = () => toast('Guest mode', 'Create an account to save data');
    if (logoutBtn) logoutBtn.style.display = 'flex';
  } else {
    connectBtn.textContent = `⚡ Connect`;
    connectBtn.onclick = openLogin;
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

/* ── THEME TOGGLE ── */

/* ── THEME TOGGLE ── */
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  state.theme = savedTheme;
  document.documentElement.setAttribute("data-theme", state.theme);
  // Wait for navbar to exist before updating icon (called after buildNav)
  setTimeout(() => updateThemeIcon(), 0);
}

function updateThemeIcon() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const iconSpan = btn.querySelector(".theme-icon");
  if (iconSpan) {
    iconSpan.textContent = state.theme === "dark" ? "🌙" : "☀️";
  }
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", state.theme);
  localStorage.setItem("theme", state.theme);
  updateThemeIcon();
}

/* ── ROUTER ── */
function navigate(path) {
  history.pushState({}, "", path);
  route();
}

function route() {
  const path = location.pathname;
  const $page = document.getElementById("page");
  $page.innerHTML = "";

  const m = path.match(/^\/product\/([a-zA-Z0-9_]+)/);
  if (m) {
    state.productId = m[1];
    renderDetail($page);
  } else if (path === "/listings") {
    renderListings($page);
  } else if (path === "/sell") {
    renderSell($page);
  } else if (path === "/profile") {
    renderProfile($page);
  } else if (path === "/audit") {
    renderAudit($page);
  } else {
    renderHome($page);
  }

  updateNavActive();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("popstate", route);

/* ── NAVBAR (no "Sell" text link, but keep "+ Sell" button) ── */
function buildNav() {
  const nav = document.getElementById("navbar");
  nav.innerHTML = `
    <div class="nav-logo" onclick="navigate('/')">
      <div class="logo-icon">🛡️</div>
      Trust<span class="accent">Market</span>
    </div>
    <div class="nav-search relative flex-1" style="max-width:440px">
      <span class="search-icon" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;font-size:15px">🔍</span>
      <input type="search" id="nav-search-input" placeholder="Search products, sellers..." value="${escHtml(state.search)}" style="padding-left:38px;height:38px;border-radius:12px" />
    </div>
    <div class="nav-links">
      <span class="nav-link" data-route="/">Home</span>
      <span class="nav-link" data-route="/listings">Browse</span>
      <span class="nav-link" data-route="/profile">Profile</span>
      <span class="nav-link" data-route="/audit">Audit</span>
    </div>
    <div class="nav-actions">
  <div class="nav-notif" onclick="toast('Notifications','No new notifications')">
    🔔<div class="notif-dot"></div>
  </div>
  <button class="theme-toggle" id="themeToggleBtn" onclick="toggleTheme()" style="background:none; border:none; font-size:20px; cursor:pointer; color:var(--text); display:flex; align-items:center;">
    <span class="theme-icon">${state.theme === 'dark' ? '🌙' : '☀️'}</span>
  </button>
  <button class="btn btn-outline" onclick="openLogin()">⚡ Connect</button>
  <button class="btn btn-primary" onclick="navigate('/sell')">＋ Sell</button>
  <button id="logoutBtn" class="btn btn-danger" style="display: none;" onclick="logout()">🚪 Logout</button>
  <div class="hamburger" id="hamburger" onclick="openSidebar()">☰</div>
</div>
  `;

  document.getElementById("nav-search-input").addEventListener("input", e => {
    state.search = e.target.value;
    if (location.pathname !== "/listings") navigate("/listings");
    else { state.page = 1; route(); }
  });

  nav.querySelectorAll(".nav-link").forEach(el => {
    el.addEventListener("click", () => navigate(el.dataset.route));
  });

  updateNavActive();
}

function updateNavActive() {
  const path = location.pathname;
  document.querySelectorAll(".nav-link, .sidebar-link").forEach(el => {
    const r = el.dataset.route || "";
    el.classList.toggle("active", r === path || (r === "/" && path === "/"));
  });
}

/* ── SIDEBAR (keep "Sell" link because it matches nav) ── */
function buildSidebar() {
  const $overlay = document.getElementById("sidebar-overlay");
  const $sb = document.getElementById("sidebar");
  if ($sb.children.length > 0) return;

  const links = [
    { r:"/",         icon:"🏠", label:"Home" },
    { r:"/listings", icon:"🔍", label:"Browse" },
    { r:"/sell",     icon:"➕", label:"Sell" },
    { r:"/profile",  icon:"👤", label:"Profile" },
    { r:"/audit",    icon:"🛡️", label:"Audit" },
    { r:"javascript:void(0)", icon:"🚪", label:"Logout", onclick: "logout()" }
  ];

  $sb.innerHTML = `
    <div class="sidebar-header">
      <div class="nav-logo" style="font-size:15px">
        <div class="logo-icon" style="width:28px;height:28px;font-size:14px">🛡️</div>
        Trust<span class="accent">Market</span>
      </div>
      <button onclick="closeSidebar()" style="font-size:20px;color:var(--text2);background:none;border:none;cursor:pointer">✕</button>
    </div>
    <div class="sidebar-nav">
      ${links.map(l => `<div class="sidebar-link" data-route="${l.r}"><span style="font-size:18px">${l.icon}</span>${l.label}</div>`).join("")}
    </div>
    <div class="sidebar-footer">
  <button class="btn btn-outline w-full" onclick="openLogin();closeSidebar()">⚡ Connect</button>
  <button class="btn btn-primary w-full" onclick="navigate('/sell');closeSidebar()">＋ Sell an Item</button>
  <button class="btn btn-danger w-full" onclick="logout();closeSidebar()">🚪 Logout</button>
</div>
  `;

  $sb.querySelectorAll(".sidebar-link").forEach(el => {
    el.addEventListener("click", () => { navigate(el.dataset.route); closeSidebar(); });
  });
}

function openSidebar() {
  buildSidebar();
  document.getElementById("sidebar-overlay").style.display = "block";
  document.getElementById("sidebar").classList.add("open");
  updateNavActive();
}

function closeSidebar() {
  document.getElementById("sidebar-overlay").style.display = "none";
  document.getElementById("sidebar").classList.remove("open");
}

document.getElementById("sidebar-overlay").addEventListener("click", closeSidebar);

/* ── TOAST ── */
let toastId = 0;
function toast(title, desc = "", type = "info") {
  const icons = { info:"ℹ️", success:"✅", warn:"⚠️", error:"❌" };
  const id = ++toastId;
  const $c = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast";
  el.id = `toast-${id}`;
  el.innerHTML = `<div class="toast-icon">${icons[type] || "ℹ️"}</div><div class="toast-body"><div class="toast-title">${escHtml(title)}</div>${desc ? `<div class="toast-desc">${escHtml(desc)}</div>` : ""}</div>`;
  $c.appendChild(el);
  setTimeout(() => {
    el.classList.add("removing");
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ── LOGIN MODAL ── */
function openLogin() {
  state.loginMode = "choose";
  state.loginSignUp = false;
  renderLoginModal();
  const $mc = document.getElementById("modal-container");
  $mc.classList.add("active");
}

function closeLogin() {
  document.getElementById("modal-container").classList.remove("active");
}

function renderLoginModal() {
  const $mc = document.getElementById("modal-container");
  const isSignUp = state.loginSignUp;

  const socialButtons = `
    <div class="modal-social-row">
      <button class="modal-social-btn" onclick="loginWith('Google')">
        <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Google
      </button>
      <button class="modal-social-btn" onclick="loginWith('Apple')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 12.973c.007 1.854 1.626 2.471 1.644 2.479-.014.043-.257.88-.848 1.743-.511.746-1.04 1.486-1.876 1.501-.82.016-1.083-.486-2.02-.486-.938 0-1.23.47-2.006.502-.838.032-1.476-.805-1.987-1.548-1.09-1.577-1.924-4.455-.804-6.398.554-.959 1.548-1.566 2.626-1.582.82-.016 1.595.55 2.097.55.5 0 1.44-.68 2.424-.58.413.017 1.572.166 2.315 1.253-.06.037-1.383.807-1.369 2.409zM14.297 6.906c.458-.555.767-1.326.683-2.095-.66.026-1.458.44-1.931.995-.424.49-.796 1.276-.697 2.029.737.057 1.49-.375 1.945-.929z"/></svg>
        Apple
      </button>
      <button class="modal-social-btn metamask" onclick="loginWith('MetaMask')">
        🦊 MetaMask
      </button>
    </div>
    <div class="modal-divider">or continue with email</div>
  `;

  const signInForm = `
    <div class="modal-form-group">
      <label>Email address</label>
      <input type="email" id="login-email" placeholder="you@example.com" autocomplete="email" />
    </div>
    <div class="modal-form-group">
      <label>Password</label>
      <input type="password" id="login-pw" placeholder="••••••••" autocomplete="current-password" />
    </div>
    <div class="modal-form-options">
      <label class="modal-checkbox">
        <input type="checkbox" /> Remember me
      </label>
      <a href="#" onclick="toast('Password Reset','Check your email for reset link'); return false;">Forgot password?</a>
    </div>
    <button class="btn btn-primary w-full" onclick="submitEmail()">Sign In</button>
  `;

  const signUpForm = `
    <div class="modal-form-group">
      <label>Full name</label>
      <input type="text" id="signup-name" placeholder="John Doe" autocomplete="name" />
    </div>
    <div class="modal-form-group">
      <label>Email address</label>
      <input type="email" id="signup-email" placeholder="you@example.com" autocomplete="email" />
    </div>
    <div class="modal-form-group">
      <label>Password</label>
      <input type="password" id="signup-pw" placeholder="Create a password" autocomplete="new-password" />
    </div>
    <div class="modal-form-group">
      <label>Phone (optional)</label>
      <input type="tel" id="signup-phone" placeholder="+1 234 567 8900" />
    </div>
    <label class="modal-checkbox">
      <input type="checkbox" id="signup-terms" /> I agree to the <a href="#" onclick="return false">Terms of Service</a> and <a href="#" onclick="return false">Privacy Policy</a>
    </label>
    <button class="btn btn-primary w-full" onclick="submitSignup()">Create Account</button>
  `;

  const bodyHTML = `
    <div class="modal-tabs">
      <button class="modal-tab ${!isSignUp ? 'active' : ''}" onclick="switchAuthMode(false)">Sign In</button>
      <button class="modal-tab ${isSignUp ? 'active' : ''}" onclick="switchAuthMode(true)">Sign Up</button>
    </div>
    <div class="modal-social-section">
      ${socialButtons}
    </div>
    <div class="modal-auth-form">
      ${isSignUp ? signUpForm : signInForm}
    </div>
    <div class="modal-guest">
      <button class="modal-guest-btn" onclick="loginWith('Guest')">Continue as Guest →</button>
    </div>
  `;

  $mc.innerHTML = `
    <div class="modal-backdrop" onclick="closeLogin()"></div>
    <div class="modal-box modal-box-pro">
      <div class="modal-header-pro">
        <div class="modal-logo">🛡️ Trust<span>Market</span></div>
        <button class="modal-close" onclick="closeLogin()">✕</button>
      </div>
      ${bodyHTML}
    </div>
  `;
}

window.switchAuthMode = function(isSignUp) {
  state.loginSignUp = isSignUp;
  renderLoginModal();
};

window.submitSignup = function() {
  const name = document.getElementById("signup-name")?.value.trim();
  const email = document.getElementById("signup-email")?.value.trim();
  const password = document.getElementById("signup-pw")?.value;
  const phone = document.getElementById("signup-phone")?.value.trim();
  const terms = document.getElementById("signup-terms")?.checked;

  if (!name) { toast("Missing name", "Please enter your full name", "error"); return; }
  if (!email) { toast("Missing email", "Please enter a valid email address", "error"); return; }
  if (!password || password.length < 6) { toast("Weak password", "Password must be at least 6 characters", "error"); return; }
  if (!terms) { toast("Agreement required", "You must accept Terms & Privacy Policy", "error"); return; }

  closeLogin();
  toast("Account Created! 🎉", `Welcome, ${name}! You are now signed in.`, "success");
};

window.showLoginForm = function(type) { state.loginMode = type; renderLoginModal(); };
window.toggleAuth = function() { state.loginSignUp = !state.loginSignUp; renderLoginModal(); };

window.switchAuthMode = function(isSignUp) {
  state.loginSignUp = isSignUp;
  renderLoginModal();
};

window.submitSignup = function() {
  const name = document.getElementById("signup-name")?.value.trim();
  const email = document.getElementById("signup-email")?.value.trim();
  const password = document.getElementById("signup-pw")?.value;
  const phone = document.getElementById("signup-phone")?.value.trim();
  const terms = document.getElementById("signup-terms")?.checked;

  // Validation
  if (!name) {
    toast("Missing name", "Please enter your full name", "error");
    return;
  }
  if (!email) {
    toast("Missing email", "Please enter a valid email address", "error");
    return;
  }
  if (!password || password.length < 6) {
    toast("Weak password", "Password must be at least 6 characters", "error");
    return;
  }
  if (!terms) {
    toast("Agreement required", "You must accept Terms & Privacy Policy", "error");
    return;
  }

  // Simulate account creation
  closeLogin();
  toast("Account Created! 🎉", `Welcome, ${name}! You are now signed in.`, "success");

  // Optional: update navbar/login state (e.g., change "Connect" to user name)
  // You can add code here to update UI after login
};

window.loginWith = async function(method, extra = {}) {
  if (method === 'MetaMask') {
    if (!window.ethereum) {
      toast("MetaMask not installed", "Please install MetaMask", "error");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      const message = "Sign this message to login to TrustMarket";
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });
      const res = await fetch('http://localhost:5000/api/auth/metamask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ walletAddress, signature, message }),
      });
      const data = await res.json();
      if (res.ok) {
        state.user = data.user;
        updateNavbarForLoggedInUser();
        closeLogin();
        toast("Connected", `Welcome ${data.user.name}`);
      } else {
        toast("Login failed", data.error, "error");
      }
    } catch (err) {
      toast("MetaMask error", err.message, "error");
    }
  } 
  else if (method === 'Google') {
    window.location.href = 'http://localhost:5000/api/auth/google';
  }
  else if (method === 'Phone') {
    // We'll create a simple prompt for phone number
    const phone = prompt("Enter your phone number with country code (e.g., +1234567890)");
    if (!phone) return;
    // Send OTP
    const sendRes = await fetch('http://localhost:5000/api/auth/phone/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (sendRes.ok) {
      const otp = prompt("Enter the OTP sent to your phone");
      const verifyRes = await fetch('http://localhost:5000/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, otp }),
      });
      const data = await verifyRes.json();
      if (verifyRes.ok) {
        state.user = data.user;
        updateNavbarForLoggedInUser();
        closeLogin();
        toast("Phone verified", "Logged in successfully");
      } else {
        toast("OTP error", data.error, "error");
      }
    } else {
      toast("Failed to send OTP", "Check console for OTP (Twilio not configured)", "error");
    }
  }
  else if (method === 'Guest') {
    const res = await fetch('http://localhost:5000/api/auth/guest', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    state.user = data.user;
    updateNavbarForLoggedInUser();
    closeLogin();
    toast("Guest mode", "You are browsing as guest");
  }
};

window.submitEmail = async function() {
  const email = document.getElementById("login-email")?.value;
  const pw = document.getElementById("login-pw")?.value;
  if (!email || !pw) {
    toast("Missing credentials", "Please enter email and password", "error");
    return;
  }
  const res = await fetch('http://localhost:5000/api/auth/email/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password: pw }),
  });
  const data = await res.json();
  if (res.ok) {
    state.user = data.user;
    updateNavbarForLoggedInUser();
    closeLogin();
    toast("Welcome Back!", `Signed in as ${email}`, "success");
  } else {
    toast("Login failed", data.error, "error");
  }
};

window.submitSignup = async function() {
  const name = document.getElementById("signup-name")?.value.trim();
  const email = document.getElementById("signup-email")?.value.trim();
  const password = document.getElementById("signup-pw")?.value;
  const terms = document.getElementById("signup-terms")?.checked;
  if (!name || !email || !password || !terms) {
    toast("Missing info", "Please fill all fields and accept terms", "error");
    return;
  }
  const res = await fetch('http://localhost:5000/api/auth/email/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (res.ok) {
    state.user = data.user;
    updateNavbarForLoggedInUser();
    closeLogin();
    toast("Account Created!", `Welcome ${name}`, "success");
  } else {
    toast("Signup failed", data.error, "error");
  }
};

window.openLogin = openLogin;
window.closeLogin = closeLogin;

/* ── TRUST HELPERS ── */
function trustClass(score) {
  return score >= 80 ? "high" : score >= 50 ? "med" : "low";
}
function trustColor(score) {
  return score >= 80 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";
}
function trustLabel(score) {
  return score >= 80 ? "Highly Trusted" : score >= 50 ? "Moderate Trust" : "Low Trust";
}

function trustBadge(score, size = "") {
  return `<span class="trust-badge trust-${trustClass(score)}" style="${size ? `font-size:${size}` : ""}">🛡️ ${score}%</span>`;
}

/* ── PRODUCT CARD ── */
function productCard(l, delay = 0) {
  const wishlisted = state.wishlist.has(l.id);
  return `
    <div class="p-card" style="animation-delay:${delay}s" data-id="${l.id}" onclick="navigate('/product/${l.id}')">
      <div class="p-card-img">
        <img src="${l.img}" alt="${escHtml(l.title)}" loading="lazy" />
        <div class="p-card-overlay"></div>
        <div class="p-badge">
          ${l.featured ? `<div class="badge-featured">⚡ Featured</div>` : ""}
          ${l.isNew ? `<div class="badge-new">New</div>` : ""}
        </div>
        <button class="p-wishlist ${wishlisted ? "active" : ""}" onclick="toggleWishlist(event,'${l.id}')">${wishlisted ? "❤️" : "🤍"}</button>
      </div>
      <div class="p-body">
        <div class="p-meta">
          <span class="p-cat">${l.category.replace("-"," ")}</span>
          ${trustBadge(l.trust)}
        </div>
        <div class="p-title">${escHtml(l.title)}</div>
        <div class="p-price-row">
          <span class="p-price">$${l.price.toLocaleString()}</span>
          <span class="p-cond">${l.cond}</span>
        </div>
        <div class="p-seller">
          <img class="p-seller-avatar" src="${l.avatar}" alt="${escHtml(l.seller)}" />
          <span class="p-seller-name">${escHtml(l.seller)}</span>
          <span class="p-location">📍 ${l.loc.split(",")[0]}</span>
        </div>
        <div class="p-reviews">
          <span class="stars">⭐ ${l.reviews} reviews</span>
          <span>${l.posted}</span>
        </div>
        <div class="p-actions">
          <button class="btn btn-primary btn-sm" onclick="buyNow(event,'${l.id}')">🛒 Buy</button>
          <button class="btn btn-ghost btn-sm" onclick="navigate('/product/${l.id}');event.stopPropagation()">👁 View</button>
        </div>
      </div>
    </div>
  `;
}

window.toggleWishlist = async function(e, id) {
  e.stopPropagation();
  try {
    const res = await fetch('http://localhost:5000/api/user/wishlist/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listingId: id })
    });
    const data = await res.json();
    if (res.ok) {
      state.wishlist = new Set(data.wishlist);

      // If currently on profile page and the active tab is "Wishlist", refresh it
if (location.pathname === '/profile' && state.profileTab === 'Wishlist') {
  const userListings = [];
  const contentDiv = document.getElementById("profile-tab-content");
  if (contentDiv) {
    contentDiv.innerHTML = renderProfileTabContent(userListings, []);
  }
}
      const l = LISTINGS.find(l => l.id === id);
      if (data.added) {
        toast("Added to Wishlist ❤️", l?.title, "success");
      } else {
        toast("Removed from Wishlist", l?.title, "info");
      }
      // Update all UI buttons
      document.querySelectorAll('.p-wishlist').forEach(btn => {
        const card = btn.closest('[data-id]');
        if (card && parseInt(card.dataset.id) === id) {
          const isActive = state.wishlist.has(id);
          btn.className = `p-wishlist ${isActive ? 'active' : ''}`;
          btn.textContent = isActive ? '❤️' : '🤍';
        }
      });
      const countEl = document.getElementById('wishlistCount');
      if (countEl) countEl.textContent = state.wishlist.size;
      // If on profile wishlist tab, refresh that content
      if (location.pathname === '/profile' && state.profileTab === 'Wishlist') {
        const userListings = [];
        const wishlistItems = LISTINGS.filter(l => state.wishlist.has(l.id));
        document.getElementById('profile-tab-content').innerHTML = renderProfileTabContent(userListings, wishlistItems);
      }
    } else {
      toast("Error", data.error, "error");
    }
  } catch (err) {
    toast("Network error", "Could not update wishlist", "error");
  }
};

window.buyNow = async function(e, id) {
  e?.stopPropagation();
  if (!state.user || state.user.isGuest) {
    toast("Login required", "Please sign in to purchase", "error");
    openLogin();
    return;
  }
  if (!window.ethereum) {
    toast("MetaMask required", "Please install MetaMask", "error");
    return;
  }
  
  // 1. Get listing details (we need seller wallet and price)
  // Since we have enriched listing, we can find it from global LISTINGS? But LISTINGS is empty now.
  // Instead, fetch directly from backend or keep a local map.
  // For simplicity, we'll fetch listing by id from backend.
  let listing;
  try {
    const res = await fetch(`http://localhost:5000/api/listings/${id}`, { credentials: 'include' });
    const data = await res.json();
    listing = enrichListing(data.listing);
  } catch (err) {
    toast("Error", "Could not fetch listing details", "error");
    return;
  }
  
  if (!listing.sellerWallet) {
    toast("Seller wallet missing", "Cannot complete purchase", "error");
    return;
  }
  
  // 2. Prepare transaction
  const prepRes = await fetch('http://localhost:5000/api/transaction/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ listingId: id })
  });
  const prepData = await prepRes.json();
  if (!prepRes.ok) {
    toast("Cannot prepare purchase", prepData.error, "error");
    return;
  }
  
  const { sellerWallet, amountEth } = prepData;
  
  try {
    // 3. Request MetaMask transaction
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: accounts[0],
        to: sellerWallet,
        value: ethers.utils.parseEther(amountEth.toString()).toHexString(),
      }],
    });
    
    // 4. Confirm with backend
    const confirmRes = await fetch('http://localhost:5000/api/transaction/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listingId: id, txHash, amountEth })
    });
    const confirmData = await confirmRes.json();
    if (confirmRes.ok) {
      toast("Purchase successful!", `TX: ${txHash.slice(0,10)}...`, "success");
      route(); // refresh current page to update listing status
    } else {
      toast("Backend error", confirmData.error, "error");
    }
  } catch (err) {
    toast("Transaction failed", err.message, "error");
  }
};

/* ── HOME PAGE ── */
function renderHome($el) {
  const featured = LISTINGS.filter(l => l.featured).slice(0, 6);
  const fresh = LISTINGS.filter(l => !l.featured).slice(0, 8);

  $el.innerHTML = `
    <section class="hero">
      <div class="hero-bg">
        <div class="grid-bg"></div>
        <div class="hero-orb orb1"></div>
        <div class="hero-orb orb2"></div>
      </div>
      <div class="hero-content">
        <div class="hero-tag"><span>⚡</span> Web3 Powered Marketplace <div class="dot"></div></div>
        <h1>Buy & Sell with<br><span class="grad-text">Verified Trust</span></h1>
        <p>The world's safest marketplace. Every transaction verified on-chain, every seller scored by our AI trust system.</p>
        <div class="hero-btns">
          <button class="btn btn-primary btn-lg" onclick="navigate('/listings')">Browse Listings →</button>
          <button class="btn btn-outline btn-lg" onclick="openLogin()">⚡ Start Selling</button>
        </div>
        <div class="hero-badges">
          <div class="feature-badge"><span>🛡️</span> Blockchain Secured</div>
          <div class="feature-badge"><span>⚡</span> Instant Trust Scores</div>
          <div class="feature-badge"><span>🔒</span> Anti-Scam Protection</div>
        </div>
      </div>
    </section>

    <section class="stats-section">
      <div class="stats-grid" style="max-width:1152px;margin:0 auto">
        ${[
          {icon:"⚡",val:"48K+",label:"Active Listings"},
          {icon:"🛡️",val:"12K+",label:"Trusted Sellers"},
          {icon:"📈",val:"890K+",label:"Transactions"},
          {icon:"🌐",val:"64",label:"Countries"},
        ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-val">${s.val}</div><div class="stat-label">${s.label}</div></div>`).join("")}
      </div>
    </section>

    <div class="section">
      <div class="section-head">
        <div><h2>Categories</h2></div>
        <span class="view-all" onclick="navigate('/listings')">View all ›</span>
      </div>
      <div class="cats-scroll">
        ${CATEGORIES.map(c => `
          <button class="cat-btn ${state.category===c.id?"active":""}" onclick="goCategory('${c.id}')">
            <span class="cat-emoji">${c.icon}</span>${c.label}
          </button>`).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <div><h2>Featured Listings</h2><p>Hand-picked by our team</p></div>
        <span class="view-all" onclick="navigate('/listings')">See all ›</span>
      </div>
      <div class="product-grid">
        ${featured.map((l,i) => productCard(l, i*0.06)).join("")}
      </div>
    </div>

    <div class="section">
      <div class="section-head">
        <div><h2>Fresh Listings</h2><p>Just added to the marketplace</p></div>
        <span class="view-all" onclick="navigate('/listings')">View all ›</span>
      </div>
      <div class="product-grid">
        ${fresh.map((l,i) => productCard(l, i*0.06)).join("")}
      </div>
    </div>

    <div style="padding:0 24px;max-width:1200px;margin:0 auto">
      <div class="cta-banner">
        <div class="cta-banner-content">
          <div style="font-size:40px;margin-bottom:14px">⚡</div>
          <h2>Ready to Start Selling?</h2>
          <p>Join thousands of verified sellers. List your items in minutes and reach buyers worldwide.</p>
          <div class="cta-banner-btns">
            <button class="cta-white btn" onclick="openLogin()">Join TrustMarket</button>
            <button class="cta-clear btn" onclick="navigate('/listings')">Browse Listings</button>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <div class="footer-inner">
        <div class="footer-grid">
          <div>
            <div class="footer-logo"><span style="font-size:20px">🛡️</span>Trust<span style="color:var(--primary2)">Market</span></div>
            <p class="footer-desc">The world's safest Web3 marketplace. Trade with verified trust on blockchain.</p>
          </div>
          <div class="footer-col"><h4>Marketplace</h4><a href="#">Browse</a><a href="#">Categories</a><a href="#">Featured</a></div>
          <div class="footer-col"><h4>Company</h4><a href="#">About</a><a href="#">Blog</a><a href="#">Careers</a><a href="#">Press</a></div>
          <div class="footer-col"><h4>Support</h4><a href="#">Help Center</a><a href="#">Safety</a><a href="#">Community</a><a href="#">Contact</a></div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 TrustMarket. All rights reserved.</span>
          <div class="footer-chain"><div class="dot"></div><span>Secured by Blockchain Verification</span></div>
        </div>
      </div>
    </footer>
  `;
}

window.goCategory = function(id) {
  state.category = id;
  navigate("/listings");
};

/* ── LISTINGS PAGE ── */
async function renderListings($el) {
  const listingsData = await fetchListings();
  let items = listingsData;
  if (state.category !== "all") items = items.filter(l => l.category === state.category);
  if (state.search) {
    const q = state.search.toLowerCase();
    items = items.filter(l => l.title.toLowerCase().includes(q) || l.seller.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
  }
  switch (state.sort) {
    case "price-low": items.sort((a,b) => a.price - b.price); break;
    case "price-high": items.sort((a,b) => b.price - a.price); break;
    case "trust-high": items.sort((a,b) => b.trust - a.trust); break;
  }
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  if (state.page > totalPages) state.page = 1;
  const paged = items.slice((state.page - 1) * ITEMS_PER_PAGE, state.page * ITEMS_PER_PAGE);
  const activeCatLabel = CATEGORIES.find(c => c.id === state.category)?.label || "All";

  $el.innerHTML = `
    <div class="listings-page">
      <div class="listings-header">
        <div>
          <h1>${state.category === "all" ? "All Listings" : activeCatLabel}</h1>
          <div class="listings-count">${total} item${total !== 1 ? "s" : ""} found${state.search ? ` for "<b>${escHtml(state.search)}</b>"` : ""}</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <select class="sort-select" id="sort-sel">
            <option value="newest" ${state.sort==="newest"?"selected":""}>Newest First</option>
            <option value="price-low" ${state.sort==="price-low"?"selected":""}>Price: Low to High</option>
            <option value="price-high" ${state.sort==="price-high"?"selected":""}>Price: High to Low</option>
            <option value="trust-high" ${state.sort==="trust-high"?"selected":""}>Highest Trust</option>
          </select>
        </div>
      </div>
      <div class="filter-cats">
        ${CATEGORIES.map(c => `<button class="filter-cat ${state.category===c.id?"active":""}" onclick="filterCat('${c.id}')">${c.icon} ${c.label}</button>`).join("")}
      </div>
      <div class="active-filters" id="active-filters">
        ${state.category !== "all" ? `<span class="active-tag">${activeCatLabel} ✕</span>` : ""}
        ${state.search ? `<span class="active-tag">"${escHtml(state.search)}" ✕</span>` : ""}
      </div>
      ${paged.length === 0 ? `
        <div class="not-found">
          <div class="emoji">😔</div>
          <h1>No Listings Found</h1>
          <p>Try different keywords or filters.</p>
          <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
        </div>
      ` : `
        <div class="product-grid">${paged.map((l,i) => productCard(l, i*0.04)).join("")}</div>
        ${totalPages > 1 ? `
          <div class="pagination">
            <button class="page-btn" onclick="changePage(${state.page - 1})" ${state.page===1?"disabled":""}>← Prev</button>
            ${Array.from({length:totalPages},(_,i)=>i+1).map(p=>`<button class="page-btn ${p===state.page?"active":""}" onclick="changePage(${p})">${p}</button>`).join("")}
            <button class="page-btn" onclick="changePage(${state.page + 1})" ${state.page===totalPages?"disabled":""}>Next →</button>
          </div>
        ` : ""}
      `}
    </div>
  `;
  document.getElementById("sort-sel").addEventListener("change", e => { state.sort = e.target.value; state.page = 1; route(); });
}

window.filterCat = function(id) { state.category = id; state.page = 1; route(); };
window.clearFilters = function() { state.category = "all"; state.search = ""; state.page = 1; document.getElementById("nav-search-input").value = ""; route(); };
window.changePage = function(p) { state.page = p; route(); window.scrollTo({top:0,behavior:"smooth"}); };

let activeGalleryImg = 0;

async function renderDetail($el) {
  let l = LISTINGS.find(x => x.id === state.productId);
  
  // If not found in current browse list (e.g. sold item or direct link), fetch from backend
  if (!l) {
    try {
      const res = await fetch(`http://localhost:5000/api/listings/${state.productId}`);
      if (res.ok) {
        const data = await res.json();
        l = enrichListing(data.listing);
      }
    } catch (e) {
      console.log("Error fetching listing detail");
    }
  }

  let MOCK_REVIEWS = [];
  try {
    const revRes = await fetch(`http://localhost:5000/api/reviews/${state.productId}`);
    if (revRes.ok) {
      const revData = await revRes.json();
      MOCK_REVIEWS = revData.reviews.map(r => ({
        name: r.reviewerName,
        initials: r.reviewerInitials,
        rating: r.rating,
        text: r.text,
        date: new Date(r.createdAt).toLocaleDateString()
      }));
    }
  } catch (e) {
    console.log("Could not fetch reviews");
  }
  if (!l) {
    $el.innerHTML = `<div class="not-found"><div class="emoji">🔍</div><h1>Listing Not Found</h1><p>This listing may have been removed.</p><button class="btn btn-primary" onclick="navigate('/listings')">Browse Listings</button></div>`;
    return;
  }
  
  const isOwner = state.user && l.sellerId === state.user._id;

  activeGalleryImg = 0;
  let imgs = l.images && l.images.length > 0 ? l.images : [l.img, `https://picsum.photos/seed/${l.id}_2/400/300`, `https://picsum.photos/seed/${l.id}_3/400/300`];
  $el.innerHTML = `
    <div class="detail-page">
      <div class="back-btn" onclick="navigate('/listings')">← Back to Listings</div>
      <div class="detail-grid">
        <div>
          <div class="gallery-main" id="gallery-main">
            <img id="gallery-img" src="${imgs[0]}" alt="${escHtml(l.title)}" />
            <div class="gallery-nav">
              <button class="gallery-arrow" onclick="galleryNav(-1)">‹</button>
              <button class="gallery-arrow" onclick="galleryNav(1)">›</button>
            </div>
            ${l.featured ? `<div class="badge-featured" style="position:absolute;top:14px;left:14px">⚡ Featured</div>` : ""}
          </div>
          <div class="gallery-thumbs" id="gallery-thumbs">
            ${imgs.map((img,i)=>`<div class="gallery-thumb ${i===0?"active":""}" onclick="setGalleryImg(${i},'${img}')"><img src="${img}" alt="" /></div>`).join("")}
          </div>
        </div>
        <div class="detail-info">
          <div class="detail-top">
            <span class="p-cat" style="font-size:12px">${l.category.replace("-"," ")}</span>
            <div class="detail-actions-top">
              <button class="btn btn-ghost btn-icon" onclick="navigator.clipboard?.writeText(location.href);toast('Link Copied!','Share this listing')">🔗</button>
              <button class="btn btn-ghost btn-icon" id="detail-wish-btn" onclick="toggleDetailWishlist('${l.id}')">${state.wishlist.has(l.id)?"❤️":"🤍"}</button>
            </div>
          </div>
          <h1 class="detail-title">${escHtml(l.title)}</h1>
          <div class="detail-price-row">
            <span class="detail-price">$${l.price.toLocaleString()}</span>
            <span class="detail-cond">${l.cond}</span>
          </div>
          <div class="detail-meta">
            <span class="detail-meta-item">📍 ${escHtml(l.loc)}</span>
            <span class="detail-meta-item">🕐 ${l.posted}</span>
            <span class="detail-meta-item">🏷️ #${l.id}</span>
          </div>
          <div class="chain-verify">
            <span class="chain-icon">⚡</span>
            <div><div class="chain-verify-title">Blockchain Verified Listing</div><div class="chain-verify-sub">Transaction history on-chain. Dispute protection active.</div></div>
          </div>
          <div class="seller-card">
            <h4>Seller Information</h4>
            <div class="seller-row">
              <img class="seller-avatar-lg" src="${l.avatar}" alt="${escHtml(l.seller)}" />
              <div class="seller-name-row" style="flex:1"><h3>${escHtml(l.seller)}</h3><p>⭐ ${l.reviews} reviews</p></div>
              ${trustBadge(l.trust, "14px")}
            </div>
            <div class="trust-bar-wrap">
              <div class="trust-bar-label"><span>Trust Score</span><span style="color:${trustColor(l.trust)};font-weight:700">${l.trust}%</span></div>
              <div class="trust-bar-track"><div class="trust-bar-fill" style="width:${l.trust}%;background:${trustColor(l.trust)}"></div></div>
            </div>
          </div>
          <div class="detail-desc"><h4>Description</h4><p>${escHtml(l.desc)}</p></div>
          <div class="detail-specs">
            ${[
              {label:"Condition",val:l.cond},
              {label:"Category",val:l.category.replace("-"," ")},
              {label:"Location",val:l.loc},
              {label:"Listed",val:l.posted},
            ].map(s=>`<div class="spec-item"><div class="spec-label">${s.label}</div><div class="spec-value">${escHtml(s.val)}</div></div>`).join("")}
          </div>
          <div class="detail-action-btns">
            ${isOwner 
              ? `<button class="btn btn-outline" style="border-color:var(--red); color:var(--red);" onclick="deleteListing('${l.id}')">🗑️ Delete Listing</button>` 
              : `<button class="btn btn-primary" onclick="buyNow(null,'${l.id}')" ${l.isSold ? 'disabled' : ''}>${l.isSold ? 'Already Sold' : '🛒 Buy Now'}</button>`
            }
            <button class="btn btn-outline" onclick="contactSeller('${escHtml(l.seller)}')">💬 Contact Seller</button>
          </div>
          ${l.isSold ? `<div style="margin-top:12px; padding:10px; background:var(--bg2); border-radius:8px; border-left:4px solid var(--primary); font-size:13px; color:var(--text2)">ℹ️ This item has been sold. Reviews can still be posted.</div>` : ''}
          <div class="protect-note">🛡️ Protected by TrustMarket Buyer Shield. Report suspicious activity.</div>

        </div>
      </div>
      <div class="reviews-section">
        <h2>Reviews <span style="font-size:16px;font-weight:400;color:var(--text2)">(${MOCK_REVIEWS.length})</span></h2>
        
        <div style="margin-bottom: 24px; padding: 16px; background: var(--bg2); border-radius: 12px; border: 1px solid var(--border);">
          <h4 style="margin-bottom: 8px;">Leave a Review</h4>
          <div style="display:flex; gap: 8px; margin-bottom: 8px;">
            <select id="review-rating" style="padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg1); color: var(--text);">
              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
              <option value="4">⭐⭐⭐⭐ (4)</option>
              <option value="3">⭐⭐⭐ (3)</option>
              <option value="2">⭐⭐ (2)</option>
              <option value="1">⭐ (1)</option>
            </select>
          </div>
          <textarea id="review-text" rows="3" placeholder="Write your review here..." style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg1); color: var(--text); margin-bottom: 12px; resize: vertical;"></textarea>
          <button class="btn btn-primary btn-sm" onclick="submitReview('${l.id}')">Post Review</button>
        </div>

        <div class="reviews-grid">
          ${MOCK_REVIEWS.length === 0 ? '<p style="color:var(--text3)">No reviews yet. Be the first!</p>' : MOCK_REVIEWS.map(r => `
            <div class="review-card">
              <div class="review-header">
                <div class="review-avatar">${r.initials}</div>
                <div><div class="review-name">${r.name}</div><div class="review-date">${r.date}</div></div>
                <div class="review-stars">${"⭐".repeat(r.rating)}</div>
              </div>
              <div class="review-text">${r.text}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

window.submitReview = async function(listingId) {
  const rating = document.getElementById("review-rating").value;
  const text = document.getElementById("review-text").value;
  if (!text.trim()) return toast("Missing Text", "Please write a review.", "error");

  try {
    const res = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listingId, rating: parseInt(rating), text })
    });
    const data = await res.json();
    if (res.ok) {
      toast("Review Posted", "Thank you for your feedback!", "success");
      route(); // refresh the page
    } else {
      toast("Action Denied", data.error, "error");
    }
  } catch (err) {
    toast("Error", "Could not submit review", "error");
  }
};

window.galleryNav = function(dir) {
  const l = LISTINGS.find(l=>l.id===state.productId);
  const imgs = l ? [l.img] : [];
  const total = 3;
  activeGalleryImg = (activeGalleryImg + dir + total) % total;
  const src = imgs[0] + (activeGalleryImg === 1 ? "&sat=-20" : activeGalleryImg === 2 ? "&hue=180" : "");
  document.getElementById("gallery-img").src = src;
  document.querySelectorAll(".gallery-thumb").forEach((el,i) => el.classList.toggle("active", i === activeGalleryImg));
};
window.setGalleryImg = function(idx, src) { activeGalleryImg = idx; document.getElementById("gallery-img").src = src; document.querySelectorAll(".gallery-thumb").forEach((el,i) => el.classList.toggle("active", i === idx)); };
window.toggleDetailWishlist = function(id) { if (state.wishlist.has(id)) { state.wishlist.delete(id); toast("Removed from Wishlist"); } else { state.wishlist.add(id); toast("Added to Wishlist ❤️", LISTINGS.find(l=>l.id===id)?.title); } const btn = document.getElementById("detail-wish-btn"); if (btn) btn.textContent = state.wishlist.has(id) ? "❤️" : "🤍"; };
window.contactSeller = function(name) { toast("Message Sent 💬", `Your message to ${name} has been sent.`); };

/* ── SELL PAGE (full, intact) ── */
function renderSell($el) {
  if (state.sellDone) {
    $el.innerHTML = `
      <div class="sell-page">
        <div class="sell-success">
          <div class="success-icon">✅</div>
          <h1>Listing Published!</h1>
          <p>Your item <strong>"${escHtml(state.sellForm.title || "your item")}"</strong> is now live on TrustMarket. Buyers can find and contact you immediately.</p>
          <div class="sell-success-btns">
            <button class="btn btn-primary btn-lg" onclick="navigate('/listings')">Browse Listings</button>
            <button class="btn btn-outline btn-lg" onclick="resetSell()">List Another Item</button>
          </div>
        </div>
      </div>
    `;
    return;
  }
  $el.innerHTML = `
    <div class="sell-page">
      <h1>List Your Item</h1>
      <p>Reach thousands of verified buyers on TrustMarket</p>
      <div class="chain-badge" style="margin-bottom:24px">🛡️ Secure listing — verified & blockchain-stamped ⚡</div>
      <form id="sell-form" onsubmit="submitSell(event)">
        <div class="form-group">
          <label class="form-label">Photos <span style="font-weight:400;color:var(--text2)">(up to 4)</span></label>
          <div class="upload-zone" id="upload-zone" ondragover="uploadDragOver(event)" ondragleave="uploadDragLeave()" ondrop="uploadDrop(event)">
            <input type="file" id="file-input" accept="image/*" multiple onchange="uploadFiles(this)" />
            <div class="upload-icon">📸</div>
            <p>Drop images here or <span onclick="document.getElementById('file-input').click()">click to browse</span></p>
          </div>
          <div class="image-previews" id="image-previews"></div>
        </div>
        <div class="form-group"><label class="form-label">Title <span class="req">*</span></label><input type="text" id="sell-title" placeholder="e.g. iPhone 14 Pro 256GB — Space Black" required /></div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0"><label class="form-label">Price (USD) <span class="req">*</span></label><div class="price-input"><span class="currency">$</span><input type="number" id="sell-price" placeholder="0.00" min="0" required /></div></div>
          <div class="form-group" style="margin-bottom:0"><label class="form-label">Condition <span class="req">*</span></label><div class="relative"><select id="sell-cond" required><option value="">Select...</option><option>New</option><option>Like New</option><option>Good</option><option>Fair</option><option>For Parts</option><option>Service</option></select></div></div>
        </div>
        <div class="form-group" style="margin-top:18px"><label class="form-label">Category <span class="req">*</span></label><div class="cat-picker" id="cat-picker">${CATEGORIES.filter(c=>c.id!=="all").map(c => `<button type="button" class="cat-pick-btn" data-id="${c.id}" onclick="pickCat('${c.id}')"><span class="e">${c.icon}</span>${c.label}</button>`).join("")}</div><input type="hidden" id="sell-cat" /></div>
        <div class="form-group"><label class="form-label">Description</label><textarea id="sell-desc" rows="4" placeholder="Describe your item: age, features, defects, accessories..."></textarea></div>
        <div class="form-group"><label class="form-label">Location</label><input type="text" id="sell-loc" placeholder="City, State (or Remote)" /></div>
        <button type="submit" class="btn btn-primary w-full btn-lg" style="margin-top:8px">🚀 Publish Listing</button>
        <p style="text-align:center;font-size:12px;color:var(--text3);margin-top:12px">By listing, you agree to TrustMarket's <span style="color:var(--primary2);cursor:pointer">Terms</span> and <span style="color:var(--primary2);cursor:pointer">Seller Policy</span></p>
      </form>
    </div>
  `;
}

window.pickCat = function(id) { document.getElementById("sell-cat").value = id; document.querySelectorAll(".cat-pick-btn").forEach(b => b.classList.toggle("active", b.dataset.id === id)); };
window.uploadDragOver = function(e) { e.preventDefault(); document.getElementById("upload-zone").classList.add("over"); };
window.uploadDragLeave = function() { document.getElementById("upload-zone").classList.remove("over"); };
window.uploadDrop = function(e) { e.preventDefault(); document.getElementById("upload-zone").classList.remove("over"); handleFiles(Array.from(e.dataTransfer.files)); };
window.uploadFiles = function(input) { handleFiles(Array.from(input.files)); };
function handleFiles(files) { 
  const availableSlots = 4 - state.sellImages.length;
  const toAdd = files.slice(0, availableSlots);
  toAdd.forEach(f => { 
    state.sellImages.push(URL.createObjectURL(f)); 
    state.sellFiles.push(f);
  }); 
  renderImagePreviews(); 
}
function renderImagePreviews() { const $el = document.getElementById("image-previews"); if (!$el) return; $el.innerHTML = state.sellImages.map((url, i) => `<div class="img-preview"><img src="${url}" alt="preview" /><div class="img-remove" onclick="removeImg(${i})">✕</div></div>`).join("") + (state.sellImages.length < 4 ? `<label for="file-input" style="width:76px;height:76px;border-radius:10px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:24px;color:var(--text3)">+</label>` : ""); }
window.removeImg = function(i) { 
  state.sellImages.splice(i, 1); 
  state.sellFiles.splice(i, 1);
  renderImagePreviews(); 
};

window.submitSell = async function(e) {
  e.preventDefault();
  const title = document.getElementById("sell-title")?.value;
  const price = document.getElementById("sell-price")?.value;
  const cond = document.getElementById("sell-cond")?.value;
  const cat = document.getElementById("sell-cat")?.value;
  const desc = document.getElementById("sell-desc")?.value;
  const loc = document.getElementById("sell-loc")?.value;
  
  if (!title || !price || !cond || !cat) {
    toast("Missing Fields", "Please fill all required fields.", "error");
    return;
  }
  
  if (!window.ethereum) {
    toast("MetaMask required", "Please install MetaMask to sell items", "error");
    return;
  }
  
  let walletAddress;
  // MetaMask Confirmation before publishing
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    walletAddress = accounts[0];
    const message = `Sign this message to confirm publishing your listing: "${title}" for $${price}`;
    await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    });
    toast("Confirmed via MetaMask", "Publishing listing...", "info");
  } catch (err) {
    toast("Listing Cancelled", "MetaMask confirmation was rejected", "error");
    return;
  }
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('price', price);
  formData.append('category', cat);
  formData.append('condition', cond);
  formData.append('description', desc);
  formData.append('location', loc);
  formData.append('sellerWallet', walletAddress);
  
  state.sellFiles.forEach(file => {
    formData.append('images', file);
  });
  
  try {
    const res = await fetch('http://localhost:5000/api/listings', {
      method: 'POST',
      credentials: 'include',
      body: formData // No Content-Type header needed for FormData
    });
    const data = await res.json();
    if (res.ok) {
      state.sellForm = { title, price, cond, cat };
      state.sellDone = true;
      state.sellImages = [];
      state.sellFiles = [];
      toast("Listing Published! 🎉", `"${title}" is now live.`, "success");
      route(); // re-render to show success page
    } else {
      toast("Failed to publish", data.error, "error");
    }
  } catch (err) {
    toast("Error", "Could not connect to server", "error");
  }
};

window.resetSell = function() { state.sellDone = false; state.sellForm = {}; state.sellImages = []; state.sellFiles = []; route(); };

/* ── PROFILE PAGE ── */
function renderProfile($el) {
  if (!state.user || state.user.isGuest) {
    $el.innerHTML = `
      <div class="profile-page" style="text-align:center; padding: 80px 20px;">
        <div class="emoji" style="font-size: 64px;">🔒</div>
        <h2>Not Logged In</h2>
        <p>Please sign in to view your profile</p>
        <button class="btn btn-primary" onclick="openLogin()">Sign In</button>
      </div>
    `;
    return;
  }

  const user = state.user;
  const userName = user.name || user.email || (user.walletAddress ? user.walletAddress.slice(0,10) : 'User');
  const userEmail = user.email || 'No email provided';
  let userWallet = user.walletAddress;
  
  // Also check if browser has metamask connected
  if (!userWallet && window.ethereum && window.ethereum.selectedAddress) {
    userWallet = window.ethereum.selectedAddress;
  }
  
  const isWalletConnected = !!userWallet;
  userWallet = userWallet || 'Not connected';
  const trustScore = user.trustScore || 70;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently';
  const tabs = ["Listings", "Purchased", "Wishlist", "Reviews"];

  $el.innerHTML = `
    <div class="profile-page">
      <div class="profile-cover">
        <div class="cover-img"><div class="cover-grid"></div></div>
        <div class="profile-body">
          <div class="profile-avatar-row">
            <div class="profile-avatar">${userName.charAt(0).toUpperCase()}<div class="verified-dot">✓</div></div>
            <button class="btn btn-ghost btn-sm" onclick="toast('Edit Profile', 'Coming soon')">✏️ Edit Profile</button>
          </div>
          <div>
            <div class="profile-name-row">
              <span class="profile-name">${escHtml(userName)}</span>
              <span class="verified-badge">✓ Verified</span>
              ${trustBadge(trustScore, "14px")}
            </div>
            <div class="profile-handle">${escHtml(userEmail)} · Member since ${memberSince}</div>
            <div class="profile-info-row">
              <span>📍 Location not set</span>
              <span>📅 ${Math.floor((Date.now() - new Date(user.createdAt)) / (1000*60*60*24*30))} months</span>
              <span>⭐ ${trustScore}% Trust</span>
            </div>
            <div style="margin-top:10px">
              ${isWalletConnected 
                ? `<span class="wallet-tag">🦊 ${userWallet.slice(0,6)}...${userWallet.slice(-4)} <span style="color:var(--green);margin-left:6px">● Connected</span></span>`
                : `<button class="btn btn-sm btn-outline" onclick="connectMetaMaskToProfile()">🦊 Connect MetaMask</button>`
              }
            </div>
            <div class="trust-bar-wrap" style="max-width:280px;margin-top:12px">
              <div class="trust-bar-label"><span>Trust Score</span><span style="color:${trustColor(trustScore)};font-weight:700">${trustScore}%</span></div>
              <div class="trust-bar-track"><div class="trust-bar-fill" style="width:${trustScore}%;background:${trustColor(trustScore)}"></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-stats">
        ${[
          {icon:"📦", val:user.totalSales || 0, label:"Sales"},
          {icon:"🛒", val:user.totalPurchases || 0, label:"Purchases"},
          {icon:"⭐", val:user.positiveReviews || 0, label:"Reviews"},
          {icon:"❤️", val:state.wishlist.size, label:"Wishlist"}
        ].map(s => `<div class="p-stat-card"><div class="p-stat-icon">${s.icon}</div><div class="p-stat-val">${s.val}</div><div class="p-stat-label">${s.label}</div></div>`).join("")}
      </div>
      <div class="profile-tabs">
        ${tabs.map(t => `<div class="p-tab ${state.profileTab === t ? 'active' : ''}" onclick="setProfileTab('${t}')">${t}</div>`).join("")}
      </div>
      <div id="profile-tab-content">
        <!-- will be filled after fetch -->
      </div>
    </div>
  `;

  // Fetch user's own listings and display the default tab
  fetchMyListings().then(listings => {
    state.myListings = listings;
    refreshProfileContent();
  });
  
  fetchMyPurchases().then(purchases => {
    state.myPurchases = purchases;
    refreshProfileContent();
  });

  // After fetching user's own listings, also fetch all listings for wishlist
  fetchListings().then(all => {
    state.allListings = all;
    refreshProfileContent();
  });
}

function refreshProfileContent() {
  const contentDiv = document.getElementById("profile-tab-content");
  if (!contentDiv) return;
  
  if (state.profileTab === 'Listings') {
    contentDiv.innerHTML = renderProfileTabContent(state.myListings || [], []);
  } else if (state.profileTab === 'Purchased') {
    contentDiv.innerHTML = renderProfileTabContent([], [], state.myPurchases || []);
  } else if (state.profileTab === 'Wishlist') {
    const wishlistItems = (state.allListings || []).filter(l => state.wishlist.has(l.id));
    contentDiv.innerHTML = renderProfileTabContent([], wishlistItems);
  } else {
    contentDiv.innerHTML = renderProfileTabContent([], []);
  }
}

window.connectMetaMaskToProfile = async function() {
  if (!window.ethereum) return toast("MetaMask required", "Please install MetaMask", "error");
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts[0]) {
      toast("MetaMask Connected", "Wallet attached to session.", "success");
      // Optionally save it to backend here, but for now we'll just reload UI
      route();
    }
  } catch(e) {
    toast("Connection Failed", "Could not connect wallet", "error");
  }
};



function renderProfileTabContent(userListings, wishlistItems, purchasedItems = []) {
  if (state.profileTab === "Listings") {
    if (userListings.length === 0) {
      return `<div class="not-found" style="padding:40px 0">
        <div class="emoji">📦</div>
        <p>You haven't listed any items yet.</p>
        <button class="btn btn-primary" onclick="navigate('/sell')">Sell Your First Item</button>
      </div>`;
    }
    return `<div class="product-grid">
      ${userListings.map((l,i) => `
        <div style="position:relative">
          ${productCard(l,i*0.05)}
          <button class="btn btn-sm btn-outline" style="position:absolute; top:10px; right:10px; z-index:10; background:rgba(0,0,0,0.5); border-color:var(--red); color:white;" onclick="deleteListing('${l.id}')">🗑️</button>
        </div>
      `).join("")}
    </div>`;
  }
  
  if (state.profileTab === "Purchased") {
    if (purchasedItems.length === 0) {
      return `<div class="not-found" style="padding:40px 0">
        <div class="emoji">🛍️</div>
        <p>You haven't bought anything yet.</p>
        <button class="btn btn-primary" onclick="navigate('/listings')">Start Shopping</button>
      </div>`;
    }
    return `
      <div class="purchased-list" style="display:grid; gap:20px;">
        ${purchasedItems.map(l => `
          <div class="purchased-item" style="background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; gap:20px; align-items:center;">
            <img src="${l.img}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;" />
            <div style="flex:1;">
              <h4 style="margin:0 0 4px 0;">${escHtml(l.title)}</h4>
              <p style="margin:0; color:var(--text2); font-size:14px;">Bought from ${escHtml(l.seller)} for $${l.price}</p>
              <div style="margin-top:8px; font-size:12px; color:var(--text3);">Transaction Complete · ${l.posted}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="navigate('/product/${l.id}')">Write Review</button>
          </div>
        `).join("")}
      </div>
    `;
  }
  
  if (state.profileTab === "Wishlist") {
  // Use all listings fetched from backend (we'll store them globally)
  if (!state.allListings) {
    // Fallback – fetch now (but better to set in renderProfile)
    return `<div class="not-found">Loading wishlist...</div>`;
  }
  const currentWishlistItems = state.allListings.filter(l => state.wishlist.has(l.id));
  if (currentWishlistItems.length === 0) {
    return `<div class="not-found" style="padding:40px 0">...</div>`;
  }
  return `<div class="product-grid">${currentWishlistItems.map((l,i) => productCard(l,i*0.05)).join("")}</div>`;
}
  
  if (state.profileTab === "Reviews") {
    if (!state.userReviews) {
      // Trigger fetch
      fetchUserReviews().then(reviews => {
        state.userReviews = reviews;
        const contentDiv = document.getElementById("profile-tab-content");
        if (contentDiv && state.profileTab === "Reviews") {
          contentDiv.innerHTML = renderProfileTabContent(userListings, []);
        }
      });
      return `<div class="not-found">Loading reviews...</div>`;
    }
    
    if (state.userReviews.length === 0) {
      return `<div class="not-found" style="padding:40px 0">
        <div class="emoji">📝</div>
        <p>No reviews yet.</p>
        <p class="text-muted">After you buy or sell, buyers can leave reviews.</p>
      </div>`;
    }
    
    return `<div class="reviews-list" style="margin-top:24px; display:flex; flex-direction:column; gap:16px;">
      ${state.userReviews.map(r => `
        <div class="review-item" style="background:var(--bg2); padding:16px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
            <div>
              <strong>${"⭐".repeat(r.rating)}${"☆".repeat(5-r.rating)}</strong>
              <span style="color:var(--text2); margin-left:8px; font-size:14px;">on ${r.listingId?.title || "Unknown Listing"}</span>
            </div>
            <div style="color:var(--text3); font-size:12px;">${new Date(r.createdAt).toLocaleDateString()}</div>
          </div>
          <p style="margin:0; color:var(--text1);">${escHtml(r.text)}</p>
        </div>
      `).join("")}
    </div>`;
  }
  
  return '';
}

window.deleteListing = async function(id) {
  if (!confirm("Are you sure you want to delete this listing permanently?")) return;
  try {
    const res = await fetch(`http://localhost:5000/api/listings/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      toast("Listing Deleted", "The item has been removed from the marketplace.");
      if (state.page === '/product') {
        navigate('/listings');
      } else {
        route();
      }
    } else {
      toast("Error", data.error || "Could not delete listing", "error");
    }
  } catch (e) {
    toast("Error", "Network error", "error");
  }
};

window.setProfileTab = function(tab) {
  state.profileTab = tab;
  refreshProfileContent();
  // Update active tab styling
  document.querySelectorAll('.p-tab').forEach(el => {
    el.classList.toggle('active', el.textContent === tab);
  });
};

async function fetchUserReviews() {
  try {
    const res = await fetch('http://localhost:5000/api/user/reviews', { credentials: 'include' });
    const data = await res.json();
    return data.reviews || [];
  } catch (e) {
    return [];
  }
}

async function logout() {
  try {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    state.user = null;
    updateNavbarForLoggedInUser();
    toast('Logged out', 'You have been signed out', 'success');
    navigate('/');
    // Force reload to clear any cached state
    setTimeout(() => window.location.reload(), 500);
  } catch (err) {
    toast('Logout error', err.message, 'error');
  }
}
window.logout = logout;



/* ── AUDIT PAGE (with detailed logs) ── */
async function renderAudit($el) {
  // Fetch real audit logs and leaderboard
  let logs = [];
  let topUsers = [];
  let lowUsers = [];
  try {
    const [logsRes, leaderRes] = await Promise.all([
      fetch('http://localhost:5000/api/audit/logs', { credentials: 'include' }),
      fetch('http://localhost:5000/api/audit/leaderboard', { credentials: 'include' })
    ]);
    const logsData = await logsRes.json();
    const leaderData = await leaderRes.json();
    logs = logsData.logs || [];
    topUsers = leaderData.topUsers || [];
    lowUsers = leaderData.lowUsers || [];
  } catch (err) {
    console.error(err);
  }
  
  $el.innerHTML = `
    <div class="audit-page">
      <div class="audit-header">
        <div class="audit-tag">🛡️ Blockchain Trust Audit</div>
        <h1>Transparency Dashboard</h1>
        <p>Verify marketplace participants and understand our trust-scoring algorithm.</p>
      </div>
      
      <div class="audit-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <div class="trust-explainer" style="background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
          <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">📊 Trust Calculation Rules</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary);">
              <span>👶 New Account Base</span>
              <span style="font-weight: 700; color: var(--primary);">50 pts</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--green);">
              <span>🤝 Successful Sale</span>
              <span style="font-weight: 700; color: var(--green);">+10 pts</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--blue);">
              <span>🛒 Escrow Purchase</span>
              <span style="font-weight: 700; color: var(--blue);">+5 pts</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg1); padding: 12px; border-radius: 8px; border-left: 4px solid var(--yellow);">
              <span>📝 Verified Review</span>
              <span style="font-weight: 700; color: var(--yellow);">+2 pts</span>
            </div>
          </div>
        </div>

        <div class="trust-tiers" style="background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
          <h3 style="margin-bottom: 16px;">🏆 Marketplace Tiers</h3>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: rgba(0, 200, 83, 0.1); color: var(--green); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">✅</div>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: var(--green);">Highly Trusted (80-100%)</div>
                <div style="font-size: 12px; color: var(--text2);">Verified reputation, secure history.</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: rgba(255, 215, 0, 0.1); color: var(--yellow); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">⚠️</div>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: var(--yellow);">Moderate Trust (50-79%)</div>
                <div style="font-size: 12px; color: var(--text2);">Active users with standard history.</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; background: rgba(255, 82, 82, 0.1); color: var(--red); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px;">❌</div>
              <div style="flex: 1;">
                <div style="font-weight: 700; color: var(--red);">Low Trust (< 50%)</div>
                <div style="font-size: 12px; color: var(--text2);">Unverified or flagged for issues.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="leaderboard-section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
          <h3 style="margin-bottom: 16px; color: var(--green);">🌟 Top Rated Participants</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${topUsers.length ? topUsers.map(u => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg1); padding: 10px 16px; border-radius: 8px;">
                <span>${escHtml(u.name || u.email)}</span>
                <span class="trust-badge trust-high">🛡️ ${u.trustScore}%</span>
              </div>
            `).join('') : '<p style="color:var(--text3); font-size: 13px;">No highly trusted users yet.</p>'}
          </div>
        </div>
        <div style="background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px;">
          <h3 style="margin-bottom: 16px; color: var(--red);">⚠️ Flagged / Low Trust</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${lowUsers.length ? lowUsers.map(u => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg1); padding: 10px 16px; border-radius: 8px;">
                <span>${escHtml(u.name || u.email)}</span>
                <span class="trust-badge trust-low">🛡️ ${u.trustScore}%</span>
              </div>
            `).join('') : '<p style="color:var(--text3); font-size: 13px;">No low trust users found.</p>'}
          </div>
        </div>
      </div>

      <div class="audit-search-wrap">
        <div class="relative flex-1">
          <span class="audit-search-icon">🔍</span>
          <input type="search" id="audit-input" placeholder="Seller name, listing title or ID..." value="${escHtml(state.auditQuery)}" />
        </div>
        <button class="btn btn-primary" onclick="runAudit()">Search Database</button>
      </div>

      <div id="audit-result-wrap">${state.auditResult ? renderAuditResult(state.auditResult) : ""}</div>

      <div class="audit-card" style="margin-top: 32px;">
        <h3 style="margin-bottom: 16px;">📋 Global Audit Logs</h3>
        <div style="overflow-x: auto;">
          <table style="width:100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 1px solid var(--border); text-align: left;">
                <th style="padding: 12px 8px;">Timestamp</th>
                <th style="padding: 12px 8px;">User</th>
                <th style="padding: 12px 8px;">Action</th>
                <th style="padding: 12px 8px;">Details</th>
                <th style="padding: 12px 8px;">Trust Delta</th>
              </tr>
            </thead>
            <tbody id="audit-table-body">
              ${logs.map(log => `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding: 12px 8px; color: var(--text2);">${new Date(log.createdAt).toLocaleString()}</td>
                  <td style="padding: 12px 8px;"><strong>${escHtml(log.userEmail || "Anonymous")}</strong></td>
                  <td style="padding: 12px 8px;"><span style="padding: 2px 8px; background: var(--bg3); border-radius: 4px; font-size: 11px; text-transform: uppercase;">${log.action}</span></td>
                  <td style="padding: 12px 8px;">${log.details}</td>
                  <td style="padding: 12px 8px; font-weight: 600;">
                    ${log.oldTrustScore} → <span style="color: ${log.newTrustScore >= log.oldTrustScore ? 'var(--green)' : 'var(--red)'}">${log.newTrustScore}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  const auditInput = document.getElementById("audit-input");
  if (auditInput) auditInput.addEventListener("keydown", e => { if (e.key === "Enter") runAudit(); });
}


function renderAuditResult(l) {
  const cls = trustClass(l.trust);
  const statusText = l.trust >= 80 ? "Highly Trusted User" : l.trust >= 50 ? "Moderate Trust" : "Low Trust — Proceed Carefully";
  const statusIcon = l.trust >= 80 ? "✅" : l.trust >= 50 ? "⚠️" : "❌";
  const breakdown = [
    { label:"Transaction History", score: Math.min(100, l.trust + 3) },
    { label:"Buyer Feedback", score: Math.max(40, l.trust - 5) },
    { label:"Identity Verified", score: l.trust >= 80 ? 100 : 60 },
    { label:"Response Rate", score: Math.min(100, l.trust + 7) }
  ];
  
  const transactionsHtml = l.transactions && l.transactions.length
    ? `<div style="margin-top:16px"><h4>Recent Transactions</h4><div style="overflow-x:auto"><table style="width:100%; font-size:12px; border-collapse:collapse">
        <thead><tr style="border-bottom:1px solid var(--border)"><th>TX Hash</th><th>Item</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${l.transactions.map(tx => `
          <tr><td style="padding:8px 4px;font-family:monospace">${tx.hash}</td><td>${tx.item}</td><td>$${tx.amount}</td><td><span class="tx-status ${tx.status}">${tx.status}</span></td></tr>
        `).join('')}</tbody>
      </table></div></div>`
    : `<div style="margin-top:16px;color:var(--text-muted)">No recent transactions.</div>`;

  return `<div class="audit-result">
    <div class="audit-result-header">
      <img class="audit-result-avatar" src="${l.avatar}" alt="${escHtml(l.seller)}" />
      <div>
        <div class="audit-result-name">${escHtml(l.seller)}</div>
        <div class="audit-result-item">${escHtml(l.title)}</div>
      </div>
      <div class="audit-result-score">
        <div class="audit-score-num">${l.trust}</div>
        <div class="audit-score-label">Trust Score</div>
      </div>
    </div>
    <div class="audit-result-body">
      <div class="audit-status ${cls}">${statusIcon} ${statusText}</div>
      <div class="trust-bar-wrap" style="margin-bottom:14px">
        <div class="trust-bar-label"><span>Overall Score</span><span style="color:${trustColor(l.trust)};font-weight:700">${l.trust}%</span></div>
        <div class="trust-bar-track"><div class="trust-bar-fill" style="width:${l.trust}%;background:${trustColor(l.trust)}"></div></div>
      </div>
      <div class="breakdown">
        ${breakdown.map(b=>`<div class="breakdown-row">
          <span class="breakdown-label">${b.label}</span>
          <div class="breakdown-bar"><div class="breakdown-fill" style="width:${b.score}%;background:${b.score>=80?"var(--green)":b.score>=50?"var(--yellow)":"var(--red)"}"></div></div>
          <span class="breakdown-val" style="color:${trustColor(b.score)}">${b.score}%</span>
        </div>`).join("")}
      </div>
      ${transactionsHtml}
      <div class="chain-stamp" style="margin-top:12px">
        <span>⚡</span> Blockchain verified · ${l.reviews} reviews
        <div style="margin-left:auto;display:flex;align-items:center;gap:5px"><div class="dot"></div>Verified</div>
      </div>
    </div>
  </div>`;
}

window.runAudit = async function() {
  const q = document.getElementById("audit-input")?.value.trim();
  if (!q) return;
  state.auditQuery = q;
  
  try {
    const res = await fetch(`http://localhost:5000/api/audit/search?q=${encodeURIComponent(q)}`, {
      credentials: 'include'
    });
    const data = await res.json();
    const wrap = document.getElementById("audit-result-wrap");
    if (!wrap) return;
    
    if (data.user) {
      // Convert user data to match expected audit result format
      const auditUser = {
        seller: data.user.name || data.user.email || data.user.walletAddress,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name || 'User')}&background=7c5cfc&color=fff&size=128`,
        title: 'User Account',
        trust: data.user.trustScore || 70,
        reviews: data.user.positiveReviews || 0,
        transactions: data.transactions || []
      };
      wrap.innerHTML = renderAuditResult(auditUser);
    } else {
      wrap.innerHTML = `<p style="text-align:center;color:var(--text2);padding:20px 0">No user found for "<b>${escHtml(q)}</b>"</p>`;
    }
  } catch (err) {
    console.error(err);
    const wrap = document.getElementById("audit-result-wrap");
    if (wrap) wrap.innerHTML = `<p style="text-align:center;color:var(--red);padding:20px 0">Error searching: ${err.message}</p>`;
  }
};

/* ── HELPERS ── */
function escHtml(str) { if (!str) return ""; return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }


/* ── BOOT ── */
buildNav();      // creates the button
initTheme();     // now button exists, sets attribute and updates icon
fetchCurrentUser();
fetchCurrentUser().then(() => loadWishlist());
route();