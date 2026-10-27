// js/store-locator.js

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('store-search-input');
    const searchBtn = document.getElementById('store-search-btn');
    const storeCards = document.querySelectorAll('.store-card');

    if (!searchInput) return;

    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();

        storeCards.forEach(card => {
            const locationName = card.getAttribute('data-location').toLowerCase();
            const address = card.getAttribute('data-address').toLowerCase();

            if (locationName.includes(query) || address.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});
