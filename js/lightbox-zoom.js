// js/lightbox-zoom.js

document.addEventListener('DOMContentLoaded', () => {
    // Create lightbox container dynamically
    if (!document.getElementById('lightbox-modal')) {
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox-modal';
        lightbox.style.cssText = `
            display: none;
            position: fixed;
            z-index: 10000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            justify-content: center;
            align-items: center;
        `;
        lightbox.innerHTML = `
            <span id="lightbox-close" style="position: absolute; top: 20px; right: 35px; color: #fff; font-size: 40px; font-weight: bold; cursor: pointer;">&times;</span>
            <img id="lightbox-img" style="max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
        `;
        document.body.appendChild(lightbox);
    }

    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');

    // Attach click listeners to zoomable images (e.g., product gallery images)
    document.querySelectorAll('.zoomable-img, #main-product-image').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', (e) => {
            modal.style.display = 'flex';
            modalImg.src = e.target.src;
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
