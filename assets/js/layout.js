// ============================================================
// SHARED UI
// Header, bottom nav, product cards, and helpers. Every page calls
// initLayout() so the site chrome is defined in exactly one place.
// ============================================================

const WISHLIST_KEY = 'shopng_wishlist';

function initLayout(activeNav) {
  renderHeader();
  renderBottomNav(activeNav);
  updateCartBadge();
}

// ---------- HEADER (responsive: mobile search bar + cart / desktop full bar) ----------
function renderHeader() {
  const el = document.getElementById('app-header');
  if (!el) return;
  const user = API.auth.current();

  el.innerHTML = `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">ShopNG</a>
        <form class="search" action="listing.html" method="get" role="search">
          <span aria-hidden="true">🔍</span>
          <input type="search" name="q" placeholder="Search products, brands..."
                 value="${esc(param('q') || '')}" aria-label="Search products">
        </form>
        <nav class="header-actions">
          <a href="index.html">🏠 Home</a>
          <a href="cart.html" class="cart-link">🛒 Cart<span class="badge hidden" data-cart-count></span></a>
          <a href="${user ? 'account.html' : 'login.html'}">👤 ${user ? esc(user.name.split(' ')[0]) : 'Log in'}</a>
          <a href="help.html">Help</a>
        </nav>
        <a href="cart.html" class="cart-btn" aria-label="Cart">🛒<span class="badge hidden" data-cart-count></span></a>
      </div>
    </header>`;
}

// ---------- MOBILE BOTTOM NAV ----------
function renderBottomNav(active) {
  const el = document.getElementById('app-nav');
  if (!el) return;
  const loggedIn = !!API.auth.current();
  const items = [
    { key: 'home', href: 'index.html', icon: '🏠', label: 'Home' },
    { key: 'categories', href: 'listing.html', icon: '📂', label: 'Categories' },
    { key: 'cart', href: 'cart.html', icon: '🛒', label: 'Cart' },
    { key: 'account', href: loggedIn ? 'account.html' : 'login.html', icon: '👤', label: 'Account' }
  ];
  el.innerHTML = `
    <nav class="bottom-nav" aria-label="Main">
      ${items.map(i => `
        <a href="${i.href}" class="${i.key === active ? 'active' : ''}">
          <span>${i.icon}</span>${i.label}
        </a>`).join('')}
    </nav>`;
}

// ---------- CATEGORY PILLS (mobile) + SIDEBAR (desktop) ----------
function renderCategoryNav(activeSlug = 'all') {
  const pills = document.getElementById('cat-pills');
  if (pills) {
    pills.innerHTML = CATEGORIES.map(c => `
      <a class="pill ${c.slug === activeSlug ? 'active' : ''}" href="listing.html?cat=${c.slug}">
        ${c.icon ? c.icon + ' ' : ''}${c.name}
      </a>`).join('');
  }
  const side = document.getElementById('cat-side');
  if (side) {
    side.innerHTML = CATEGORIES.map(c => `
      <a class="side-link ${c.slug === activeSlug ? 'active' : ''}" href="listing.html?cat=${c.slug}">${c.name}</a>`).join('');
  }
}

function catName(slug) {
  const cat = CATEGORIES.find(c => c.slug === slug);
  return cat ? cat.name : 'All products';
}

// ---------- WISHLIST (client-side for the demo) ----------
function wishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
  catch { return []; }
}

function toggleWish(id) {
  const list = wishlist();
  const next = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return next.includes(id);
}

// Delegated handler so heart buttons work on every page, including re-rendered grids.
document.addEventListener('click', e => {
  const heart = e.target.closest('[data-wish]');
  if (!heart) return;
  const on = toggleWish(Number(heart.dataset.wish));
  heart.textContent = on ? '♥' : '♡';
  heart.classList.toggle('on', on);
});

// ---------- PRODUCT CARDS ----------
function productCard(p) {
  const wished = wishlist().includes(p.id);
  return `
    <article class="card">
      <button class="heart ${wished ? 'on' : ''}" data-wish="${p.id}" aria-label="Save to wishlist">${wished ? '♥' : '♡'}</button>
      <a class="card-link" href="product.html?id=${p.id}">
        <div class="card-img">${p.emoji}</div>
        <div class="name">${esc(p.name)}</div>
        <div class="rating">⭐ ${p.rating} · ${p.sold} sold</div>
        <div class="price-row">
          <span class="price">${fmt(p.price)}</span>${p.oldPrice ? `<s class="old">${fmt(p.oldPrice)}</s>` : ''}
        </div>
        <div class="delivery">${esc(p.delivery)}</div>
        ${p.stock === 0 ? '<div class="out">Out of stock</div>' : ''}
      </a>
    </article>`;
}

function renderGrid(id, list) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = list.length
    ? list.map(productCard).join('')
    : '<div class="empty"><span>🔎</span><p>No products found. Try a different search or category.</p></div>';
}

// ---------- CART BADGE ----------
function updateCartBadge() {
  const n = API.cart.count();
  document.querySelectorAll('[data-cart-count]').forEach(b => {
    b.textContent = n;
    b.classList.toggle('hidden', n === 0);
  });
}

// ---------- TOAST ----------
function toast(message) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- AUTH GUARD ----------
// Sends logged-out users to login, then brings them back to the page they wanted.
function requireLogin() {
  if (API.auth.current()) return true;
  const here = location.pathname.split('/').pop() || 'index.html';
  window.location.href = `login.html?next=${encodeURIComponent(here + location.search)}`;
  return false;
}
