// js/product.js

document.addEventListener('DOMContentLoaded', () => {
    // Thumbnail image switcher
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumb-img');

    if (mainImage && thumbnails.length > 0) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                thumbnails.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                mainImage.src = e.target.src;
            });
        });
    }

    // Detail page "Add to Cart" with custom quantity selector
    const detailAddBtn = document.getElementById('detail-add-to-cart');
    if (detailAddBtn) {
        detailAddBtn.addEventListener('click', () => {
            const id = detailAddBtn.getAttribute('data-id');
            const name = detailAddBtn.getAttribute('data-name');
            const price = parseFloat(detailAddBtn.getAttribute('data-price'));
            const qtyInput = document.getElementById('product-quantity');
            const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;

            cart.addItem({ id, name, price, quantity });
        });
    }
});
