/* Pure calendar calculations shared by the browser and Node tests. */
(function (root, factory) {
    const calendar = factory();
    if (typeof module === 'object' && module.exports) module.exports = calendar;
    else root.ProgressCalendar = calendar;
}(globalThis, function () {
    'use strict';
    const DAY_MS = 86400000;
    const NEPAL_OFFSET_MS = 345 * 60000;
    const monthNames = Object.freeze([
        'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Aswin',
        'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
    ]);
    // Retained project data. Verify new rows against published calendars.
    // Years must remain contiguous. See CODEBASE.md for sources and updates.
    const bsMonthData = Object.freeze({
        2081: Object.freeze([31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31]),
        2082: Object.freeze([31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]),
        2083: Object.freeze([31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30])
    });
    // 1 Baisakh 2081 = 13 April 2024, midnight in Nepal (UTC+05:45).
    let nextStart = Date.parse('2024-04-13T00:00:00+05:45');
    const yearWindows = Object.keys(bsMonthData).map(Number).map((year) => {
        const start = nextStart;
        const totalDays = bsMonthData[year].reduce((sum, days) => sum + days, 0);
        nextStart += totalDays * DAY_MS;
        return Object.freeze({ year, start, end: nextStart, totalDays });
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
    function getProgressColor(value) {
        if (value >= 80) return '#ef4444';
        if (value >= 50) return '#facc15';
        return '#00f047';
    }
    return Object.freeze({
        monthNames, bsMonthData, getDayProgress, getBsYearWindow,
        getBsDate, getYearProgress, getProgressColor
    });
}));
