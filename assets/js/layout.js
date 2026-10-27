// ============================================================
// SHARED UI LAYOUT & HELPERS
// ============================================================
const WISHLIST_KEY = 'shopng_wishlist';

function initLayout(activeNav) { 
  renderHeader(); 
  renderBottomNav(activeNav); 
  updateCartBadge(); 
}

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
          <input type="search" name="q" placeholder="Search products, brands..." value="${esc(param('q') || '')}" aria-label="Search products"> 
        </form> 
        <nav class="header-actions"> 
          <a href="index.html">🏠 Home</a> 
          <a href="cart.html" class="cart-link">🛒 Cart<span class="badge hidden" data-cart-count></span></a> 
          <a href="${user ? 'account.html' : 'login.html'}">👤 ${user ? esc(user.name.split(' ')[0]) : 'Log in'}</a> 
          <a href="help.html">Help</a> 
        </nav> 
        <a href="cart.html" class="cart-btn" aria-label="Cart">🛒<span class="badge hidden" data-cart-count></span></a> 
      </div> 
    </header>
  `;
}

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
      ${items.map(i => `<a href="${i.href}" class="${i.key === active ? 'active' : ''}"><span>${i.icon}</span>${i.label}</a>`).join('')} 
    </nav>
  `; 
}

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

document.addEventListener('click', e => { 
  const heart = e.target.closest('[data-wish]'); 
  if (!heart) return; 
  const on = toggleWish(Number(heart.dataset.wish)); 
  heart.textContent = on ? '♥' : '♡'; 
  heart.classList.toggle('on', on); 
});

function productCard(p) { 
  const wished = wishlist().includes(p.id); 
  
  // Use uploaded image if available, otherwise fallback to emoji
  const mainImg = (p.images && p.images.length > 0)
    ? `<img src="${esc(p.images[0])}" alt="${esc(p.name)}" style="width:100%; height:100%; object-fit:contain;">`
    : p.emoji;

  return `
    <article class="card"> 
      <button class="heart ${wished ? 'on' : ''}" data-wish="${p.id}" aria-label="Save to wishlist">${wished ? '♥' : '♡'}</button> 
      <a class="card-link" href="product.html?id=${p.id}"> 
        <div class="card-img">${mainImg}</div> 
        <div class="name">${esc(p.name)}</div> 
        <div class="rating">⭐ ${p.rating} · ${p.sold} sold</div> 
        <div class="price-row"> 
          <span class="price">${fmt(p.price)}</span>${p.oldPrice ? `<s class="old"> ${fmt(p.oldPrice)}</s>` : ''}
        </div>
        <div class="delivery">${esc(p.delivery)}</div> 
        ${p.stock === 0 ? '<div class="out">Out of stock</div>' : ''} 
      </a> 
    </article>
  `; 
}

function renderGrid(id, list) { 
  const el = document.getElementById(id); 
  if (!el) return; 
  el.innerHTML = list.length 
    ? list.map(productCard).join('') 
    : '<div class="empty"><span>🔎</span><p>No products found. Try a different search or category.</p></div>'; 
}

function updateCartBadge() { 
  const n = API.cart.count(); 
  document.querySelectorAll('[data-cart-count]').forEach(b => { 
    b.textContent = n; 
    b.classList.toggle('hidden', n === 0); 
  }); 
}

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
