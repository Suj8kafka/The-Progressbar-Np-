/* Keep the original presentation browsable without historical database writes. */
(function () {
    const banner = document.createElement('aside');
    banner.id = 'archive-banner';
    const note = document.createElement('span');
    note.textContent = 'THE ORIGINAL PROGRESSBAR · V1 ARCHIVE';
    const back = document.createElement('a');
    back.href = '../../index.html';
    back.textContent = 'Back to the present ↗';
    banner.append(note, back);
    document.body.prepend(banner);
    document.querySelectorAll('form input, form textarea, form button').forEach((field) => {
        field.disabled = true;
        field.title = 'Historical form — read only. Use the current site to send a message.';
    });
    document.getElementById('show-message-box-btn').disabled = true;
    document.getElementById('show-message-box-btn').textContent = 'Message board archived';
}());
