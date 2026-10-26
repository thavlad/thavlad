// ============================================================
// CATALOG SEED DATA
// Used only to seed the mock database the first time the site
// runs. In production this lives in your product database.
// ============================================================

const CATEGORIES = [
  { slug: 'all', name: 'All', icon: '' },
  { slug: 'electronics', name: 'Electronics', icon: '📱' },
  { slug: 'fashion', name: 'Fashion', icon: '👕' },
  { slug: 'home', name: 'Home', icon: '🛋️' },
  { slug: 'beauty', name: 'Beauty', icon: '💄' },
  { slug: 'groceries', name: 'Groceries', icon: '🛒' },
  { slug: 'sports', name: 'Sports', icon: '⚽' }
];

// stock = inventory count (checked at add-to-cart and again at checkout).
// delivery is display text only; the real fee is calculated by Logistics.
const SEED_PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', brand: 'SoundPro', price: 67500, oldPrice: null, rating: 4.6, sold: 120, stock: 15, emoji: '🎧', category: 'electronics', delivery: 'FREE delivery',
    desc: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear sound. Perfect for music, calls, and commuting in Lagos traffic.' },
  { id: 2, name: 'Running Sneakers', brand: 'StrideX', price: 83700, oldPrice: null, rating: 4.5, sold: 98, stock: 8, emoji: '👟', category: 'fashion', delivery: 'FREE delivery',
    desc: 'Lightweight, breathable running sneakers with excellent cushioning. Ideal for jogging around the city or everyday wear.' },
  { id: 3, name: 'Insulated Water Bottle', brand: 'ColdKeep', price: 25000, oldPrice: null, rating: 4.7, sold: 210, stock: 40, emoji: '🥤', category: 'home', delivery: 'Express · Lagos',
    desc: 'Keeps drinks cold for 24 hours or hot for 12 hours. Leak-proof and perfect for the Nigerian heat.' },
  { id: 4, name: 'Coffee Maker 4-Cup', brand: 'BrewMate', price: 47200, oldPrice: null, rating: 4.4, sold: 76, stock: 5, emoji: '☕', category: 'home', delivery: 'FREE delivery',
    desc: 'Compact 4-cup coffee maker. Brew your morning coffee quickly even during power outages (works with inverter).' },
  { id: 5, name: 'Everyday Backpack', brand: 'TrailPack', price: 40500, oldPrice: null, rating: 4.6, sold: 150, stock: 25, emoji: '🎒', category: 'fashion', delivery: 'FREE delivery',
    desc: 'Durable, water-resistant backpack with laptop compartment. Great for work, school, or travel across Nigeria.' },
  { id: 6, name: 'Smart Watch', brand: 'PulseFit', price: 79700, oldPrice: null, rating: 4.5, sold: 92, stock: 3, emoji: '⌚', category: 'electronics', delivery: 'Express · Lagos',
    desc: 'Track your fitness, receive notifications, and monitor heart rate. Long battery life and stylish design.' },
  { id: 7, name: 'Skincare Set', brand: 'GlowLab', price: 29700, oldPrice: null, rating: 4.8, sold: 64, stock: 20, emoji: '✨', category: 'beauty', delivery: 'FREE delivery',
    desc: 'Complete skincare routine set formulated for Nigerian skin types. Includes cleanser, moisturizer, and serum.' },
  { id: 8, name: 'LED Desk Lamp', brand: 'BrightDesk', price: 36400, oldPrice: null, rating: 4.6, sold: 88, stock: 12, emoji: '💡', category: 'home', delivery: 'Express · Lagos',
    desc: 'Adjustable LED desk lamp with multiple brightness levels. Eye-friendly lighting for studying or working late.' },
  { id: 9, name: 'Long Grain Rice 50kg', brand: 'Harvest Gold', price: 62000, oldPrice: 70000, rating: 4.3, sold: 310, stock: 30, emoji: '🍚', category: 'groceries', delivery: 'FREE delivery',
    desc: 'Premium long-grain parboiled rice in a 50kg bag. Fluffy, non-sticky, and ideal for family meals and parties.' },
  { id: 10, name: 'Football Size 5', brand: 'KickPro', price: 9800, oldPrice: null, rating: 4.4, sold: 45, stock: 60, emoji: '⚽', category: 'sports', delivery: 'FREE delivery',
    desc: 'Match-quality size 5 football with a durable, machine-stitched cover. Suitable for training and pick-up games.' },
  { id: 11, name: 'Yoga Mat', brand: 'FlexZone', price: 15500, oldPrice: null, rating: 4.5, sold: 33, stock: 18, emoji: '🧘', category: 'sports', delivery: 'Express · Lagos',
    desc: 'Non-slip, 6mm thick yoga mat with a carry strap. Lightweight and easy to clean.' },
  { id: 12, name: 'Bluetooth Speaker', brand: 'SoundPro', price: 28900, oldPrice: 34500, rating: 4.3, sold: 77, stock: 9, emoji: '🔊', category: 'electronics', delivery: 'FREE delivery',
    desc: 'Portable waterproof speaker with 12 hours of playtime and deep bass. Pairs with any Bluetooth device.' }
];
