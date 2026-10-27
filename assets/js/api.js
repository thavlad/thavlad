// ============================================================
// MOCK BACKEND WITH ADVANCED ADMIN EXTENSIONS & SECURITY
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

  function db() {
    let d = read(DB_KEY, null);
    if (!d) {
      d = {
        products: SEED_PRODUCTS.map(p => ({ ...p })),
        users: [
          { id: 'u_demo', name: 'Ada Okafor', email: 'demo@shopng.ng', password: 'password123', isAdmin: false, isSuspended: false },
          { id: 'u_admin', name: 'Store Admin', email: 'admin@shopng.ng', password: 'password123', isAdmin: true, isSuspended: false }
        ],
        orders: [],
        reviews: [
          { id: 1, productId: 1, userName: 'Ada Okafor', rating: 5, comment: 'Fantastic sound quality and fast delivery!', status: 'Approved', createdAt: new Date().toISOString() },
          { id: 2, productId: 3, userName: 'Chidi Okoro', rating: 4, comment: 'Keeps water cold all day long.', status: 'Pending', createdAt: new Date().toISOString() }
        ],
        auditLogs: [
          { id: 1, adminEmail: 'admin@shopng.ng', action: 'System Initialized', details: 'Database seeded with default products and categories.', createdAt: new Date().toISOString() }
        ],
        shippingZones: [
          { id: 1, zone: 'Lagos Mainland & Island', fee: 2500, freeThreshold: 50000 },
          { id: 2, zone: 'Other Nigerian States', fee: 5500, freeThreshold: 100000 }
        ],
        promos: [
          { code: 'LAGOS10', discount: 10 }
        ]
      };
      write(DB_KEY, d);
    }
    return d;
  }

  const saveDb = d => write(DB_KEY, d);
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email, isAdmin: u.email === 'admin@shopng.ng' || u.isAdmin, isSuspended: Boolean(u.isSuspended) });

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
      if (u && u.isSuspended) {
        localStorage.removeItem(SESSION_KEY);
        fail('Your account has been suspended. Contact support.', 403);
      }
      return u ? publicUser(u) : null;
    },
    async register({ name, email, password }) {
      await wait();
      const d = db();
      email = email.trim().toLowerCase();
      if (d.users.some(u => u.email === email)) fail('An account with this email already exists', 409);
      if (password.length < 6) fail('Password must be at least 6 characters');

      const user = { id: 'u' + Date.now(), name: name.trim(), email, password, isAdmin: false, isSuspended: false };
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
      if (user.isSuspended) fail('This account has been suspended.', 403);
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
      userEmail: user.email,
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

  // ---------- ADMIN EXTENSIONS & SECURITY GUARD ----------
  const admin = {
    async check() {
      await wait();
      const user = auth.current();
      if (!user || user.email !== 'admin@shopng.ng') {
        fail('Access denied. Administrator rights required.', 403);
      }
      return user;
    },
    async log(adminEmail, action, details) {
      const d = db();
      d.auditLogs.unshift({
        id: Date.now(),
        adminEmail,
        action,
        details,
        createdAt: new Date().toISOString()
      });
      saveDb(d);
    },
    async getAnalytics() {
      await this.check();
      const d = db();
      const orders = d.orders;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalOrders = orders.length;
      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const lowStockCount = d.products.filter(p => p.stock < 5).length;

      const categorySales = {};
      orders.forEach(o => {
        o.items.forEach(item => {
          const prod = d.products.find(p => p.id === item.id);
          const cat = prod ? prod.category : 'other';
          categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.qty);
        });
      });

      return { totalRevenue, totalOrders, aov, lowStockCount, categorySales };
    },
    async listAllOrders() {
      await this.check();
      return db().orders;
    },
    async updateOrderStatus(orderId, status, tracking) {
      const user = await this.check();
      const d = db();
      const order = d.orders.find(o => o.id === orderId);
      if (!order) fail('Order not found', 404);
      order.status = status;
      if (tracking) order.tracking = tracking;
      saveDb(d);
      await this.log(user.email, 'Update Order Status', `Order #${orderId} status changed to ${status}`);
      return order;
    },
    async updateStock(productId, newStock) {
      const user = await this.check();
      const d = db();
      const product = d.products.find(p => p.id === Number(productId));
      if (!product) fail('Product not found', 404);
      product.stock = Math.max(0, Number(newStock));
      saveDb(d);
      await this.log(user.email, 'Update Stock', `Product ID ${productId} (${product.name}) stock set to ${product.stock}`);
      return product;
    },
    async updateProduct(productId, productData) {
      const user = await this.check();
      const d = db();
      const product = d.products.find(p => p.id === Number(productId));
      if (!product) fail('Product not found', 404);
      
      product.name = productData.name !== undefined ? productData.name : product.name;
      product.brand = productData.brand !== undefined ? productData.brand : product.brand;
      product.price = productData.price !== undefined ? Number(productData.price) : product.price;
      product.oldPrice = productData.oldPrice !== undefined ? (productData.oldPrice ? Number(productData.oldPrice) : null) : product.oldPrice;
      product.stock = productData.stock !== undefined ? Number(productData.stock) : product.stock;
      product.category = productData.category !== undefined ? productData.category : product.category;
      product.emoji = productData.emoji !== undefined ? productData.emoji : product.emoji;
      product.desc = productData.desc !== undefined ? productData.desc : product.desc;

      saveDb(d);
      await this.log(user.email, 'Update Product', `Updated product details for ID ${productId} (${product.name})`);
      return product;
    },
    async addProduct(productData) {
      const user = await this.check();
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
      await this.log(user.email, 'Add Product', `Added new product: ${newProduct.name}`);
      return newProduct;
    },
    async deleteProduct(productId) {
      const user = await this.check();
      const d = db();
      const prod = d.products.find(p => p.id === Number(productId));
      d.products = d.products.filter(p => p.id !== Number(productId));
      saveDb(d);
      await this.log(user.email, 'Delete Product', `Deleted product ID ${productId} (${prod ? prod.name : 'Unknown'})`);
      return true;
    },
    async listUsers() {
      await this.check();
      const d = db();
      return d.users.map(u => {
        const userOrders = d.orders.filter(o => o.userId === u.id);
        const ltv = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          isAdmin: u.email === 'admin@shopng.ng' || u.isAdmin,
          isSuspended: Boolean(u.isSuspended),
          orderCount: userOrders.length,
          ltv
        };
      });
    },
    async toggleUserSuspension(userId) {
      const user = await this.check();
      const d = db();
      const target = d.users.find(u => u.id === userId);
      if (!target) fail('User not found', 404);
      if (target.email === 'admin@shopng.ng') fail('Cannot suspend primary administrator account');
      target.isSuspended = !target.isSuspended;
      saveDb(d);
      await this.log(user.email, 'User Suspension', `Toggled suspension for ${target.email} to ${target.isSuspended}`);
      return target;
    },
    async listReviews() {
      await this.check();
      return db().reviews || [];
    },
    async updateReviewStatus(reviewId, status) {
      const user = await this.check();
      const d = db();
      const rev = d.reviews.find(r => r.id === Number(reviewId));
      if (!rev) fail('Review not found', 404);
      rev.status = status;
      saveDb(d);
      await this.log(user.email, 'Review Moderation', `Review #${reviewId} status set to ${status}`);
      return rev;
    },
    async deleteReview(reviewId) {
      const user = await this.check();
      const d = db();
      d.reviews = (d.reviews || []).filter(r => r.id !== Number(reviewId));
      saveDb(d);
      await this.log(user.email, 'Delete Review', `Deleted review #${reviewId}`);
      return true;
    },
    async listAuditLogs() {
      await this.check();
      return db().auditLogs || [];
    },
    async listShippingZones() {
      await this.check();
      return db().shippingZones || [];
    },
    async updateShippingZone(id, fee, threshold) {
      const user = await this.check();
      const d = db();
      const zone = d.shippingZones.find(z => z.id === Number(id));
      if (!zone) fail('Shipping zone not found', 404);
      zone.fee = Number(fee);
      zone.freeThreshold = Number(threshold);
      saveDb(d);
      await this.log(user.email, 'Update Shipping Zone', `Updated shipping zone ${zone.zone} fee to ${fee}`);
      return zone;
    },
    async exportData(type) {
      await this.check();
      const d = db();
      if (type === 'products') return JSON.stringify(d.products, null, 2);
      if (type === 'orders') return JSON.stringify(d.orders, null, 2);
      fail('Invalid export type');
    },
    async importProducts(importedArray) {
      const user = await this.check();
      const d = db();
      if (!Array.isArray(importedArray)) fail('Invalid product list format');
      d.products = importedArray;
      saveDb(d);
      await this.log(user.email, 'Bulk Import', `Imported ${importedArray.length} products into catalog`);
      return true;
    }
  };

  return { listProducts, getProduct, cart, auth, placeOrder, listOrders, getOrder, admin };
})();
