'use strict';

// Read published date mappings, never private APIs or visitor-side scraping.
const fs = require('node:fs/promises');
const path = require('node:path');
const { createCalendar } = require('../public/assets/js/calendar.js');
const DAY_MS = 86400000;
const OFFSET_MS = 345 * 60000;
const SOURCE = 'https://www.hamropatro.com';
const OUTPUT = path.resolve(__dirname, '../public/assets/data/nepali-calendar.js');

function adDate(record) {
    const { year_ad: year, month_ad: month, day_ad: day } = record;
    if (![year, month, day].every(Number.isInteger) || year < 1900 || year > 2200) {
        throw new Error('Invalid Gregorian date in calendar source.');
    }
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const midnight = Date.parse(iso + 'T00:00:00+05:45');
    if (!Number.isFinite(midnight) || new Date(midnight + OFFSET_MS).toISOString().slice(0, 10) !== iso) {
        throw new Error('Invalid Gregorian date in calendar source.');
    }
    return { iso, midnight };
}

function parseMonth(month, year, index) {
    if (month.yearBs !== year || month.monthBs !== index || !Number.isInteger(month.daysInMonth)
        || month.daysInMonth < 29 || month.daysInMonth > 32 || !Array.isArray(month.days)) {
        throw new Error(`Invalid month ${year}/${index}.`);
    }
    const days = month.days.filter((day) => day.inMonth === true);
    if (days.length !== month.daysInMonth) throw new Error(`Incomplete month ${year}/${index}.`);
    let start;
    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (day.year_bs !== year || day.month_bs !== index || day.day_bs !== i + 1) {
            throw new Error(`Invalid Nepali day sequence in ${year}/${index}.`);
        }
        const ad = adDate(day);
        if (i === 0) start = ad;
        if (ad.midnight !== start.midnight + i * DAY_MS) {
            throw new Error(`Gregorian dates are not consecutive in ${year}/${index}.`);
        }
    }
    return { month: index, startDate: start.iso, start: start.midnight, length: days.length };
}

function parsePage(html, year, requestedMonth) {
    // hp-bootstrap is JSON embedded in Hamro Patro's public calendar HTML.
    const tag = html.match(/<script\b[^>]*\bid=["']hp-bootstrap["'][^>]*>([\s\S]*?)<\/script\s*>/i);
    if (!tag) throw new Error('Hamro Patro calendar format changed: hp-bootstrap is missing.');
    const bootstrap = JSON.parse(tag[1]);
    if (bootstrap.page !== 'calendar-month' || bootstrap.path !== `/en/calendar/${year}/${requestedMonth}`) {
        throw new Error(`Hamro Patro returned the wrong calendar page for ${year}/${requestedMonth}.`);
    }
    const months = bootstrap.data?.calendar?.initialMonths;
    if (!Array.isArray(months) || !months.some((month) => month.yearBs === year && month.monthBs === requestedMonth)) {
        throw new Error('Hamro Patro calendar format changed: month data is missing.');
    }
    return months.filter((month) => month.yearBs === year).map((month) => parseMonth(month, year, month.monthBs));
}

async function fetchPage(url) {
    let failure;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(20000),
                headers: { 'User-Agent': 'ProgressbarNp-CalendarSync/1.0 (+https://github.com/Suj8kafka/The-Progressbar-Np-)' }
            });
            if (!response.ok) throw new Error(`Hamro Patro returned HTTP ${response.status}.`);
            if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Expected calendar HTML.');
            const html = await response.text();
            if (html.length > 8_000_000) throw new Error('Calendar response exceeds the size limit.');
            return html;
        } catch (error) {
            failure = error;
            if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
    throw failure;
}

async function collectYear(year, readPage = fetchPage, log = console.log) {
    const found = new Map();
    // Each published page includes its previous and next month: four requests/year.
    for (const month of [2, 5, 8, 11]) {
        const url = `${SOURCE}/en/calendar/${year}/${month}`;
        log(`Checking Hamro Patro ${year}/${month}…`);
        for (const result of parsePage(await readPage(url), year, month)) {
            if (found.has(result.month) && JSON.stringify(found.get(result.month)) !== JSON.stringify(result)) {
                throw new Error(`Conflicting calendar data for ${year}/${result.month}.`);
            }
            found.set(result.month, result);
        }
    }
    const months = Array.from({ length: 12 }, (_, index) => found.get(index + 1));
    if (months.some((month) => !month)) throw new Error(`A complete calendar for ${year} is not published.`);
    for (let index = 1; index < months.length; index++) {
        if (months[index].start !== months[index - 1].start + months[index - 1].length * DAY_MS) {
            throw new Error(`Month boundaries disagree in ${year}.`);
        }
    }
    return { startDate: months[0].startDate, months: months.map((month) => month.length) };
}

function serialize(data) {
    return '/* Generated by npm run calendar:sync. Do not edit date rows manually. */\n'
        + '(function (root, data) {\n'
        + "    if (typeof module === 'object' && module.exports) module.exports = data;\n"
        + '    else root.ProgressCalendarData = data;\n'
        + '}(globalThis, ' + JSON.stringify(data, null, 2) + '));\n';
}

async function sync({ from, through, now = new Date(), readPage = fetchPage, output = OUTPUT, previous } = {}) {
    if (!previous) {
        try { previous = require(output); }
        catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; previous = { years: {} }; }
    }
    // April is deliberately included on both sides of the estimate. The fetched
    // date mappings, rather than a guessed Gregorian New Year date, are definitive.
    const nepal = new Date(now.getTime() + OFFSET_MS);
    const estimate = nepal.getUTCFullYear() + (nepal.getUTCMonth() >= 3 ? 57 : 56);
    from ??= estimate - 1;
    through ??= estimate + 1;
    if (!Number.isInteger(from) || !Number.isInteger(through) || from < 2000 || through > 2199
        || through < from || through - from > 3) throw new Error('Select one to four consecutive BS years (2000–2199).');
    const years = { ...previous.years };
    for (let year = from; year <= through; year++) years[year] = await collectYear(year, readPage);
    const data = {
        schemaVersion: 1,
        source: { name: 'Hamro Patro', url: SOURCE + '/en/calendar' },
        checkedAt: now.toISOString(),
        checkedYears: Array.from({ length: through - from + 1 }, (_, index) => from + index),
        years
    };
    // Reject incomplete years, bad dates, invalid totals or discontinuities before
    // replacing anything. A failed refresh leaves the last working file untouched.
    const candidate = createCalendar(data);
    if (!candidate.getBsDate(now)) throw new Error('The refreshed calendar does not cover today.');
    const content = serialize(data);
    const temporary = output + '.tmp';
    await fs.writeFile(temporary, content, 'utf8');
    await fs.rename(temporary, output);
    console.log(`Saved ${Object.keys(years).join(', ')} BS. Today: ${JSON.stringify(candidate.getBsDate(now))}.`);
    return data;
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i += 2) {
        if (!['--from', '--through'].includes(args[i]) || !/^\d{4}$/.test(args[i + 1] || '')) {
            console.error('Usage: node scripts/sync-calendar.cjs [--from 2081] [--through 2084]');
            process.exitCode = 1;
            break;
        }
        options[args[i].slice(2)] = Number(args[i + 1]);
    }
    if (!process.exitCode) sync(options).catch((error) => {
        console.error('Calendar refresh failed; the last validated data is unchanged. ' + error.message);
        process.exitCode = 1;
    });
}

module.exports = { adDate, parseMonth, parsePage, collectYear, serialize, sync };
