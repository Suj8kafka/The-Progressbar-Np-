'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const data = require('../public/assets/data/nepali-calendar.js');
const calendar = require('../public/assets/js/calendar.js');
const { parsePage, collectYear, sync } = require('../scripts/sync-calendar.cjs');
const fixture = require('./fixtures/hamro-2083-7.json');
const page = (payload) => '<script type="application/json" id="hp-bootstrap">' + JSON.stringify(payload) + '</script>';
const NOW = new Date('2026-11-12T12:00:00+05:45');

// Isolated source responses for the updater's network boundary. The real source
// fixture above is reduced to date facts; no articles, events or visitor data.
function yearPages(year) {
    let nextDay = Date.parse(data.years[year].startDate + 'T00:00:00Z');
    const months = data.years[year].months.map((length, index) => {
        const days = Array.from({ length }, (_, day) => {
            const ad = new Date(nextDay);
            nextDay += 86400000;
            return { year_bs: year, month_bs: index + 1, day_bs: day + 1, inMonth: true,
                year_ad: ad.getUTCFullYear(), month_ad: ad.getUTCMonth() + 1, day_ad: ad.getUTCDate() };
        });
        return { yearBs: year, monthBs: index + 1, daysInMonth: length, days };
    });
    return (url) => {
        const requested = Number(new URL(url).pathname.split('/').pop());
        return page({ path: `/en/calendar/${year}/${requested}`, page: 'calendar-month',
            data: { calendar: { initialMonths: months.slice(requested - 2, requested + 1) } } });
    };
}

test('published Hamro Patro date facts match Kartik 2083 and adjacent month boundaries', () => {
    const result = parsePage(page(fixture), 2083, 7);
    assert.deepEqual(result.map(({ month, startDate, length }) => ({ month, startDate, length })), [
        { month: 6, startDate: '2026-09-17', length: 31 },
        { month: 7, startDate: '2026-10-18', length: 30 },
        { month: 8, startDate: '2026-11-17', length: 29 }
    ]);
});

test('changed source formats, wrong pages and nonconsecutive dates are rejected', () => {
    assert.throws(() => parsePage('<html>Source unavailable</html>', 2083, 7), /format changed/);
    assert.throws(() => parsePage(page(fixture), 2084, 7), /wrong calendar page/);
    const missing = structuredClone(fixture);
    missing.data.calendar.initialMonths[1].days = missing.data.calendar.initialMonths[1].days.slice(0, 3);
    assert.throws(() => parsePage(page(missing), 2083, 7), /Incomplete month/);
    const shifted = structuredClone(fixture);
    shifted.data.calendar.initialMonths[1].days.find((day) => day.inMonth && day.day_bs === 2).day_ad++;
    assert.throws(() => parsePage(page(shifted), 2083, 7), /not consecutive/);
    const invalid = structuredClone(fixture);
    invalid.data.calendar.initialMonths[1].days.find((day) => day.inMonth).month_ad = 15;
    assert.throws(() => parsePage(page(invalid), 2083, 7), /Invalid Gregorian date/);
});

test('the updater collects all 12 months using only four published page requests', async () => {
    const urls = [];
    const read = yearPages(2084);
    const result = await collectYear(2084, async (url) => { urls.push(url); return read(url); }, () => {});
    assert.deepEqual(result, data.years[2084]);
    assert.deepEqual(urls.map((url) => Number(url.split('/').pop())), [2, 5, 8, 11]);
});

test('calendar ingestion rejects bad lengths, impossible dates, gaps and invalid totals', () => {
    for (const mutate of [
        (copy) => { copy.years[2083].months[0] = 33; },
        (copy) => { copy.years[2083].startDate = '2026-02-30'; },
        (copy) => { copy.years[2083].startDate = '2026-04-15'; },
        (copy) => { delete copy.years[2082]; },
        (copy) => { copy.years[2083].months.fill(30); },
        (copy) => { copy.checkedAt = 'not a date'; }
    ]) {
        const copy = structuredClone(data);
        mutate(copy);
        assert.throws(() => calendar.createCalendar(copy));
    }
});

test('a failed refresh leaves the last working data untouched', async (t) => {
    const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'progressbar-calendar-'));
    const output = path.join(folder, 'calendar-data.js');
    await fs.writeFile(output, 'last working data');
    t.after(async () => { await fs.unlink(output); await fs.rmdir(folder); });
    await assert.rejects(sync({ from: 2083, through: 2083, now: NOW, previous: data, output,
        readPage: async () => '<html>Temporarily unavailable</html>' }), /format changed/);
    assert.equal(await fs.readFile(output, 'utf8'), 'last working data');
});

test('a successful refresh saves validated data and preserves historical years', async (t) => {
    const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'progressbar-calendar-'));
    const output = path.join(folder, 'calendar-data.js');
    t.after(async () => { await fs.unlink(output); await fs.rmdir(folder); });
    await sync({ from: 2084, through: 2084, now: NOW, previous: data, output,
        readPage: async (url) => yearPages(2084)(url) });
    const context = {};
    vm.runInNewContext(await fs.readFile(output, 'utf8'), context);
    const saved = JSON.parse(JSON.stringify(context.ProgressCalendarData));
    assert.deepEqual(saved.years, data.years);
    assert.equal(saved.checkedAt, NOW.toISOString());
    assert.deepEqual(saved.checkedYears, [2084]);
    assert.deepEqual(calendar.createCalendar(saved).getBsDate(NOW), { year: 2083, monthIndex: 6, day: 26 });
});

test('the browser calendar keeps working if the data script is missing or invalid', async () => {
    const code = await fs.readFile(path.join(__dirname, '../public/assets/js/calendar.js'), 'utf8');
    for (const bundled of [undefined, { schemaVersion: 99 }]) {
        const context = { ProgressCalendarData: bundled, console: { warn() {} } };
        vm.runInNewContext(code, context);
        assert.equal(context.ProgressCalendar.dataInfo.source, 'Bundled calendar');
        assert.equal(context.ProgressCalendar.getBsDate(NOW).day, 26);
        assert.equal(context.ProgressCalendar.getDayProgress(NOW), 50);
    }
});

test('Hamro Patro year boundaries cover 2084 and the 2028 leap-year transition', () => {
    assert.deepEqual(calendar.getBsDate(new Date('2027-04-14T00:00:00+05:45')), { year: 2084, monthIndex: 0, day: 1 });
    assert.deepEqual(calendar.getBsDate(new Date('2028-04-12T23:59:59+05:45')), { year: 2084, monthIndex: 11, day: 30 });
    assert.equal(calendar.getYearProgress(new Date('2027-04-14T00:00:00+05:45')), 0);
    assert.equal(calendar.getBsYearWindow(new Date('2027-04-14T00:00:00+05:45')).end,
        Date.parse('2028-04-13T00:00:00+05:45'));
});
