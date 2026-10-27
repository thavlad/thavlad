// js/wishlist.js

class WishlistManager {
    constructor() {
        this.wishlist = JSON.parse(localStorage.getItem('user_wishlist')) || [];
        this.init();
    }

    init() {
        this.updateWishlistBadge();
        // If we are on a wishlist view page, render items
        if (document.getElementById('wishlist-container')) {
            this.renderWishlistPage();
        }
        this.attachEventListeners();
    }

    save() {
        localStorage.setItem('user_wishlist', JSON.stringify(this.wishlist));
        this.updateWishlistBadge();
    }

    toggleItem(product) {
        const index = this.wishlist.findIndex(item => item.id === product.id);
        if (index > -1) {
            // Remove if already exists
            this.wishlist.splice(index, 1);
            alert(`${product.name} has been removed from your wishlist.`);
        } else {
            // Add if not present
            this.wishlist.push(product);
            alert(`${product.name} has been added to your wishlist!`);
        }
        this.save();
        this.renderWishlistPage();
    }

    removeItem(productId) {
        this.wishlist = this.wishlist.filter(item => item.id !== productId);
        this.save();
        this.renderWishlistPage();
    }

    updateWishlistBadge() {
        const badges = document.querySelectorAll('.wishlist-count-badge');
        badges.forEach(badge => {
            badge.textContent = this.wishlist.length;
        });
    }

    renderWishlistPage() {
        const container = document.getElementById('wishlist-container');
        if (!container) return;

        if (this.wishlist.length === 0) {
            container.innerHTML = `<p class="empty-wishlist-message">Your wishlist is currently empty.</p>`;
            return;
        }

        container.innerHTML = this.wishlist.map(item => `
            <div class="wishlist-item" data-id="${item.id}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">$${item.price.toFixed(2)}</p>
                </div>
                <div class="item-actions">
                    <button class="move-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">Add to Cart</button>
                    <button class="remove-wishlist-btn" data-id="${item.id}">Remove</button>
                </div>
            </div>
        `).join('');

        this.attachWishlistPageListeners();
    }

    attachEventListeners() {
        // Listen for clicks on "Wishlist/Heart" buttons across shop/product pages
        document.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.product-card') || e.target.closest('.product-detail');
                if (!card) return;

                const product = {
                    id: card.getAttribute('data-id'),
                    name: card.getAttribute('data-name'),
                    price: parseFloat(card.getAttribute('data-price'))
                };
                this.toggleItem(product);
            });
        });
    }

    attachWishlistPageListeners() {
        document.querySelectorAll('.move-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                const price = parseFloat(e.target.getAttribute('data-price'));
                
                // Uses the global cart instance from cart.js
                if (typeof cart !== 'undefined') {
                    cart.addItem({ id, name, price, quantity: 1 });
                    this.removeItem(id);
                }
            });
        });

        document.querySelectorAll('.remove-wishlist-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.removeItem(id);
            });
        });
    }
}

// Global instance
const wishlist = new WishlistManager();
