// js/main.js - Global Initialization & Cart Counter Badge
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
});

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('sumus_cart') || '[]');
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}
