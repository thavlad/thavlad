// js/forms.js

document.addEventListener('DOMContentLoaded', () => {
    const inquiryForm = document.getElementById('inquiry-form');

    if (!inquiryForm) return;

    inquiryForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Gather form inputs
        const name = document.getElementById('inquirer-name').value.trim();
        const email = document.getElementById('inquirer-email').value.trim();
        const message = document.getElementById('inquirer-message').value.trim();

        // 2. Simple validation
        if (!name || !email || !message) {
            alert('Please fill out all required fields before submitting.');
            return;
        }

        // 3. Simulate successful submission
        console.log('Form Submitted Successfully:', { name, email, message });

        alert(`Thank you, ${name}! Your inquiry has been sent successfully. Our team will get back to you shortly.`);
        
        // Reset form
        inquiryForm.reset();
    });
});
