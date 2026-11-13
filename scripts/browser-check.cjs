'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { createServer } = require('../scripts/serve.cjs');

async function main() {
    const server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const artifacts = path.resolve(__dirname, '../artifacts');
    const profile = path.join(artifacts, 'chrome-profile');
    fs.mkdirSync(profile, { recursive: true });
    const executable = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    const chrome = spawn(executable, [
        '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
        '--disable-background-networking', '--remote-debugging-port=0',
        '--user-data-dir=' + profile, 'about:blank'
    ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let ws;
    try {
        const endpoint = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Chrome startup timed out')), 15000);
            let output = '';
            chrome.on('error', reject);
            chrome.stderr.on('data', (chunk) => {
                output += chunk.toString();
                const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
                if (match) { clearTimeout(timer); resolve(match[1]); }
            });
        });
        ws = new WebSocket(endpoint);
        await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
        let id = 0;
        const pending = new Map();
        const events = [];
        ws.onmessage = ({ data }) => {
            const message = JSON.parse(data);
            if (message.id) {
                const call = pending.get(message.id);
                if (call) {
                    clearTimeout(call.timer);
                    pending.delete(message.id);
                    message.error ? call.reject(new Error(message.error.message)) : call.resolve(message.result);
                }
            } else events.push(message);
        };
        const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
            const request = ++id;
            const timer = setTimeout(() => reject(new Error(method + ' timed out')), 10000);
            pending.set(request, { resolve, reject, timer });
            ws.send(JSON.stringify({ id: request, method, params, sessionId }));
        });
        const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
        const command = (method, params) => send(method, params, sessionId);
        await command('Page.enable');
        await command('Runtime.enable');
        await command('Network.enable');
        // Browser checks remain isolated from every external service and database.
        await command('Network.setBlockedURLs', { urls: ['*gstatic.com*', '*google*', '*firebaseio.com*', '*fontawesome*', '*cloudflare*', '*bootstrapcdn*'] });
        await command('Page.addScriptToEvaluateOnNewDocument', { source: `{
            const RealDate = Date;
            window.__calendarTestNow = RealDate.parse('2026-11-12T12:34:56+05:45');
            window.Date = class extends RealDate {
                constructor(...args) { super(...(args.length ? args : [window.__calendarTestNow])); }
                static now() { return window.__calendarTestNow; }
            };
        }` });
        const evaluate = async (expression) => {
            const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
            return result.result.value;
        };
        const ready = async (after) => {
            const deadline = Date.now() + 10000;
            while (Date.now() < deadline) {
                if (events.slice(after).some((event) => event.method === 'Page.loadEventFired')
                    && await evaluate("document.readyState === 'complete' && document.getElementById('clock').textContent.includes('M')")) return;
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            throw new Error('Page did not initialize');
        };
        const navigate = async (method, params) => {
            const after = events.length;
            await command(method, params);
            await ready(after);
        };
        if (process.argv.includes('--export-social-image')) {
            const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/images/social-card.svg'));
            const markup = '<html><body style="margin:0;overflow:hidden"><img width="1200" height="630" alt="" src="data:image/svg+xml;base64,'
                + source.toString('base64') + '"></body></html>';
            await command('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
            await command('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(markup).toString('base64') });
            const deadline = Date.now() + 10000;
            let loaded = false;
            while (Date.now() < deadline) {
                loaded = await evaluate('document.images.length === 1 && document.images[0].complete && document.images[0].naturalWidth === 1200');
                if (loaded) break;
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            assert.equal(loaded, true, 'Social image source did not load');
            const screenshot = await command('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
            fs.writeFileSync(path.resolve(__dirname, '../public/assets/images/social-card.png'), Buffer.from(screenshot.data, 'base64'));
        }
        await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
        await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
        await navigate('Page.navigate', { url: origin });
        await evaluate('localStorage.clear()');
        await navigate('Page.reload');
        assert.equal((await fetch(origin)).status, 200);
        assert.equal((await fetch(origin + '/.git/config')).status, 404);
        assert.equal((await fetch(origin + '/assets/js/calendar.js')).headers.get('content-type'), 'text/javascript; charset=utf-8');
        for (const privatePath of ['/package.json', '/scripts/serve.cjs', '/docs/CODEBASE.md', '/tests/fixtures/hamro-2083-7.json']) {
            assert.equal((await fetch(origin + privatePath)).status, 404);
        }
        await navigate('Page.navigate', { url: origin + '/index.htm?from=bookmark#about' });
        assert.equal(await evaluate('location.pathname + location.search + location.hash'), '/?from=bookmark#about');
        await navigate('Page.navigate', { url: origin });
        const desktop = await evaluate(`({
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            clock: document.getElementById('clock').textContent,
            day: document.querySelector('.percentageofDay').textContent,
            year: document.querySelector('.year-label').textContent,
            contactError: document.getElementById('contact-status').dataset.state,
            progress: document.querySelector('.progress').getAttribute('aria-valuenow')
        })`);
        assert.ok(desktop.scrollWidth <= desktop.width);
        assert.equal(desktop.contactError, 'error');
        assert.ok(Number(desktop.progress) >= 0 && Number(desktop.progress) <= 100);
        assert.match(await evaluate('document.title'), /Sujeet Khadka/);
        assert.equal(await evaluate("document.querySelector('.intro-byline a').href"), 'https://www.sujeetkhadka.com.np/');
        assert.equal(await evaluate("document.getElementById('creator-heading').textContent"), 'Created by Sujeet Khadka');
        const dots = await evaluate(`({ total: document.querySelectorAll('.year-dot').length,
            current: document.querySelectorAll('.year-dot.current').length,
            months: document.querySelectorAll('.month-button').length })`);
        assert.deepEqual(dots, { total: 365, current: 1, months: 12 });
        for (const period of ['day', 'week', 'month', 'year']) {
            const result = await evaluate(`(() => {
                document.querySelector('[data-period="${period}"]').click();
                const expected = ProgressCalendar.getPeriodProgress(new Date(), '${period}').percentage;
                return { actual: Number(document.getElementById('hero-percentage').textContent), expected,
                    pressed: document.querySelectorAll('[data-period][aria-pressed="true"]').length,
                    label: document.getElementById('hero-progress').getAttribute('aria-label') };
            })()`);
            assert.ok(Math.abs(result.actual - result.expected) < .02, period + ' has incorrect progress');
            assert.equal(result.pressed, 1);
            assert.equal(result.label, period + ' elapsed');
        }
        await evaluate("document.querySelector('.month-button').click()");
        assert.equal(await evaluate("document.querySelectorAll('.year-dot.highlight').length"), 31);
        assert.match(await evaluate("document.getElementById('month-detail').textContent"), /Baisakh 2083/);
        await evaluate("document.querySelector('.month-button').click()");
        assert.equal(await evaluate("document.querySelectorAll('.year-dot.highlight').length"), 0);
        assert.equal(await evaluate('ProgressCalendar.dataInfo.source'), 'Hamro Patro');
        assert.equal(await evaluate("document.getElementById('calendar-source').href"), 'https://www.hamropatro.com/en/calendar/2083/7');
        assert.match(await evaluate("document.getElementById('calendar-verified').textContent"), /^Checked /);
        assert.match(await evaluate("document.getElementById('intro-heading').textContent"), /Nepali year/);
        assert.match(await evaluate("document.getElementById('nepali-date-native').textContent"), /२६ कार्तिक २०८३/);
        assert.equal(await evaluate("document.getElementById('calendar-milestones').hidden"), false);
        assert.equal(await evaluate("document.getElementById('bs-current-month').textContent"), 'Kartik');
        assert.equal(await evaluate("document.getElementById('bs-month-position').textContent"), 'Day 26 of 30');
        assert.equal(await evaluate("document.getElementById('bs-next-month').textContent"), 'Mangsir 1');
        assert.equal(await evaluate("document.getElementById('bs-month-countdown').textContent"), '4d 11h 26m');
        assert.equal(await evaluate("document.getElementById('bs-new-year-date').textContent"), 'Baisakh 1 · 14 Apr 2027');
        assert.equal(await evaluate("document.getElementById('international-position').textContent"), 'Day 316 of 365');
        assert.equal(await evaluate("document.querySelectorAll('.international-month').length"), 12);
        assert.equal(await evaluate("document.querySelector('.international-month[aria-current=date]').textContent"), 'Nov');
        await evaluate(`window.__calendarTestNow = Date.parse('2027-01-01T00:00:00+05:45');
            document.querySelector('[data-period="year"]').click()`);
        assert.equal(await evaluate("document.getElementById('international-year-number').textContent"), '2027');
        assert.equal(await evaluate("document.getElementById('international-percentage').textContent"), '0.00');
        assert.equal(await evaluate("document.querySelector('.international-month[aria-current=date]').textContent"), 'Jan');
        assert.equal(await evaluate("document.querySelector('.year-label').textContent"), '2083');
        await evaluate(`window.__calendarTestNow = Date.parse('2028-02-29T12:00:00+05:45');
            document.querySelector('[data-period="year"]').click()`);
        assert.equal(await evaluate("document.getElementById('international-position').textContent"), 'Day 60 of 366');
        assert.equal(await evaluate("document.getElementById('international-percentage').textContent"), '16.26');
        await evaluate(`window.__calendarTestNow = Date.parse('2027-04-14T00:00:00+05:45');
            document.querySelector('[data-period="year"]').click()`);
        assert.equal(await evaluate("document.querySelector('.year-label').textContent"), '2084');
        assert.equal(await evaluate("document.getElementById('hero-percentage').textContent"), '0.00');
        assert.equal(await evaluate("document.querySelectorAll('.year-dot.current').length"), 1);
        assert.equal(await evaluate("document.getElementById('day-of-year').textContent"), '1');
        assert.equal(await evaluate("document.getElementById('bs-current-month').textContent"), 'Baisakh');
        assert.equal(await evaluate("document.getElementById('bs-next-year').textContent"), '2085 BS');
        assert.equal(await evaluate("document.getElementById('international-percentage').textContent"), '28.22');
        await evaluate(`window.__calendarTestNow = Date.parse('2030-01-01T12:00:00+05:45');
            document.querySelector('[data-period="year"]').click()`);
        assert.equal(await evaluate("document.getElementById('calendar-status').hidden"), false);
        assert.equal(await evaluate("document.querySelectorAll('.year-dot').length"), 0);
        assert.equal(await evaluate("document.getElementById('calendar-milestones').hidden"), true);
        assert.equal(await evaluate("document.getElementById('international-position').textContent"), 'Day 1 of 365');
        assert.equal(await evaluate("document.querySelector('.international-track').getAttribute('aria-valuenow')"), '0.13699');
        await evaluate("document.querySelector('[data-period=day]').click()");
        assert.equal(await evaluate("document.getElementById('hero-percentage').textContent"), '50.00');
        await evaluate(`window.__calendarTestNow = Date.parse('2026-11-12T12:34:56+05:45');
            document.querySelector('[data-period="year"]').click()`);
        await evaluate("document.getElementById('theme-toggle').click()");
        assert.equal(await evaluate("document.getElementById('theme-toggle').getAttribute('aria-pressed')"), 'true');
        assert.equal(await evaluate("localStorage.getItem('darkmode')"), 'enabled');
        await navigate('Page.reload');
        assert.equal(await evaluate("document.body.classList.contains('dark-theme')"), true);
        await evaluate("document.getElementById('show-message-box-btn').click()");
        assert.equal(await evaluate("document.getElementById('message-box').hidden"), false);
        assert.equal(await evaluate("document.getElementById('message-status').dataset.state"), 'error');
        await evaluate("document.getElementById('show-message-box-btn').click()");
        await evaluate("document.getElementById('theme-toggle').click()");
        const screenshot = async (name) => {
            await evaluate('document.activeElement.blur(); window.scrollTo(0, 0)');
            await new Promise((resolve) => setTimeout(resolve, 700));
            const { cssContentSize } = await command('Page.getLayoutMetrics');
            const result = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
                clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 } });
            fs.writeFileSync(path.join(artifacts, name), Buffer.from(result.data, 'base64'));
        };
        await screenshot('desktop.png');
        for (const width of [320, 375, 480, 768, 1024]) {
            await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
            const size = await evaluate('({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth })');
            assert.ok(size.scrollWidth <= size.width, 'Horizontal overflow at ' + width + 'px');
            if (width === 375) await screenshot('mobile.png');
        }
        await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await navigate('Page.reload');
        assert.equal(await evaluate("document.querySelectorAll('.particles-js-canvas-el').length"), 0);
        await evaluate("document.getElementById('theme-toggle').focus()");
        await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
        await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
        assert.equal(await evaluate("document.getElementById('theme-toggle').getAttribute('aria-pressed')"), 'true');
        await screenshot('dark.png');
        const archiveUrl = await evaluate("document.getElementById('archive-link').href");
        assert.equal((await fetch(archiveUrl)).status, 200);
        await navigate('Page.navigate', { url: archiveUrl });
        assert.equal(await evaluate("document.querySelector('meta[name=robots]').content"), 'noindex, follow');
        assert.equal(await evaluate("document.querySelectorAll('#archive-banner a').length"), 1);
        assert.equal(await evaluate("[...document.querySelectorAll('form input, form textarea, form button')].every(field => field.disabled)"), true);
        assert.equal(await evaluate("document.querySelectorAll('script[src*=firebase],script[src*=GeoLocations]').length"), 0);
        const back = await evaluate("document.querySelector('#archive-banner a').href");
        assert.equal((await fetch(back)).status, 200);
        await navigate('Page.navigate', { url: back });
        await command('Network.setBlockedURLs', { urls: ['*gstatic.com*', '*google*', '*firebaseio.com*', '*fontawesome*', '*cloudflare*', '*bootstrapcdn*', origin + '/assets/data/nepali-calendar.js'] });
        await navigate('Page.reload');
        assert.equal(await evaluate('ProgressCalendar.dataInfo.source'), 'Bundled calendar');
        assert.equal(await evaluate("document.getElementById('hero-percentage').textContent"), '58.23');
        assert.equal(await evaluate("document.getElementById('calendar-status').hidden"), true);
        const errors = events.filter((event) => event.method === 'Runtime.exceptionThrown');
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ desktop, dots, checkedWidths: [320, 375, 480, 768, 1024, 1440], javascriptErrors: errors.length,
            checked: ['Nepali identity and native date', 'BS month and New Year countdowns', 'Gregorian month timeline', 'Gregorian New Year at Nepal midnight', 'Gregorian leap day', 'creator attribution and portfolio links', 'all four progress periods', 'month highlighting', 'calendar source attribution', '2084 New Year rollover', 'unsupported dates with Gregorian progress', 'missing calendar data fallback', 'offline services', 'theme persistence', 'keyboard toggle', 'board expansion', 'reduced motion', 'public directory serving', 'legacy bookmark redirect', 'archive noindex and return link'],
            screenshots: ['artifacts/desktop.png', 'artifacts/mobile.png', 'artifacts/dark.png'] }, null, 2));
    } finally {
        if (ws) ws.close();
        chrome.kill();
        await new Promise((resolve) => server.close(resolve));
    }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
