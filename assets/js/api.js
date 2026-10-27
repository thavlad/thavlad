// ============================================================
// MOCK BACKEND
// Every function is async and returns the data a real server
// would send. To go live, replace the bodies with fetch('/api/...')
// calls. Pages never touch localStorage directly, so they won't change.
// 
// Reset all demo data any time: open the browser console and run
//   localStorage.clear()
// ============================================================
const API = (() => {
  const DB_KEY = 'shopng_db_v2';
  const SESSION_KEY = 'shopng_session';
  const CART_KEY = 'shopng_cart';

  const wait = (ms = 150) => new Promise(r => setTimeout(r, ms));
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const fail = (message, status = 400) => {
    const err = new Error(message);
    err.status = status;
    throw err;
  };

  // The "database": seeded once from SEED_PRODUCTS and pre-populated records.
  function db() {
    let d = read(DB_KEY, null);
    if (!d) {
      d = {
        products: (typeof SEED_PRODUCTS !== 'undefined' ? SEED_PRODUCTS : []).map(p => ({ 
          ...p, 
          status: p.status || 'active',
          images: p.images || []
        })),
        users: [
          { id: 'u_demo', name: 'Ada Okafor', email: 'demo@shopng.ng', password: 'password123', active: true },
          { id: 'u_admin', name: 'Store Admin', email: 'admin@shopng.ng', password: 'password123', active: true }
        ],
        orders: [],
        promos: [
          { code: 'LAGOS10', discountPercent: 10, minSpend: 10000 }
        ],
        reviews: [
          { id: 1, productId: 101, userName: 'Amina B.', rating: 5, comment: 'Excellent quality!', approved: true }
        ],
        auditLogs: [
          { id: 1, timestamp: new Date().toISOString(), action: 'System Initialization', adminEmail: 'system' }
        ],
        settings: {
          standardShippingFee: 2000,
          expressShippingFee: 5000,
          freeDeliveryThreshold: 50000
        }
      };
      write(DB_KEY, d);
    }
    return d;
  }

  const saveDb = d => write(DB_KEY, d);
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email });

  // ---------- PRODUCTS / CATALOG ----------
  async function listProducts({ category = 'all', q = '', sort = 'popular', maxPrice = 0 } = {}) {
    await wait();
    let items = db().products.filter(p => p.status !== 'deleted');

    if (category !== 'all') items = items.filter(p => p.category === category);
    if (q) {
      const term = q.toLowerCase();
      items = items.filter(p =>
        [p.name, p.brand, p.category, p.desc].join(' ').toLowerCase().includes(term));
    }
    if (maxPrice) items = items.filter(p => p.price <= maxPrice);

    const sorters = {
      popular: (a, b) => (b.sold || 0) - (a.sold || 0),
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0)
    };
    return items.sort(sorters[sort] || sorters.popular);
  }

  async function getProduct(id) {
    await wait();
    const product = db().products.find(p => p.id === Number(id) && p.status !== 'deleted');
    if (!product) fail('Product not found', 404);
    return product;
  }

  // ---------- CART ----------
  const cart = {
    items() { return read(CART_KEY, []); },
    count() { return cart.items().reduce((sum, i) => sum + i.qty, 0); },
    detailed() {
      const products = db().products;
      return cart.items()
        .map(i => {
          const p = products.find(x => x.id === i.id);
          return p && p.status !== 'deleted' ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null;
        })
        .filter(Boolean);
    },
    subtotal() { return cart.detailed().reduce((sum, l) => sum + l.lineTotal, 0); },
    add(id, qty = 1) {
      const product = db().products.find(p => p.id === Number(id));
      if (!product || product.status === 'deleted') fail('Product not found', 404);
      if (product.stock === 0) fail('Sorry, this item is out of stock');

      const items = cart.items();
      const line = items.find(i => i.id === product.id);
      const newQty = (line ? line.qty : 0) + qty;
      if (newQty > product.stock) fail(`Only ${product.stock} left in stock`);

      if (line) line.qty = newQty;
      else items.push({ id: product.id, qty });
      write(CART_KEY, items);
    },
    setQty(id, qty) {
      const product = db().products.find(p => p.id === id);
      if (product && qty > product.stock) fail(`Only ${product.stock} left in stock`);
      const items = cart.items()
        .map(i => (i.id === id ? { ...i, qty } : i))
        .filter(i => i.qty > 0);
      write(CART_KEY, items);
    },
    remove(id) { write(CART_KEY, cart.items().filter(i => i.id !== id)); },
    clear() { write(CART_KEY, []); }
  };

  // ---------- AUTH ----------
  const auth = {
    current() {
      const id = read(SESSION_KEY, null);
      if (!id) return null;
      const u = db().users.find(x => x.id === id);
      return u && u.active !== false ? publicUser(u) : null;
    },
    async register({ name, email, password }) {
      await wait();
      const d = db();
      email = email.trim().toLowerCase();
      if (d.users.some(u => u.email === email)) fail('An account with this email already exists', 409);
      if (password.length < 6) fail('Password must be at least 6 characters');

      const user = { id: 'u' + Date.now(), name: name.trim(), email, password, active: true };
      d.users.push(user);
      saveDb(d);
      write(SESSION_KEY, user.id);
      return publicUser(user);
    },
    async login(email, password) {
      await wait();
      const user = db().users.find(u =>
        u.email === email.trim().toLowerCase() && u.password === password);
      if (!user) fail('Incorrect email or password', 401);
      if (user.active === false) fail('Your account has been suspended', 403);
      write(SESSION_KEY, user.id);
      return publicUser(user);
    },
    logout() { localStorage.removeItem(SESSION_KEY); }
  };

  // ---------- ORDERS & CHECKOUT ----------
  async function placeOrder({ shippingMethod, paymentMethod, address }) {
    await wait(300);
    const user = auth.current();
    if (!user) fail('Please log in to place an order', 401);

    const items = cart.detailed();
    if (items.length === 0) fail('Your cart is empty', 400);

    const subtotal = cart.subtotal();
    const d = db();
    const shipping = (d.settings && d.settings[shippingMethod === 'express' ? 'expressShippingFee' : 'standardShippingFee']) || 2000;
    const total = subtotal + shipping;

    if (typeof PaymentGateway !== 'undefined') {
      await PaymentGateway.charge({
        amount: total,
        reference: 'REF' + Date.now(),
        method: paymentMethod,
        email: user.email
      });
    }

    for (const item of items) {
      const prod = d.products.find(p => p.id === item.id);
      if (!prod) fail(`Product not found: ${item.name}`, 404);
      if (prod.stock < item.qty) fail(`Insufficient stock for ${prod.name}`, 400);
      prod.stock -= item.qty;
      prod.sold = (prod.sold || 0) + item.qty;
    }

    const orderId = 'NG' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const tracking = typeof Logistics !== 'undefined' ? await Logistics.createShipment({ id: orderId }) : { trackingNumber: 'TRK-' + orderId };

    const order = {
      id: orderId,
      userId: user.id,
      email: user.email,
      items: items.map(i => ({ id: i.id, name: i.name, emoji: i.emoji, images: i.images, price: i.price, qty: i.qty })),
      subtotal,
      shipping,
      total,
      address,
      payment: paymentMethod,
      status: 'Processing',
      tracking,
      date: new Date().toISOString()
    };

    d.orders.push(order);
    saveDb(d);
    cart.clear();
    return order;
  }

  async function listOrders() {
    await wait();
    const user = auth.current();
    if (!user) fail('Please log in to see your orders', 401);
    return db().orders.filter(o => o.userId === user.id);
  }

  async function getOrder(id) {
    await wait();
    const user = auth.current();
    const order = db().orders.find(o => o.id === id && user && (o.userId === user.id || user.email === 'admin@shopng.ng'));
    if (!order) fail('Order not found', 404);
    return order;
  }

  // ---------- EXPANDED ADMIN API SUITE ----------
  const admin = {
    async check() {
      await wait();
      const user = auth.current();
      if (!user || user.email !== 'admin@shopng.ng') {
        fail('Access denied. Administrator rights required.', 403);
      }
      return user;
    },

    async logAction(action) {
      const d = db();
      const adminUser = auth.current();
      if (!d.auditLogs) d.auditLogs = [];
      d.auditLogs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action,
        adminEmail: adminUser ? adminUser.email : 'admin@shopng.ng'
      });
      saveDb(d);
    },

    async getAnalytics() {
      await this.check();
      const d = db();
      const totalRevenue = d.orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = d.orders.length;
      const aov = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
      const lowStockCount = d.products.filter(p => p.status !== 'deleted' && p.stock <= 5).length;

      return { totalRevenue, totalOrders, aov, lowStockCount };
    },

    async listOrders(filterStatus = 'all', searchQuery = '') {
      await this.check();
      const d = db();
      let orders = [...d.orders];

      if (filterStatus !== 'all') {
        orders = orders.filter(o => o.status.toLowerCase() === filterStatus.toLowerCase());
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        orders = orders.filter(o => o.id.toLowerCase().includes(q) || (o.email && o.email.toLowerCase().includes(q)));
      }
      return orders;
    },

    async updateOrderStatus(orderId, status, tracking) {
      await this.check();
      const d = db();
      const order = d.orders.find(o => o.id === orderId);
      if (!order) fail('Order not found', 404);
      order.status = status;
      if (tracking) order.tracking = tracking;
      saveDb(d);
      await this.logAction(`Updated Order #${orderId} status to '${status}'`);
      return order;
    },

    async listProducts(includeDeleted = false) {
      await this.check();
      const d = db();
      if (includeDeleted) return d.products;
      return d.products.filter(p => p.status !== 'deleted');
    },

    async updateStock(productId, newStock) {
      await this.check();
      const d = db();
      const product = d.products.find(p => p.id === Number(productId));
      if (!product) fail('Product not found', 404);
      product.stock = Math.max(0, Number(newStock));
      saveDb(d);
      await this.logAction(`Updated stock for '${product.name}' to ${product.stock}`);
      return product;
    },

    async updateProduct(productId, updatedData) {
      await this.check();
      const d = db();
      const index = d.products.findIndex(p => p.id === Number(productId));
      if (index === -1) fail('Product not found', 404);

      d.products[index] = { ...d.products[index], ...updatedData };
      saveDb(d);
      await this.logAction(`Updated product details for '${d.products[index].name}'`);
      return d.products[index];
    },

    async addProduct(productData) {
      await this.check();
      const d = db();
      const newId = d.products.length ? Math.max(...d.products.map(p => p.id)) + 1 : 1;
      const newProduct = {
        id: newId,
        name: productData.name,
        brand: productData.brand || 'ShopNG',
        price: Number(productData.price),
        oldPrice: productData.oldPrice ? Number(productData.oldPrice) : null,
        rating: 5.0,
        sold: 0,
        stock: Number(productData.stock),
        emoji: productData.emoji || '📦',
        category: productData.category || 'electronics',
        delivery: productData.delivery || 'Standard Delivery',
        desc: productData.desc || '',
        images: productData.images || [],
        status: 'active'
      };
      d.products.push(newProduct);
      saveDb(d);
      await this.logAction(`Added new product '${newProduct.name}'`);
      return newProduct;
    },

    async softDeleteProduct(productId) {
      await this.check();
      const d = db();
      const product = d.products.find(p => p.id === Number(productId));
      if (!product) fail('Product not found', 404);
      product.status = 'deleted';
      saveDb(d);
      await this.logAction(`Moved product '${product.name}' to Trash`);
      return true;
    },

    async restoreProduct(productId) {
      await this.check();
      const d = db();
      const product = d.products.find(p => p.id === Number(productId));
      if (!product) fail('Product not found', 404);
      product.status = 'active';
      saveDb(d);
      await this.logAction(`Restored product '${product.name}' from Trash`);
      return product;
    },

    async listCustomers() {
      await this.check();
      const d = db();
      return d.users.map(u => {
        const userOrders = d.orders.filter(o => o.email === u.email || o.userId === u.id);
        const ltv = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        return { ...u, orderCount: userOrders.length, ltv };
      });
    },

    async toggleUserStatus(userId) {
      await this.check();
      const d = db();
      const user = d.users.find(u => u.id === String(userId) || u.id === Number(userId));
      if (!user) fail('User not found', 404);
      user.active = user.active === false ? true : false;
      saveDb(d);
      await this.logAction(`Toggled account status for '${user.email}' to active: ${user.active}`);
      return user;
    },

    async listReviews() {
      await this.check();
      return db().reviews || [];
    },

    async approveReview(reviewId) {
      await this.check();
      const d = db();
      const r = (d.reviews || []).find(rev => rev.id === Number(reviewId));
      if (r) {
        r.approved = true;
        saveDb(d);
        await this.logAction(`Approved review #${reviewId}`);
      }
      return r;
    },

    async deleteReview(reviewId) {
      await this.check();
      const d = db();
      d.reviews = (d.reviews || []).filter(r => r.id !== Number(reviewId));
      saveDb(d);
      await this.logAction(`Deleted review #${reviewId}`);
      return true;
    },

    async listPromos() {
      await this.check();
      return db().promos || [];
    },

    async addPromo(promoData) {
      await this.check();
      const d = db();
      if (!d.promos) d.promos = [];
      d.promos.push(promoData);
      saveDb(d);
      await this.logAction(`Added promo code '${promoData.code}'`);
      return promoData;
    },

    async deletePromo(code) {
      await this.check();
      const d = db();
      d.promos = (d.promos || []).filter(p => p.code !== code);
      saveDb(d);
      await this.logAction(`Deleted promo code '${code}'`);
      return true;
    },

    async getAuditLogs() {
      await this.check();
      return db().auditLogs || [];
    }
  };

  return { listProducts, getProduct, cart, auth, placeOrder, listOrders, getOrder, admin };
})();
