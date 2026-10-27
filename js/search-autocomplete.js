// js/search-autocomplete.js

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search-input');
    const resultsContainer = document.getElementById('search-results-dropdown');

    if (!searchInput || !resultsContainer) return;

    // Simulated searchable product catalog (or can scrape existing .product-card elements from the DOM)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        if (query.length === 0) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            return;
        }

        // Collect products present in the DOM (e.g., on shop.html or featured section)
        const productCards = document.querySelectorAll('.product-card');
        const matches = [];

        productCards.forEach(card => {
            const name = card.getAttribute('data-name') || '';
            const category = card.getAttribute('data-category') || '';
            const price = card.getAttribute('data-price') || '';

            if (name.toLowerCase().includes(query) || category.toLowerCase().includes(query)) {
                matches.push({ name, price, category });
            }
        });

        // Render matching dropdown results
        if (matches.length > 0) {
            resultsContainer.innerHTML = matches.map(item => `
                <div class="search-result-item">
                    <span class="result-name">${item.name}</span>
                    <span class="result-price">$${parseFloat(item.price).toFixed(2)}</span>
                </div>
            `).join('');
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = `<div class="no-results">No products found matching "${query}"</div>`;
            resultsContainer.style.display = 'block';
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
});
