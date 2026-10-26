// ============================================================
// THIRD-PARTY INTEGRATION STUBS
// These are the places real services plug in. Each returns the
// same shape the real provider would, so the rest of the app
// doesn't change when you swap the stub for the real thing.
// ============================================================

// ---------- PAYMENTS ----------
// Real version: your SERVER creates a transaction with Paystack or
// Flutterwave and returns a reference. The browser never decides an
// order is paid on its own. Confirm payment via the provider's
// webhook on your backend before releasing the goods.
const PaymentGateway = {
  async charge({ amount, reference, method, email }) {
    await new Promise(r => setTimeout(r, 800)); // simulate network time
    console.info(`[mock payment] ${method} ${fmt(amount)} ref=${reference} email=${email}`);
    return { status: 'success', reference };
  }
};

// ---------- LOGISTICS ----------
// Shipping rules live here so the checkout UI and the order
// process always agree on prices.
const Logistics = {
  methods: {
    standard: {
      label: 'Standard',
      eta: '3–5 working days · Free over ₦50,000, otherwise ₦1,500',
      fee: subtotal => (subtotal >= 50000 ? 0 : 1500)
    },
    express: {
      label: 'Express · Lagos',
      eta: 'Next working day · ₦3,000',
      fee: () => 3000
    }
  },

  quote(methodId, subtotal) {
    const method = this.methods[methodId];
    if (!method) throw new Error('Unknown shipping method');
    return method.fee(subtotal);
  },

  // Real version: call your courier's API (e.g. GIG, Kwik, Sendbox)
  // to book the pickup and get back a tracking number.
  async createShipment(order) {
    await new Promise(r => setTimeout(r, 300));
    return 'TRK' + order.id;
  }
};
