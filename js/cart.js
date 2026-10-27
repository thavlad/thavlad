// js/cart.js

class ShoppingCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('user_cart')) || [];
        this.init();
    }

    init() {
        this.updateCartBadge();
        // If we are on the cart page, render the cart items
        if (document.getElementById('cart-items-container')) {
            this.renderCartPage();
        }
    }

    save() {
        localStorage.setItem('user_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
    }

    addItem(product) {
        const existingIndex = this.cart.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
            this.cart[existingIndex].quantity += (product.quantity || 1);
        } else {
            this.cart.push({ ...product, quantity: product.quantity || 1 });
        }
        this.save();
        alert(`${product.name} has been added to your cart!`);
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.save();
        this.renderCartPage();
    }

    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = parseInt(quantity, 10);
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.save();
                this.renderCartPage();
            }
        }
    }

    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-count-badge');
        const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        badges.forEach(badge => {
            badge.textContent = totalCount;
        });
    }

    renderCartPage() {
        const container = document.getElementById('cart-items-container');
        const subtotalEl = document.getElementById('cart-subtotal');
        
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `<p class="empty-cart-message">Your shopping cart is currently empty.</p>`;
            if (subtotalEl) subtotalEl.textContent = '$0.00';
            return;
        }

        container.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="item-actions">
                    <input type="number" min="1" value="${item.quantity}" class="qty-input" data-id="${item.id}">
                    <button class="remove-btn" data-id="${item.id}">Remove</button>
                </div>
            </div>
        `).join('');

        if (subtotalEl) {
            subtotalEl.textContent = `$${this.getSubtotal().toFixed(2)}`;
        }

        this.attachCartEventListeners();
    }

    attachCartEventListeners() {
        document.querySelectorAll('.qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                this.updateQuantity(id, e.target.value);
            });
        });

        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.removeItem(id);
            });
        });
    }
}

// Global instance
const cart = new ShoppingCart();
