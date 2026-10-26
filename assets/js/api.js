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
  const DB_KEY = 'shopng_db';
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

  // The "database": seeded once from SEED_PRODUCTS.
  function db() {
    let d = read(DB_KEY, null);
    if (!d) {
      d = {
        products: SEED_PRODUCTS.map(p => ({ ...p })),
        // Demo users including admin account
        users: [
          { id: 'u_demo', name: 'Ada Okafor', email: 'demo@shopng.ng', password: 'password123' },
          { id: 'u_admin', name: 'Store Admin', email: 'admin@shopng.ng', password: 'password123' }
        ],
        orders: []
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
    let items = db().products.slice();

    if (category !== 'all') items = items.filter(p => p.category === category);
    if (q) {
      const term = q.toLowerCase();
      items = items.filter(p =>
        [p.name, p.brand, p.category, p.desc].join(' ').toLowerCase().includes(term));
    }
    if (maxPrice) items = items.filter(p => p.price <= maxPrice);

    const sorters = {
      popular: (a, b) => b.sold - a.sold,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating
    };
    return items.sort(sorters[sort] || sorters.popular);
  }

  async function getProduct(id) {
    await wait();
    const product = db().products.find(p => p.id === Number(id));
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
          return p ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null;
        })
        .filter(Boolean);
    },
    subtotal() { return cart.detailed().reduce((sum, l) => sum + l.lineTotal, 0); },
    add(id, qty = 1) {
      const product = db().products.find(p => p.id === Number(id));
      if (!product) fail('Product not found', 404);
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
      return u ? publicUser(u) : null;
    },
    async register({ name, email, password }) {
      await wait();
      const d = db();
      email = email.trim().toLowerCase();
      if (d.users.some(u => u.email === email)) fail('An account with this email already exists', 409);
      if (password.length < 6) fail('Password must be at least 6 characters');

      const user = { id: 'u' + Date.now(), name: name.trim(), email, password };
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
    const shipping = Logistics.quote(shippingMethod, subtotal);
    const total = subtotal + shipping;

    await PaymentGateway.charge({
      amount: total,
      reference: 'REF' + Date.now(),
      method: paymentMethod,
      email: user.email
    });

    const d = db();
    for (const item of items) {
      const prod = d.products.find(p => p.id === item.id);
      if (!prod) fail(`Product not found: ${item.name}`, 404);
      if (prod.stock < item.qty) fail(`Insufficient stock for ${prod.name}`, 400);
      prod.stock -= item.qty;
      prod.sold += item.qty;
    }

    const orderId = 'NG' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const tracking = await Logistics.createShipment({ id: orderId });

    const order = {
      id: orderId,
      userId: user.id,
      items: items.map(i => ({ id: i.id, name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })),
      subtotal,
      shipping,
      total,
      address,
      payment: paymentMethod,
      status: 'Processing',
      tracking,
      createdAt: new Date().toISOString()
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

  // ---------- ADMIN EXTENSIONS ----------
  const admin = {
    async check() {
      await wait();
      const user = auth.current();
      if (!user || user.email !== 'admin@shopng.ng') {
        fail('Access denied. Administrator rights required.', 403);
      }
      return user;
    },
    async listAllOrders() {
      await this.check();
      return db().orders;
    },
    async updateOrderStatus(orderId, status, tracking) {
      await this.check();
      const d = db();
      const order = d.orders.find(o => o.id === orderId);
      if (!order) fail('Order not found', 404);
      order.status = status;
      if (tracking) order.tracking = tracking;
      saveDb(d);
      return order;
    },
    async updateStock(productId, newStock) {
      await this.check();
      const d = db();
      const product = d.products.find(p => p.id === Number(productId));
      if (!product) fail('Product not found', 404);
      product.stock = Math.max(0, Number(newStock));
      saveDb(d);
      return product;
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
        desc: productData.desc || ''
      };
      d.products.push(newProduct);
      saveDb(d);
      return newProduct;
    },
    async deleteProduct(productId) {
      await this.check();
      const d = db();
      d.products = d.products.filter(p => p.id !== Number(productId));
      saveDb(d);
      return true;
    }
  };

  return { listProducts, getProduct, cart, auth, placeOrder, listOrders, getOrder, admin };
})();
