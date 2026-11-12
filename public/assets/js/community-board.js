(function () {
    'use strict';
    const toggle = document.getElementById('show-message-box-btn');
    const panel = document.getElementById('message-box');
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');
    const list = document.getElementById('message-list');
    const status = document.getElementById('message-status');
    const button = form.querySelector('button[type="submit"]');
    const { getDatabase, showStatus } = window.ProgressFirebase;
    const entries = new Map();
    let reference;
    let subscribed = false;
    let pending = false;
    function remove(key) {
        const element = entries.get(key);
        if (element) { element.remove(); entries.delete(key); }
    }
    function render(snapshot) {
        const value = snapshot.val();
        if (!value || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 2000) {
            remove(snapshot.key);
            return;
        }
        const entry = document.createElement('div'); entry.className = 'message-list-item';
        const message = document.createElement('p'); message.textContent = value.text;
        const timestamp = document.createElement('p'); timestamp.className = 'timestamp';
        const date = typeof value.timestamp === 'number' || typeof value.timestamp === 'string' ? new Date(value.timestamp) : new Date(NaN);
        timestamp.textContent = Number.isFinite(date.getTime()) ? date.toLocaleString('en-GB', { timeZone: 'Asia/Kathmandu', dateStyle: 'medium', timeStyle: 'short' }) + ' NPT' : 'Date unavailable';
        entry.append(message, timestamp);
        if (entries.has(snapshot.key)) entries.get(snapshot.key).replaceWith(entry);
        else list.appendChild(entry);
        entries.set(snapshot.key, entry);
        while (entries.size > 50) remove(entries.keys().next().value);
    }
    function subscribe() {
        if (subscribed) return;
        try {
            reference = getDatabase('publicMessages').ref('messages');
            const query = reference.orderByKey().limitToLast(50);
            const failed = () => showStatus(status, 'Community messages could not be loaded. Please try again later.', 'error');
            query.on('child_added', render, failed);
            query.on('child_changed', render, failed);
            query.on('child_removed', (snapshot) => remove(snapshot.key), failed);
            subscribed = true;
        } catch {
            button.disabled = true;
            showStatus(status, 'The community board is unavailable right now. Please try again later.', 'error');
        }
    }
    toggle.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        toggle.setAttribute('aria-expanded', String(!panel.hidden));
        toggle.textContent = panel.hidden ? 'Open the community board ↗' : 'Close the community board ↑';
        if (!panel.hidden) subscribe();
    });
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (pending || !reference || !form.reportValidity()) return;
        const message = input.value.trim();
        if (!message || message.length > 2000) {
            showStatus(status, 'Write a thought of up to 2,000 characters before sharing.', 'error');
            return;
        }
        pending = true; button.disabled = true;
        showStatus(status, 'Sharing your thought…', 'pending');
        try {
            await reference.push().set({ text: message, timestamp: window.firebase.database.ServerValue.TIMESTAMP });
            input.value = '';
            showStatus(status, 'Your thought is now part of this shared moment. Thank you.', 'success');
        } catch {
            showStatus(status, 'Your thought could not be shared. Please try again.', 'error');
        } finally { pending = false; button.disabled = false; }
    });
}());
