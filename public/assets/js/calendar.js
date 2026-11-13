/* Pure calendar calculations shared by the browser and Node tests. */
(function (root, factory) {
    let data = root.ProgressCalendarData;
    if (typeof module === 'object' && module.exports) {
        try { data = require('../data/nepali-calendar.js'); }
        catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
    }
    let calendar;
    try { calendar = factory(data); }
    catch (error) {
        console.warn('Calendar data rejected; using the bundled fallback.', error.message);
        calendar = factory();
    }
    if (typeof module === 'object' && module.exports) module.exports = calendar;
    else root.ProgressCalendar = calendar;
}(globalThis, function createCalendar(data) {
    'use strict';
    const DAY_MS = 86400000;
    const NEPAL_OFFSET_MS = 345 * 60000;
    const monthNames = Object.freeze([
        'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
    ]);
    const monthNamesNe = Object.freeze([
        'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
        'कार्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'
    ]);
    // Emergency fallback if the same-origin data script is unavailable. Normal
    // operation uses assets/data/nepali-calendar.js, refreshed by automation.
    const fallback = {
        schemaVersion: 1,
        source: { name: 'Bundled calendar', url: '' },
        years: {
            2081: { startDate: '2024-04-13', months: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31] },
            2082: { startDate: '2025-04-14', months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] },
            2083: { startDate: '2026-04-14', months: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30] }
        }
    };
    data ??= fallback;
    if (data.schemaVersion !== 1 || !data.years || typeof data.years !== 'object') {
        throw new Error('Unsupported calendar data format.');
    }
    if (data.checkedAt && (typeof data.checkedAt !== 'string' || !Number.isFinite(Date.parse(data.checkedAt)))) {
        throw new Error('Invalid calendar verification timestamp.');
    }
    const years = Object.keys(data.years).map(Number).sort((a, b) => a - b);
    if (!years.length || years.some((year) => !Number.isInteger(year) || year < 2000 || year > 2199)) {
        throw new Error('Invalid calendar year range.');
    }
    const table = {};
    const yearWindows = years.map((year, index) => {
        const row = data.years[year];
        if (!row || !Array.isArray(row.months) || row.months.length !== 12
            || row.months.some((days) => !Number.isInteger(days) || days < 29 || days > 32)) {
            throw new Error('Invalid month lengths for ' + year + '.');
        }
        if (typeof row.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.startDate)) {
            throw new Error('Invalid year start for ' + year + '.');
        }
        const start = Date.parse(row.startDate + 'T00:00:00+05:45');
        if (!Number.isFinite(start) || new Date(start + NEPAL_OFFSET_MS).toISOString().slice(0, 10) !== row.startDate) {
            throw new Error('Invalid Gregorian year start for ' + year + '.');
        }
        const nepalStart = new Date(start + NEPAL_OFFSET_MS);
        if (nepalStart.getUTCFullYear() !== year - 57 || nepalStart.getUTCMonth() !== 3
            || nepalStart.getUTCDate() < 12 || nepalStart.getUTCDate() > 16) {
            throw new Error('Nepali New Year must start in mid-April.');
        }
        const totalDays = row.months.reduce((sum, days) => sum + days, 0);
        if (![365, 366].includes(totalDays)) throw new Error('Invalid year length for ' + year + '.');
        if (index > 0) {
            const previousYear = years[index - 1];
            const previous = data.years[previousYear];
            const previousEnd = Date.parse(previous.startDate + 'T00:00:00+05:45')
                + previous.months.reduce((sum, days) => sum + days, 0) * DAY_MS;
            if (year !== previousYear + 1 || start !== previousEnd) throw new Error('Calendar years must be consecutive.');
        }
        table[year] = Object.freeze([...row.months]);
        return Object.freeze({ year, start, end: start + totalDays * DAY_MS, totalDays });
    });
    const bsMonthData = Object.freeze(table);
    const dataInfo = Object.freeze({
        source: data.source?.name || 'Bundled calendar',
        sourceUrl: data.source?.url || '',
        checkedAt: data.checkedAt || null,
        firstYear: years[0], lastYear: years[years.length - 1],
        start: yearWindows[0].start, end: yearWindows[yearWindows.length - 1].end
    });
    function timestamp(date) {
        const value = date.getTime();
        if (!Number.isFinite(value)) throw new RangeError('A valid date is required.');
        return value;
    }
    function percentage(elapsed, total) {
        return Math.max(0, Math.min(100, elapsed / total * 100));
    }
    function getDayProgress(date) {
        const now = timestamp(date);
        const start = Math.floor((now + NEPAL_OFFSET_MS) / DAY_MS) * DAY_MS - NEPAL_OFFSET_MS;
        return percentage(now - start, DAY_MS);
    }
    function getBsYearWindow(date) {
        const now = timestamp(date);
        return yearWindows.find((window) => now >= window.start && now < window.end) || null;
    }
    function getBsDate(date) {
        const window = getBsYearWindow(date);
        if (!window) return null;
        let day = Math.floor((timestamp(date) - window.start) / DAY_MS) + 1;
        let monthIndex = 0;
        const months = bsMonthData[window.year];
        while (day > months[monthIndex]) day -= months[monthIndex++];
        return { year: window.year, monthIndex, day };
    }
    function getYearProgress(date) {
        const window = getBsYearWindow(date);
        return window ? percentage(timestamp(date) - window.start, window.end - window.start) : null;
    }
    function getGregorianProgress(date, period = 'year') {
        const now = timestamp(date);
        const nepal = new Date(now + NEPAL_OFFSET_MS);
        const year = nepal.getUTCFullYear();
        const monthIndex = nepal.getUTCMonth();
        if (period !== 'year' && period !== 'month') throw new RangeError('Unknown Gregorian progress period.');
        const start = Date.UTC(year, period === 'year' ? 0 : monthIndex, 1) - NEPAL_OFFSET_MS;
        const end = (period === 'year' ? Date.UTC(year + 1, 0, 1) : Date.UTC(year, monthIndex + 1, 1)) - NEPAL_OFFSET_MS;
        const totalDays = (end - start) / DAY_MS;
        const elapsedDays = Math.floor((now - start) / DAY_MS);
        return { year, monthIndex, start, end, totalDays, elapsedDays,
            remainingDays: totalDays - elapsedDays - 1, percentage: percentage(now - start, end - start) };
    }
    function getPeriodWindow(date, period) {
        const now = timestamp(date);
        const dayStart = Math.floor((now + NEPAL_OFFSET_MS) / DAY_MS) * DAY_MS - NEPAL_OFFSET_MS;
        if (period === 'day') return { start: dayStart, end: dayStart + DAY_MS, totalDays: 1 };
        if (period === 'week') {
            // The Nepali week runs from Sunday to Saturday.
            const start = dayStart - new Date(now + NEPAL_OFFSET_MS).getUTCDay() * DAY_MS;
            return { start, end: start + 7 * DAY_MS, totalDays: 7 };
        }
        const window = getBsYearWindow(date);
        if (period === 'year') return window;
        if (period === 'month') {
            const bs = getBsDate(date);
            if (!bs) return null;
            const start = dayStart - (bs.day - 1) * DAY_MS;
            const totalDays = bsMonthData[bs.year][bs.monthIndex];
            return { start, end: start + totalDays * DAY_MS, totalDays };
        }
        throw new RangeError('Unknown progress period.');
    }
    function getPeriodProgress(date, period) {
        const window = getPeriodWindow(date, period);
        if (!window) return null;
        const elapsedDays = Math.floor((timestamp(date) - window.start) / DAY_MS);
        return {
            ...window, elapsedDays,
            remainingDays: window.totalDays - elapsedDays - 1,
            percentage: percentage(timestamp(date) - window.start, window.end - window.start)
        };
    }
    function getProgressColor(value) {
        if (value >= 80) return '#ef4444';
        if (value >= 50) return '#facc15';
        return '#00f047';
    }
    return Object.freeze({
        monthNames, monthNamesNe, bsMonthData, getDayProgress, getBsYearWindow, getGregorianProgress,
        getBsDate, getYearProgress, getProgressColor, getPeriodWindow, getPeriodProgress,
        dataInfo, createCalendar
    });
}));
