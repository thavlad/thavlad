// ============================================================
// MOCK BACKEND WITH EXTENDED ADMIN FEATURES
// ============================================================
const API = (() => {
  const DB_KEY = 'shopng_db';
  const SESSION_KEY = 'shopng_session';
  const CART_KEY = 'shopng_cart';

  const wait = (ms = 150) => new Promise(r => setTimeout(r, ms));
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const fail = (message, status = 400) => {
    const err = new Error(message);
    err.status = status;
    throw err;
  };

  function db() {
    let d = read(DB_KEY, null);
    if (!d) {
      d = {
        products: SEED_PRODUCTS.map(p => ({ ...p })),
        users: [
          { id: 'u_demo', name: 'Ada Okafor', email: 'demo@shopng.ng', password: 'password123', role: 'customer' },
          { id: 'u_admin', name: 'Store Admin', email: 'admin@shopng.ng', password: 'password123', role: 'admin' }
        ],
        orders: [],
        promos: [
          { code: 'LAGOS10', discountPercent: 10, active: true },
          { code: 'WELCOME5k', discountFixed: 5000, active: true }
        ]
      };
      write(DB_KEY, d);
    }
    // Backward compatibility check for roles & promos
    let updated = false;
    d.users.forEach(u => {
      if (!u.role) {
        u.role = u.email === 'admin@shopng.ng' ? 'admin' : 'customer';
        updated = true;
      }
    });
    if (!d.promos) {
      d.promos = [
        { code: 'LAGOS10', discountPercent: 10, active: true },
        { code: 'WELCOME5k', discountFixed: 5000, active: true }
      ];
      updated = true;
    }
    if (updated) saveDb(d);
    return d;
  }
  
  const saveDb = d => write(DB_KEY, d);
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role || 'customer' });

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

      const user = { 
        id: 'u' + Date.now(), 
        name: name.trim(), 
        email, 
        password,
        role: email === 'admin@shopng.ng' ? 'admin' : 'customer'
      };
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

  // ---------- ORDERS / CHECKOUT ----------
  async function placeOrder({ address, shippingId, paymentMethod }) {
    await wait(400);
    const user = auth.current();
    if (!user) fail('Please log in to checkout', 401);

    const lines = cart.detailed();
    if (lines.length === 0) fail('Your cart is empty');
    if (!['card', 'transfer', 'cod'].includes(paymentMethod)) fail('Choose a payment method');

    const d = db();
    for (const line of lines) {
      const product = d.products.find(p => p.id === line.id);
      if (!product || line.qty > product.stock) {
        fail(`Sorry, only ${product ? product.stock : 0} of "${line.name}" left in stock`, 409);
      }
    }

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const shipping = Logistics.quote(shippingId, subtotal);
    const total = subtotal + shipping;
    const orderId = 'NG' + Math.random().toString(36).slice(2, 8).toUpperCase();

    if (paymentMethod !== 'cod') {
      const result = await PaymentGateway.charge({
        amount: total, reference: orderId, method: paymentMethod, email: user.email
      });
      if (result.status !== 'success') fail('Payment failed. Please try another method.', 402);
    }

    for (const line of lines) {
      const target = d.products.find(p => p.id === line.id);
      if (target) {
        target.stock -= line.qty;
        target.sold = (target.sold || 0) + line.qty;
      }
    }

    const order = {
      id: orderId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      createdAt: new Date().toISOString(),
      items: lines.map(({ id, name, emoji, price, qty }) => ({ id, name, emoji, price, qty })),
      subtotal,
      shipping,
      total,
      address,
      shippingId,
      paymentMethod,
      status: 'Processing',
      tracking: await Logistics.createShipment({ id: orderId })
    };

    d.orders.unshift(order);
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
    const order = db().orders.find(o => o.id === id && user && o.userId === user.id);
    if (!order) fail('Order not found', 404);
    return order;
  }

  // ---------- ADMIN SERVICES ----------
  const admin = {
    async check() {
      await wait();
      const user = auth.current();
      if (!user || (user.role !== 'admin' && user.email !== 'admin@shopng.ng')) {
        fail('Access denied. Administrator privileges required.', 403);
      }
      return user;
    },

    async getAnalytics() {
      await this.check();
      const d = db();
      const orders = d.orders || [];
      const products = d.products || [];

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const lowStockCount = products.filter(p => p.stock < 5).length;

      // Category Sales breakdown
      const categorySales = {};
      orders.forEach(order => {
        (order.items || []).forEach(item => {
          const p = products.find(x => x.id === item.id);
          const cat = p ? p.category : 'other';
          categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.qty);
        });
      });

      // Top Selling Products
      const topSelling = products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);

      return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        lowStockCount,
        categorySales,
        topSelling
      };
    },

    async listOrders({ status = 'all', query = '' } = {}) {
      await this.check();
      let orders = db().orders.slice();
      if (status !== 'all') {
        orders = orders.filter(o => o.status === status);
      }
      if (query) {
        const q = query.toLowerCase();
        orders = orders.filter(o => 
          o.id.toLowerCase().includes(q) || 
          (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
          (o.userName && o.userName.toLowerCase().includes(q))
        );
      }
      return orders;
    },

    async updateOrderStatus(orderId, status) {
      await this.check();
      const d = db();
      const order = d.orders.find(o => o.id === orderId);
      if (!order) fail('Order not found', 404);
      order.status = status;
      saveDb(d);
      return order;
    },

    async updateStock(productId, newStock) {
      await this.check();
      const d = db();
      const prod = d.products.find(p => p.id === Number(productId));
      if (!prod) fail('Product not found', 404);
      prod.stock = Math.max(0, Number(newStock));
      saveDb(d);
      return prod;
    },

    async updateProduct(id, data) {
      await this.check();
      const d = db();
      const prod = d.products.find(p => p.id === Number(id));
      if (!prod) fail('Product not found', 404);

      prod.name = data.name || prod.name;
      prod.brand = data.brand || prod.brand;
      prod.price = Number(data.price);
      prod.oldPrice = data.oldPrice ? Number(data.oldPrice) : null;
      prod.stock = Number(data.stock);
      prod.category = data.category || prod.category;
      prod.emoji = data.emoji || prod.emoji;
      prod.desc = data.desc !== undefined ? data.desc : prod.desc;

      saveDb(d);
      return prod;
    },

    async addProduct(data) {
      await this.check();
      const d = db();
      const newId = d.products.length ? Math.max(...d.products.map(p => p.id)) + 1 : 1;
      const newProduct = {
        id: newId,
        name: data.name,
        brand: data.brand || 'ShopNG',
        price: Number(data.price),
        oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
        rating: 5.0,
        sold: 0,
        stock: Number(data.stock),
        emoji: data.emoji || '📦',
        category: data.category || 'electronics',
        delivery: data.delivery || 'Standard Delivery',
        desc: data.desc || ''
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
    },

    async listUsers() {
      await this.check();
      const d = db();
      const orders = d.orders || [];
      return d.users.map(u => ({
        ...publicUser(u),
        orderCount: orders.filter(o => o.userId === u.id || o.userEmail === u.email).length
      }));
    },

    async toggleUserRole(userId) {
      await this.check();
      const d = db();
      const u = d.users.find(user => user.id === userId);
      if (!u) fail('User not found', 404);
      u.role = u.role === 'admin' ? 'customer' : 'admin';
      saveDb(d);
      return publicUser(u);
    },

    async listPromos() {
      await this.check();
      return db().promos || [];
    },

    async addPromo(data) {
      await this.check();
      const d = db();
      if (!d.promos) d.promos = [];
      const code = data.code.trim().toUpperCase();
      if (d.promos.some(p => p.code === code)) fail('Promo code already exists', 409);

      const newPromo = {
        code,
        discountPercent: data.discountPercent ? Number(data.discountPercent) : null,
        discountFixed: data.discountFixed ? Number(data.discountFixed) : null,
        active: true
      };
      d.promos.push(newPromo);
      saveDb(d);
      return newPromo;
    },

    async deletePromo(code) {
      await this.check();
      const d = db();
      d.promos = (d.promos || []).filter(p => p.code !== code);
      saveDb(d);
      return true;
    }
  };

  return { 
    listProducts, 
    getProduct, 
    cart, 
    auth, 
    placeOrder, 
    listOrders, 
    getOrder, 
    admin 
  };
})();
