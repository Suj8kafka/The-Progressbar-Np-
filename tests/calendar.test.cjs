'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const calendar = require('../public/assets/js/calendar.js');

test('Nepal midnight and noon reset the day bar at the correct UTC instant', () => {
    assert.equal(calendar.getDayProgress(new Date('2026-11-11T18:15:00Z')), 0);
    assert.equal(calendar.getDayProgress(new Date('2026-11-12T06:15:00Z')), 50);
    assert.ok(calendar.getDayProgress(new Date('2026-11-12T18:14:59.999Z')) > 99.999);
    assert.equal(calendar.getDayProgress(new Date('2026-11-12T18:15:00Z')), 0);
});

test('known Nepali New Year fixtures roll over at Nepal midnight', () => {
    for (const [year, iso] of [[2081, '2024-04-13'], [2082, '2025-04-14'], [2083, '2026-04-14']]) {
        const now = new Date(iso + 'T00:00:00+05:45');
        assert.deepEqual(calendar.getBsDate(now), { year, monthIndex: 0, day: 1 });
        assert.equal(calendar.getYearProgress(now), 0);
        if (year > 2081) {
            assert.equal(calendar.getBsDate(new Date(now.getTime() - 1)).year, year - 1);
            assert.ok(calendar.getYearProgress(new Date(now.getTime() - 1)) > 99.999);
        }
    }
});

test('published calendar fixtures include the 31st day of Aswin 2083', () => {
    // Hamro Patro: Aswin 1 = Sep 17; Aswin 31 = Oct 17; Mangsir 1 = Nov 17.
    for (const [ad, monthIndex, day] of [
        ['2026-09-17', 5, 1], ['2026-10-17', 5, 31],
        ['2026-11-12', 6, 26], ['2026-11-17', 7, 1]
    ]) {
        assert.deepEqual(calendar.getBsDate(new Date(ad + 'T12:00:00+05:45')),
            { year: 2083, monthIndex, day });
    }
});

test('all supported month boundaries preserve the last day and advance once', () => {
    for (const [year, months] of Object.entries(calendar.bsMonthData)) {
        const window = calendar.getBsYearWindow(new Date((Number(year) - 57) + '-05-01T00:00:00+05:45'));
        let start = window.start;
        months.forEach((length, monthIndex) => {
            assert.deepEqual(calendar.getBsDate(new Date(start)), { year: Number(year), monthIndex, day: 1 });
            start += length * 86400000;
            assert.deepEqual(calendar.getBsDate(new Date(start - 1)), { year: Number(year), monthIndex, day: length });
        });
        assert.equal(start, window.end);
    }
});

test('unsupported dates are explicit rather than clamped to a false BS date', () => {
    for (const iso of ['2024-04-12T23:59:59+05:45', new Date(calendar.dataInfo.end).toISOString(), '2030-01-01T00:00:00Z']) {
        const now = new Date(iso);
        assert.equal(calendar.getBsDate(now), null);
        assert.equal(calendar.getYearProgress(now), null);
        assert.equal(calendar.getBsYearWindow(now), null);
        assert.ok(calendar.getDayProgress(now) >= 0 && calendar.getDayProgress(now) < 100);
    }
});

test('calendar results do not depend on the machine timezone or daylight saving', () => {
    const script = "const c=require('./public/assets/js/calendar.js');const d=new Date('2026-11-11T18:15:00Z');process.stdout.write(JSON.stringify([c.getDayProgress(d),c.getBsDate(d),c.getYearProgress(d),c.getGregorianProgress(d)]));";
    const outputs = ['UTC', 'America/New_York', 'Asia/Kathmandu', 'Pacific/Auckland'].map((TZ) =>
        execFileSync(process.execPath, ['-e', script], { cwd: require('node:path').resolve(__dirname, '..'), env: { ...process.env, TZ }, encoding: 'utf8' }));
    outputs.forEach((output) => assert.equal(output, outputs[0]));
});

test('progress colors include exact 50% and 80% boundaries', () => {
    assert.equal(calendar.getProgressColor(49.999), '#00f047');
    assert.equal(calendar.getProgressColor(50), '#facc15');
    assert.equal(calendar.getProgressColor(79.999), '#facc15');
    assert.equal(calendar.getProgressColor(80), '#ef4444');
});

test('invalid dates fail clearly', () => {
    assert.throws(() => calendar.getDayProgress(new Date(NaN)), RangeError);
    assert.throws(() => calendar.getBsDate(new Date(NaN)), RangeError);
    assert.throws(() => calendar.getGregorianProgress(new Date(NaN)), RangeError);
});

test('the Gregorian year rolls over at Nepal midnight, independently of the BS year', () => {
    const before = calendar.getGregorianProgress(new Date('2026-12-31T23:59:59.999+05:45'));
    assert.equal(before.year, 2026);
    assert.equal(before.elapsedDays, 364);
    assert.equal(before.remainingDays, 0);
    assert.ok(before.percentage > 99.999);
    const now = new Date('2026-12-31T18:15:00Z');
    const next = calendar.getGregorianProgress(now);
    assert.equal(next.year, 2027);
    assert.equal(next.percentage, 0);
    assert.equal(next.elapsedDays, 0);
    assert.equal(next.remainingDays, 364);
    assert.equal(calendar.getBsDate(now).year, 2083);
    assert.equal(new Date(next.start).toISOString(), '2026-12-31T18:15:00.000Z');
});

test('Gregorian progress includes leap days and actual month lengths in Nepal time', () => {
    const leapDay = new Date('2028-02-29T12:00:00+05:45');
    const leap = calendar.getGregorianProgress(leapDay);
    assert.equal(leap.totalDays, 366);
    assert.equal(leap.elapsedDays, 59);
    assert.equal(leap.percentage, 59.5 / 366 * 100);
    const february = calendar.getGregorianProgress(leapDay, 'month');
    assert.equal(february.totalDays, 29);
    assert.equal(february.remainingDays, 0);
    assert.equal(february.percentage, 28.5 / 29 * 100);
    const march = calendar.getGregorianProgress(new Date('2028-02-29T18:15:00Z'), 'month');
    assert.equal(march.totalDays, 31);
    assert.equal(march.percentage, 0);
    assert.equal(calendar.getGregorianProgress(new Date('2027-02-28T12:00:00+05:45'), 'month').totalDays, 28);
    assert.equal(calendar.getGregorianProgress(new Date('2030-01-01T12:00:00+05:45')).year, 2030);
    assert.throws(() => calendar.getGregorianProgress(leapDay, 'week'), RangeError);
});

test('Nepali weeks begin on Sunday at Nepal midnight, including Gregorian year changes', () => {
    const saturday = calendar.getPeriodProgress(new Date('2026-11-14T23:59:59.999+05:45'), 'week');
    assert.equal(new Date(saturday.start).toISOString(), '2026-11-07T18:15:00.000Z');
    assert.equal(saturday.elapsedDays, 6);
    assert.equal(saturday.remainingDays, 0);
    assert.ok(saturday.percentage > 99.999);
    const sunday = calendar.getPeriodProgress(new Date('2026-11-15T00:00:00+05:45'), 'week');
    assert.equal(sunday.percentage, 0);
    assert.equal(sunday.remainingDays, 6);
    const newYear = calendar.getPeriodProgress(new Date('2027-01-01T12:00:00+05:45'), 'week');
    assert.equal(newYear.totalDays, 7);
    assert.equal(new Date(newYear.start).toISOString(), '2026-12-26T18:15:00.000Z');
});

test('month progress uses actual BS month lengths and resets at a month boundary', () => {
    const aswin = calendar.getPeriodProgress(new Date('2026-10-17T12:00:00+05:45'), 'month');
    assert.equal(aswin.totalDays, 31);
    assert.equal(aswin.elapsedDays, 30);
    assert.equal(aswin.remainingDays, 0);
    assert.equal(aswin.percentage, 30.5 / 31 * 100);
    const kartik = calendar.getPeriodProgress(new Date('2026-10-18T00:00:00+05:45'), 'month');
    assert.equal(kartik.totalDays, 30);
    assert.equal(kartik.percentage, 0);
    assert.equal(kartik.remainingDays, 29);
    assert.equal(calendar.getPeriodProgress(new Date('2030-01-01T00:00:00+05:45'), 'month'), null);
    assert.ok(calendar.getPeriodProgress(new Date('2030-01-01T00:00:00+05:45'), 'week'));
    assert.throws(() => calendar.getPeriodWindow(new Date(), 'century'), RangeError);
});
