'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Small DOM boundary double: throws on innerHTML so untrusted rendering cannot
// accidentally start interpreting markup. Browser layout is checked separately.
class Element {
    constructor() {
        this.value = '';
        this.textContent = '';
        this.hidden = false;
        this.disabled = false;
        this.dataset = {};
        this.style = {};
        this.children = [];
        this.attributes = {};
        this.events = {};
        this.classes = new Set();
        this.classList = {
            contains: (name) => this.classes.has(name),
            toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name)
        };
    }
    set innerHTML(_) { throw new Error('HTML rendering is forbidden in these tests.'); }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(name, handler) { this.events[name] = handler; }
    querySelector() { return this.button; }
    reportValidity() { return true; }
    reset() { this.resetCount = (this.resetCount || 0) + 1; }
    focus() { this.focused = true; }
    append(...items) { items.forEach((item) => this.appendChild(item)); }
    appendChild(item) { item.parentElement = this; this.children.push(item); }
    get firstElementChild() { return this.children[0]; }
    remove() { this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1); }
    replaceWith(item) {
        const index = this.parentElement.children.indexOf(this);
        item.parentElement = this.parentElement;
        this.parentElement.children[index] = item;
    }
    emit(name) { return this.events[name]({ preventDefault() {} }); }
}

function harness({ sdk = true, storageBlocked = false, now = '2026-11-12T00:00:00+05:45' } = {}) {
    const ids = Object.fromEntries([
        'contactForm', 'contact-status', 'email', 'message', 'show-message-box-btn',
        'message-box', 'message-form', 'message-input', 'message-list', 'message-status',
        'clock', 'calendar-status', 'theme-toggle', 'icons', 'counter'
    ].map((id) => [id, new Element()]));
    ids['message-box'].hidden = true;
    ids.contactForm.button = new Element();
    ids['message-form'].button = new Element();
    const selectors = Object.fromEntries([
        '.time', '.progress-inner', '.percentageofDay', '.progressInn', '.month1', '.day1', 'header'
    ].map((selector) => [selector, new Element()]));
    selectors['.progress-inner'].parentElement = new Element();
    selectors['.progressInn'].parentElement = new Element();
    const labels = [new Element(), new Element()];
    const body = new Element();
    const document = {
        body, hidden: false, events: {},
        getElementById: (id) => ids[id],
        querySelector: (selector) => selectors[selector],
        querySelectorAll: (selector) => selector === '.year-label' ? labels : [],
        createElement: () => new Element(),
        addEventListener(name, handler) { this.events[name] = handler; }
    };
    const writes = [];
    const apps = [];
    const listeners = {};
    const databases = {};
    let writeResult = () => Promise.resolve();
    function makeDatabase(name) {
        const ref = {
            orderByKey() { return this; },
            limitToLast(limit) { this.limit = limit; return this; },
            push() { return { set: (data) => { writes.push({ name, data }); return writeResult(); } }; },
            on(event, handler, onError) { listeners[event] = handler; listeners.error = onError; },
            off() { this.detached = true; }
        };
        return { ref: () => ref, reference: ref };
    }
    const firebase = {
        apps,
        database: Object.assign(() => {}, { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' } } }),
        initializeApp(config, name) {
            if (apps.some((app) => app.name === name)) throw new Error('Duplicate Firebase app');
            databases[name] = makeDatabase(name);
            const app = { name, config, database: () => databases[name] };
            apps.push(app);
            return app;
        }
    };
    const storage = new Map();
    const localStorage = {
        getItem(key) { if (storageBlocked) throw new Error('Storage blocked'); return storage.get(key) ?? null; },
        setItem(key, value) { if (storageBlocked) throw new Error('Storage blocked'); storage.set(key, value); }
    };
    const systemTheme = { matches: false, addEventListener() {} };
    const timers = new Set();
    class FixedDate extends Date {
        constructor(...args) { super(...(args.length ? args : [now])); }
    }
    const context = vm.createContext({
        document, localStorage, console, Date: FixedDate, Intl,
        setInterval(handler) { timers.add(handler); return handler; },
        clearInterval(handler) { timers.delete(handler); },
        scrollY: 0, addEventListener() {}, matchMedia: () => systemTheme
    });
    context.window = context;
    if (sdk) context.firebase = firebase;
    function load(name) {
        if (name === 'calendar.js') load('nepali-calendar.js');
        const sourcePath = name === 'nepali-calendar.js'
            ? path.join(__dirname, '../public/assets/data', name)
            : path.join(__dirname, '../public/assets/js', name);
        vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: name });
    }
    load('firebase-config.js');
    return { ids, selectors, labels, document, context, apps, databases, writes, listeners, timers, storage, load,
        setWrite: (handler) => { writeResult = handler; } };
}

test('contact and public messages use separate named Firebase apps, reused on lookup', () => {
    const h = harness();
    h.load('contact-form.js');
    h.load('community-board.js');
    assert.deepEqual(h.apps.map((app) => app.name), ['contact']);
    h.ids['show-message-box-btn'].emit('click');
    assert.deepEqual(h.apps.map((app) => app.name), ['contact', 'publicMessages']);
    h.context.ProgressFirebase.getDatabase('contact');
    assert.equal(h.apps.length, 2);
    assert.notEqual(h.apps[0].config.projectId, h.apps[1].config.projectId);
});

test('contact waits for the server and preserves the form when a save fails', async () => {
    const h = harness();
    let reject;
    h.setWrite(() => new Promise((_, fail) => { reject = fail; }));
    h.load('contact-form.js');
    h.ids.email.value = 'person@example.com';
    h.ids.message.value = 'Hello';
    const sending = h.ids.contactForm.emit('submit');
    assert.equal(h.ids.contactForm.button.disabled, true);
    assert.equal(h.ids['contact-status'].dataset.state, 'pending');
    assert.equal(h.ids.contactForm.resetCount, undefined);
    await h.ids.contactForm.emit('submit');
    assert.equal(h.writes.length, 1);
    reject(new Error('Permission denied'));
    await sending;
    assert.equal(h.ids['contact-status'].dataset.state, 'error');
    assert.equal(h.ids.message.value, 'Hello');
    assert.equal(h.ids.contactForm.resetCount, undefined);
    assert.equal(h.ids.contactForm.button.disabled, false);
    h.setWrite(() => Promise.resolve());
    await h.ids.contactForm.emit('submit');
    assert.equal(h.ids['contact-status'].dataset.state, 'success');
    assert.equal(h.ids.contactForm.resetCount, 1);
});

test('a blocked Firebase SDK does not crash forms or the dashboard', () => {
    const h = harness({ sdk: false, storageBlocked: true });
    h.load('calendar.js');
    h.load('dashboard.js');
    h.load('contact-form.js');
    h.load('community-board.js');
    h.ids['show-message-box-btn'].emit('click');
    assert.equal(h.ids.contactForm.button.disabled, true);
    assert.equal(h.ids['message-form'].button.disabled, true);
    assert.equal(h.ids['contact-status'].dataset.state, 'error');
    assert.equal(h.selectors['.percentageofDay'].textContent, '0.00000%');
    assert.equal(h.ids.counter.textContent, 1);
    assert.match(h.ids.clock.textContent, /^12:00:00\sAM$/);
    h.ids['theme-toggle'].emit('click');
    assert.equal(h.ids['theme-toggle'].attributes['aria-pressed'], 'true');
});

test('public messages render hostile markup as plain text and stay bounded', () => {
    const h = harness();
    h.load('community-board.js');
    h.ids['show-message-box-btn'].emit('click');
    assert.equal(h.ids['show-message-box-btn'].attributes['aria-expanded'], 'true');
    assert.equal(h.databases.publicMessages.reference.limit, 50);
    const text = '<img src=x onerror=alert(1)><script>alert(1)</script>';
    const snapshot = (key, value) => ({ key, val: () => value });
    h.listeners.child_added(snapshot('one', { text, timestamp: 'invalid date' }));
    assert.equal(h.ids['message-list'].children[0].children[0].textContent, text);
    assert.equal(h.ids['message-list'].children[0].children[1].textContent, 'Date unavailable');
    h.listeners.child_changed(snapshot('one', { text: 'Updated', timestamp: 0 }));
    assert.equal(h.ids['message-list'].children.length, 1);
    assert.equal(h.ids['message-list'].children[0].children[0].textContent, 'Updated');
    for (let i = 0; i < 70; i++) h.listeners.child_added(snapshot(String(i), { text: 'Message ' + i, timestamp: Date.now() }));
    assert.equal(h.ids['message-list'].children.length, 50);
    h.listeners.child_removed(snapshot('69', null));
    assert.equal(h.ids['message-list'].children.length, 49);
    h.listeners.child_added(snapshot('bad', { text: {} }));
    assert.equal(h.ids['message-list'].children.length, 49);
});

test('public submissions use server time, keep text on failure, and reject blank input', async () => {
    const h = harness();
    h.load('community-board.js');
    h.ids['show-message-box-btn'].emit('click');
    h.ids['message-input'].value = '   ';
    await h.ids['message-form'].emit('submit');
    assert.equal(h.writes.length, 0);
    h.ids['message-input'].value = 'Keep this message';
    h.setWrite(() => Promise.reject(new Error('Permission denied')));
    await h.ids['message-form'].emit('submit');
    assert.equal(h.ids['message-input'].value, 'Keep this message');
    assert.equal(h.ids['message-status'].dataset.state, 'error');
    h.setWrite(() => Promise.resolve());
    await h.ids['message-form'].emit('submit');
    assert.equal(h.ids['message-input'].value, '');
    assert.equal(h.ids['message-status'].dataset.state, 'success');
    assert.equal(JSON.stringify(h.writes[1].data.timestamp), '{".sv":"timestamp"}');
});

test('dashboard reports unsupported dates and pauses its only timer in hidden tabs', () => {
    const h = harness({ now: '2030-01-01T12:00:00+05:45' });
    h.load('calendar.js');
    h.load('dashboard.js');
    assert.equal(h.selectors['.time'].textContent, 'Unavailable');
    assert.equal(h.ids['calendar-status'].hidden, false);
    assert.equal(h.selectors['.percentageofDay'].textContent, '50.00000%');
    assert.equal(h.timers.size, 1);
    h.document.hidden = true;
    h.document.events.visibilitychange();
    assert.equal(h.timers.size, 0);
    h.document.hidden = false;
    h.document.events.visibilitychange();
    assert.equal(h.timers.size, 1);
});
