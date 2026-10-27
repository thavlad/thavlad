// js/cart.js - Core Shopping Cart Engine
function addToCart(id, name, price, image) {
  let cart = JSON.parse(localStorage.getItem('sumus_cart') || '[]');
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }

  localStorage.setItem('sumus_cart', JSON.stringify(cart));
  if (typeof updateCartBadge === 'function') updateCartBadge();
  alert(`${name} added to cart!`);
}
