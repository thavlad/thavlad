// js/faq.js

document.addEventListener('DOMContentLoaded', () => {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    if (accordionHeaders.length === 0) return;

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Toggle active class on the clicked header
            header.classList.toggle('active');

            // Find the associated content panel
            const content = header.nextElementSibling;

            if (content && content.classList.contains('accordion-content')) {
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }
        });
    });
});
