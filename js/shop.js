// js/shop.js

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const sortDropdown = document.getElementById('sort-by');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!productGrid) return;

    // Example event listener for filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.getAttribute('data-category');
            filterProducts(category);
        });
    });

    // Handle "Add to Cart" triggers from product cards on the shop page
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.getAttribute('data-id'),
                name: card.getAttribute('data-name'),
                price: parseFloat(card.getAttribute('data-price')),
                quantity: 1
            };
            cart.addItem(product);
        });
    });
});

function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const prodCategory = product.getAttribute('data-category');
        if (category === 'all' || prodCategory === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}
// js/shop.js

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const sortDropdown = document.getElementById('sort-by');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!productGrid) return;

    // Example event listener for filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.getAttribute('data-category');
            filterProducts(category);
        });
    });

    // Handle "Add to Cart" triggers from product cards on the shop page
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.getAttribute('data-id'),
                name: card.getAttribute('data-name'),
                price: parseFloat(card.getAttribute('data-price')),
                quantity: 1
            };
            cart.addItem(product);
        });
    });
});

function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const prodCategory = product.getAttribute('data-category');
        if (category === 'all' || prodCategory === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}
// js/shop.js

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const sortDropdown = document.getElementById('sort-by');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!productGrid) return;

    // Example event listener for filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.getAttribute('data-category');
            filterProducts(category);
        });
    });

    // Handle "Add to Cart" triggers from product cards on the shop page
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.getAttribute('data-id'),
                name: card.getAttribute('data-name'),
                price: parseFloat(card.getAttribute('data-price')),
                quantity: 1
            };
            cart.addItem(product);
        });
    });
});

function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const prodCategory = product.getAttribute('data-category');
        if (category === 'all' || prodCategory === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}
// js/shop.js

document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const sortDropdown = document.getElementById('sort-by');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (!productGrid) return;

    // Example event listener for filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.getAttribute('data-category');
            filterProducts(category);
        });
    });

    // Handle "Add to Cart" triggers from product cards on the shop page
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.getAttribute('data-id'),
                name: card.getAttribute('data-name'),
                price: parseFloat(card.getAttribute('data-price')),
                quantity: 1
            };
            cart.addItem(product);
        });
    });
});

function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const prodCategory = product.getAttribute('data-category');
        if (category === 'all' || prodCategory === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}
