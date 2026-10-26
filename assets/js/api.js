// ============================================================
// MOCK BACKEND
// Every function is async and returns the data a real server
// would send. To go live, replace the bodies with fetch('/api/...')
// calls. Pages never touch localStorage directly, so they won't change.
//
// Reset all demo data any time: open the browser console and run
// localStorage.clear()
// ============================================================

const API = (() => {
  const DB_KEY = "shopng_db";
  const SESSION_KEY = "shopng_session";
  const CART_KEY = "shopng_cart";

  const wait = (ms = 150) => new Promise((r) => setTimeout(r, ms));
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));
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
        products: SEED_PRODUCTS.map((p) => ({ ...p })),
        // Demo login. Real passwords are never stored in plain text; they are salted and hashed on the server.
        users: [
          {
            id: "u_demo",
            name: "Ada Okafor",
            email: "demo@shopng.ng",
            password: "password123",
          },
        ],
        orders: [],
      };
      write(DB_KEY, d);
    }
    return d;
  }
  const saveDb = (d) => write(DB_KEY, d);
  const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

  // ---------- PRODUCTS / CATALOG ----------
  async function listProducts({ category = "all", q = "", sort = "popular", maxPrice = 0, } = {}) {
    await wait();
    let items = db().products.slice();

    if (category !== "all")
      items = items.filter((p) => p.category === category);
    if (q) {
      const term = q.toLowerCase();
      items = items.filter((p) =>
        [p.name, p.brand, p.category, p.desc]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }
    if (maxPrice) items = items.filter((p) => p.price <= maxPrice);

    const sorters = {
      popular: (a, b) => b.sold - a.sold,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
    };
    return items.sort(sorters[sort] || sorters.popular);
  }

  async function getProduct(id) {
    await wait();
    const product = db().products.find((p) => p.id === Number(id));
    if (!product) fail("Product not found", 404);
    return product;
  }

  // ---------- CART ----------
  // Stored as [{ id, qty }] and joined with live product data on read,
  // so prices and stock always reflect the catalog. (In production, a
  // logged-in user's cart lives on the server.)
  const cart = {
    items() {
      return read(CART_KEY, []);
    },

    count() {
      return cart.items().reduce((sum, i) => sum + i.qty, 0);
    },

    detailed() {
      const products = db().products;
      return cart
        .items()
        .map((i) => {
          const p = products.find((x) => x.id === i.id);
          return p ? { ...p, qty: i.qty, lineTotal: p.price * i.qty } : null;
        })
        .filter(Boolean);
    },

    subtotal() {
      return cart.detailed().reduce((sum, l) => sum + l.lineTotal, 0);
    },

    add(id, qty = 1) {
      const product = db().products.find((p) => p.id === Number(id));
      if (!product) fail("Product not found", 404);
      if (product.stock === 0) fail("Sorry, this item is out of stock");

      const items = cart.items();
      const line = items.find((i) => i.id === product.id);
      const newQty = (line ? line.qty : 0) + qty;
      if (newQty > product.stock) fail(`Only ${product.stock} left in stock`);

      if (line) line.qty = newQty;
      else items.push({ id: product.id, qty });
      write(CART_KEY, items);
    },

    setQty(id, qty) {
      const product = db().products.find((p) => p.id === id);
      if (product && qty > product.stock)
        fail(`Only ${product.stock} left in stock`);
      const items = cart
        .items()
        .map((i) => (i.id === id ? { ...i, qty } : i))
        .filter((i) => i.qty > 0);
      write(CART_KEY, items);
    },

    remove(id) {
      write(
        CART_KEY,
        cart.items().filter((i) => i.id !== id)
      );
    },

    clear() {
      write(CART_KEY, []);
    },
  };

  // ---------- AUTH ----------
  const auth = {
    current() {
      const id = read(SESSION_KEY, null);
      if (!id) return null;
      const u = db().users.find((x) => x.id === id);
      return u ? publicUser(u) : null;
    },

    async register({ name, email, password }) {
      await wait();
      const d = db();
      email = email.trim().toLowerCase();
      if (d.users.some((u) => u.email === email))
        fail("An account with this email already exists", 409);
      if (password.length < 6) fail("Password must be at least 6 characters");

      const user = { id: "u" + Date.now(), name: name.trim(), email, password };
      d.users.push(user);
      saveDb(d);
      write(SESSION_KEY, user.id);
      return publicUser(user);
    },

    async login(email, password) {
      await wait();
      const user = db().users.find(
        (u) => u.email === email.trim().toLowerCase() && u.password === password
      );
      if (!user) fail("Incorrect email or password", 401);
      write(SESSION_KEY, user.id);
      return publicUser(user);
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },
  };

  // ---------- ORDERS / CHECKOUT ----------
  async function placeOrder({ address, shippingId, paymentMethod }) {
    await wait(400);
    const user = auth.current();
    if (!user) fail("Please log in to checkout", 401);

    const lines = cart.detailed();
    if (lines.length === 0) fail("Your cart is empty");
    if (!["card", "transfer", "cod"].includes(paymentMethod))
      fail("Choose a payment method");

    const d = db();

    // Inventory check happens on the SERVER. Never trust stock numbers sent from the browser.
    for (const line of lines) {
      const product = d.products.find((p) => p.id === line.id);
      if (!product || line.qty > product.stock) {
        fail(
          `Sorry, only ${product ? product.stock : 0} of "${ line.name }" left in stock`,
          409
        );
      }
    }

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    const shipping = Logistics.quote(shippingId, subtotal);
    const total = subtotal + shipping;
    const orderId = "NG" + Math.random().toString(36).slice(2, 8).toUpperCase();

    // Pay-on-delivery skips the gateway. Everything else must succeed before the order is committed.
    if (paymentMethod !== "cod") {
      const result = await PaymentGateway.charge({
        amount: total,
        reference: orderId,
        method: paymentMethod,
        email: user.email,
      });
      if (result.status !== "success")
        fail("Payment failed. Please try another method.", 402);
    }

    // Commit: reduce stock, record the order, clear the cart.
    for (const line of lines) {
      d.products.find((p) => p.id === line.id).stock -= line.qty;
    }

    const order = {
      id: orderId,
      userId: user.id,
      createdAt: new Date().toISOString(),
      items: lines.map(({ id, name, emoji, price, qty }) => ({
        id,
        name,
        emoji,
        price,
        qty,
      })),
      subtotal,
      shipping,
      total,
      address,
      shippingId,
      paymentMethod,
      status: "Processing",
      tracking: await Logistics.createShipment({ id: orderId }),
    };

    d.orders.unshift(order);
    saveDb(d);
    cart.clear();
    return order;
  }

  async function listOrders() {
    await wait();
    const user = auth.current();
    if (!user) fail("Please log in to see your orders", 401);
    return db().orders.filter((o) => o.userId === user.id);
  }

  async function getOrder(id) {
    await wait();
    const user = auth.current();
    const order = db().orders.find(
      (o) => o.id === id && user && o.userId === user.id
    );
    if (!order) fail("Order not found", 404);
    return order;
  }

  return {
    listProducts,
    getProduct,
    cart,
    auth,
    placeOrder,
    listOrders,
    getOrder,
  };
})();
