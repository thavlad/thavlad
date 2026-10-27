// LocalStorage Cart Engine & Badge Sync
class ShoppingCart {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('sumus_cart')) || [];
    this.init();
  }

  init() {
    this.updateCartBadge();
    if (document.getElementById('cart-items')) {
      this.renderCartPage();
    }
  }

  save() {
    localStorage.setItem('sumus_cart', JSON.stringify(this.cart));
    this.updateCartBadge();
  }

  addItem(product) {
    const existing = this.cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += (product.quantity || 1);
    } else {
      this.cart.push({ ...product, quantity: product.quantity || 1 });
    }
    this.save();
    alert(`${product.name} added to cart successfully!`);
  }

  removeItem(id) {
    this.cart = this.cart.filter(item => item.id !== id);
    this.save();
    this.renderCartPage();
  }

  updateQuantity(id, qty) {
    const item = this.cart.find(item => item.id === id);
    if (item) {
      item.quantity = parseInt(qty, 10);
      if (item.quantity <= 0) {
        this.removeItem(id);
      } else {
        this.save();
        this.renderCartPage();
      }
    }
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  updateCartBadge() {
    const badges = document.querySelectorAll('#cart-count');
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(b => b.textContent = totalCount);
  }

  renderCartPage() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 2rem;">Your cart is empty.</td></tr>`;
      if (totalEl) totalEl.textContent = '₦0';
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <tr>
        <td>
          <strong>${item.name}</strong><br>
          <span style="color:var(--color-muted-text); font-size:0.85rem;">₦${item.price.toLocaleString()}</span>
        </td>
        <td>
          <input type="number" min="1" value="${item.quantity}" style="width: 60px; padding: 4px;" onchange="cart.updateQuantity('${item.id}', this.value)">
        </td>
        <td>
          ₦${(item.price * item.quantity).toLocaleString()}<br>
          <button onclick="cart.removeItem('${item.id}')" style="background:none; border:none; color:#ee0000; cursor:pointer; font-size:0.8rem; margin-top:4px;">Remove</button>
        </td>
      </tr>
    `).join('');

    if (totalEl) {
      totalEl.textContent = `₦${this.getSubtotal().toLocaleString()}`;
    }
  }
}

const cart = new ShoppingCart();
