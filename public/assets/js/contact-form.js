(function () {
    'use strict';
    const form = document.getElementById('contactForm');
    const status = document.getElementById('contact-status');
    const button = form.querySelector('button[type="submit"]');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    const { getDatabase, showStatus } = window.ProgressFirebase;
    let reference;
    let pending = false;
    try { reference = getDatabase('contact').ref('messages'); }
    catch {
        button.disabled = true;
        showStatus(status, 'The contact form is unavailable. You can reach me at email@sujeetkhadka.com.np.', 'error');
    }
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (pending || !reference || !form.reportValidity()) return;
        const address = email.value.trim();
        const body = message.value.trim();
        if (!address || !body || address.length > 254 || body.length > 5000) {
            showStatus(status, 'Please add your email and a message of up to 5,000 characters.', 'error');
            return;
        }
        pending = true; button.disabled = true;
        showStatus(status, 'Sending your message…', 'pending');
        try {
            await reference.push().set({ email: address, message: body });
            form.reset();
            showStatus(status, 'Thanks for taking a moment. Your message has been sent.', 'success');
        } catch {
            showStatus(status, 'Your message could not be sent. Please try again.', 'error');
        } finally { pending = false; button.disabled = false; }
    });
}());
