// js/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');

    if (!checkoutForm) return;

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Gather form data
        const formData = {
            fullName: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            zip: document.getElementById('zip').value
        };

        // 2. Retrieve current cart items
        const currentCart = JSON.parse(localStorage.getItem('user_cart')) || [];

        if (currentCart.length === 0) {
            alert('Your cart is empty! Add items before checking out.');
            window.location.href = 'shop.html';
            return;
        }

        // 3. Simulate order success
        console.log('Order Placed Successfully!', { customer: formData, items: currentCart });

        // Clear cart
        localStorage.removeItem('user_cart');

        // Redirect or show confirmation message
        alert(`Thank you for your order, ${formData.fullName}! Your order has been placed successfully.`);
        window.location.href = 'index.html';
    });
});
