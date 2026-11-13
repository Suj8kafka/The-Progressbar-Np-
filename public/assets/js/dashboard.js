(function () {
    'use strict';
    const calendar = window.ProgressCalendar;
    const byId = (id) => document.getElementById(id);
    const text = (id, value) => { const element = byId(id); if (element) element.textContent = value; };
    const dayFill = document.querySelector('.progressInn');
    const yearFill = document.querySelector('.progress-inner');
    const dayPercentage = document.querySelector('.percentageofDay');
    const yearPercentage = document.querySelector('.time');
    const periodButtons = [...document.querySelectorAll('[data-period]')];
    const clockFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const shortDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short' });
    const nepaliNumber = new Intl.NumberFormat('en', { numberingSystem: 'deva', useGrouping: false });
    const monthFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', month: 'short' });
    const milestoneDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric' });
    const DAY_MS = 86400000;
    let period = 'year';
    let renderedDay = '';
    let selectedMonth = null;
    let dots = [];
    let monthButtons = [];
    let lastBsYear = null;
    let timer = null;
    const supportedYears = calendar.dataInfo.firstYear + '–' + calendar.dataInfo.lastYear + ' BS';
    const sourceLink = byId('calendar-source');
    if (sourceLink) {
        sourceLink.textContent = 'Calendar: ' + calendar.dataInfo.source + (calendar.dataInfo.sourceUrl ? ' ↗' : '');
        if (calendar.dataInfo.sourceUrl) sourceLink.href = calendar.dataInfo.sourceUrl;
        else sourceLink.removeAttribute('href');
    }
    if (calendar.dataInfo.checkedAt) {
        text('calendar-verified', 'Checked ' + new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Asia/Kathmandu', day: 'numeric', month: 'short', year: 'numeric'
        }).format(new Date(calendar.dataInfo.checkedAt)));
    }

    function setProgress(fill, value) {
        if (!fill) return;
        fill.style.width = (value ?? 0) + '%';
        const track = fill.parentElement;
        if (value === null) {
            track.removeAttribute('aria-valuenow');
            track.setAttribute('aria-valuetext', 'Calendar unavailable');
        } else {
            track.setAttribute('aria-valuenow', value.toFixed(5));
            track.setAttribute('aria-valuetext', value.toFixed(2) + '% elapsed');
        }
    }
    function remainingTime(milliseconds) {
        const minutes = Math.ceil(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);
        return hours + 'h ' + String(minutes % 60).padStart(2, '0') + 'm';
    }
    function countdown(milliseconds) {
        const minutes = Math.max(0, Math.ceil(milliseconds / 60000));
        const days = Math.floor(minutes / 1440);
        const hours = Math.floor(minutes % 1440 / 60);
        return (days ? days + 'd ' : '') + hours + 'h ' + String(minutes % 60).padStart(2, '0') + 'm';
    }
    function renderMilestones(now, bs) {
        const container = byId('calendar-milestones');
        if (!container) return;
        container.hidden = !bs;
        if (!bs) return;
        const month = calendar.getPeriodProgress(now, 'month');
        const year = calendar.getBsYearWindow(now);
        text('bs-current-month', calendar.monthNames[bs.monthIndex]);
        text('bs-month-position', 'Day ' + bs.day + ' of ' + month.totalDays);
        text('bs-month-remaining', month.remainingDays === 0 ? 'The last day of this month.' : month.remainingDays + (month.remainingDays === 1 ? ' full day' : ' full days') + ' after today');
        setProgress(byId('bs-month-fill'), month.percentage);
        text('bs-next-month', calendar.monthNames[(bs.monthIndex + 1) % 12] + ' 1');
        text('bs-month-countdown', countdown(month.end - now.getTime()));
        text('bs-next-month-date', shortDate.format(new Date(month.end)) + ' · 00:00 NPT');
        text('bs-next-year', (bs.year + 1) + ' BS');
        text('bs-year-countdown', countdown(year.end - now.getTime()));
        text('bs-new-year-date', 'Baisakh 1 · ' + milestoneDate.format(new Date(year.end)));
    }
    function renderInternational(now, rebuildTimeline) {
        const fill = byId('international-fill');
        if (!fill) return;
        const year = calendar.getGregorianProgress(now);
        setProgress(fill, year.percentage);
        text('international-percentage', year.percentage.toFixed(2));
        text('international-year-number', year.year);
        text('international-date', dateFormat.format(now));
        text('international-position', 'Day ' + (year.elapsedDays + 1) + ' of ' + year.totalDays);
        text('international-days-left', year.remainingDays + (year.remainingDays === 1 ? ' full day ahead' : ' full days ahead'));
        if (!rebuildTimeline) return;
        const timeline = byId('international-months');
        timeline.replaceChildren();
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
            const date = new Date(Date.UTC(year.year, monthIndex, 15));
            const month = calendar.getGregorianProgress(date, 'month');
            const label = document.createElement('span');
            label.className = 'international-month';
            label.style.flexGrow = month.totalDays;
            label.style.flexBasis = '0';
            label.textContent = monthFormat.format(date);
            label.title = label.textContent + ' ' + year.year + ' · ' + month.totalDays + ' days';
            if (monthIndex === year.monthIndex) label.setAttribute('aria-current', 'date');
            timeline.appendChild(label);
        }
    }
    function renderPeriod(now, bs) {
        const result = calendar.getPeriodProgress(now, period);
        const name = period === 'month' && bs ? calendar.monthNames[bs.monthIndex] : 'the ' + period;
        text('period-heading', period === 'month' && bs ? name + ', in motion' : period === 'year' ? 'The Nepali year so far' : 'The ' + period + ' so far');
        text('period-name', name);
        text('hero-percentage', result ? result.percentage.toFixed(2) : '—');
        const heroTrack = byId('hero-progress');
        if (heroTrack) heroTrack.setAttribute('aria-label', period + ' elapsed');
        setProgress(byId('hero-fill'), result ? result.percentage : null);
        if (!result) {
            text('period-range', 'Calendar unavailable');
            text('period-start', '—'); text('period-end', '—');
            text('period-remaining', '—'); text('remaining-unit', 'calendar data needed');
            text('period-position', 'Try the day or week view.');
            return;
        }
        if (period === 'year') {
            text('period-range', bs.year + ' · BIKRAM SAMBAT');
            text('period-start', 'Baisakh 1'); text('period-end', 'Chaitra ' + calendar.bsMonthData[bs.year][11]);
        } else if (period === 'month') {
            text('period-range', bs.year + ' BS');
            text('period-start', name + ' 1'); text('period-end', name + ' ' + result.totalDays);
        } else {
            text('period-range', period === 'day' ? 'NEPAL STANDARD TIME' : 'SUNDAY — SATURDAY');
            text('period-start', period === 'day' ? '00:00' : shortDate.format(new Date(result.start)));
            text('period-end', period === 'day' ? '24:00' : shortDate.format(new Date(result.end - 1)));
        }
        text('period-remaining', period === 'day' ? remainingTime(result.end - now.getTime()) : result.remainingDays);
        text('remaining-unit', period === 'day' ? 'still yours today' : (result.remainingDays === 1 ? 'day still ahead' : 'days still ahead'));
        text('period-position', period === 'day' ? 'One moment at a time.' : 'Day ' + (result.elapsedDays + 1) + ' of ' + result.totalDays);
    }
    function selectMonth(index, bs, window) {
        selectedMonth = selectedMonth === index ? null : index;
        monthButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selectedMonth)));
        const grid = byId('year-dots');
        grid.classList.toggle('has-selection', selectedMonth !== null);
        dots.forEach((dot) => dot.classList.toggle('highlight', selectedMonth !== null && Number(dot.dataset.month) === selectedMonth));
        if (selectedMonth === null) {
            text('month-detail', 'Choose a month to take a closer look.');
            return;
        }
        const months = calendar.bsMonthData[bs.year];
        const offset = months.slice(0, selectedMonth).reduce((a, b) => a + b, 0);
        const start = window.start + offset * DAY_MS;
        const end = start + months[selectedMonth] * DAY_MS;
        text('month-detail', calendar.monthNames[selectedMonth] + ' ' + bs.year + ' · ' + months[selectedMonth] + ' days · ' + shortDate.format(new Date(start)) + ' – ' + shortDate.format(new Date(end - 1)) + '. Select again to see the whole year.');
    }
    function renderYearMap(now, bs) {
        const grid = byId('year-dots');
        const strip = byId('months-strip');
        if (!grid || !strip) return;
        grid.replaceChildren(); strip.replaceChildren();
        grid.classList.toggle('has-selection', false);
        dots = []; monthButtons = [];
        if (!bs) {
            grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', 'Nepali calendar unavailable for this date');
            grid.textContent = 'The Nepali calendar is unavailable for this date.';
            ['total-days', 'day-of-year', 'summary-total', 'year-days-left'].forEach((id) => text(id, '—'));
            text('month-detail', 'Supported calendar: ' + supportedYears + '.');
            return;
        }
        const window = calendar.getBsYearWindow(now);
        const dayIndex = Math.floor((now.getTime() - window.start) / DAY_MS);
        const months = calendar.bsMonthData[bs.year];
        if (lastBsYear !== bs.year) selectedMonth = null;
        lastBsYear = bs.year;
        text('total-days', window.totalDays); text('summary-total', window.totalDays);
        text('day-of-year', dayIndex + 1); text('year-days-left', window.totalDays - dayIndex - 1);
        grid.setAttribute('role', 'img');
        grid.setAttribute('aria-label', bs.year + ' BS: ' + dayIndex + ' days passed, today is day ' + (dayIndex + 1) + ', ' + (window.totalDays - dayIndex - 1) + ' full days ahead.');
        let ordinal = 0;
        months.forEach((length, monthIndex) => {
            for (let day = 1; day <= length; day++, ordinal++) {
                const dot = document.createElement('span');
                dot.className = 'year-dot' + (ordinal < dayIndex ? ' passed' : ordinal === dayIndex ? ' current' : '');
                dot.dataset.month = String(monthIndex);
                dot.title = calendar.monthNames[monthIndex] + ' ' + day + ', ' + bs.year + (ordinal === dayIndex ? ' · Today' : '');
                dot.setAttribute('aria-hidden', 'true');
                grid.appendChild(dot); dots.push(dot);
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'month-button' + (monthIndex < bs.monthIndex ? ' past' : monthIndex === bs.monthIndex ? ' current' : '');
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-label', calendar.monthNames[monthIndex] + ', ' + length + ' days');
            const bar = document.createElement('span'); bar.className = 'month-bar'; bar.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span'); label.textContent = calendar.monthNames[monthIndex];
            button.append(bar, label);
            // The month controls are rebuilt when the Nepal date rolls over.
            button.addEventListener('click', () => selectMonth(monthIndex, bs, window));
            strip.appendChild(button); monthButtons.push(button);
        });
        if (selectedMonth !== null) { const previous = selectedMonth; selectedMonth = null; selectMonth(previous, bs, window); }
        else text('month-detail', 'Choose a month to take a closer look.');
    }
    function update() {
        const now = new Date();
        const bs = calendar.getBsDate(now);
        const day = calendar.getDayProgress(now);
        const year = calendar.getYearProgress(now);
        text('clock', clockFormat.format(now));
        if (byId('clock')) byId('clock').setAttribute('datetime', now.toISOString());
        text('gregorian-date', dateFormat.format(now));
        dayPercentage.textContent = day.toFixed(5) + '%';
        yearPercentage.textContent = year === null ? 'Unavailable' : year.toFixed(2) + '%';
        setProgress(dayFill, day); setProgress(yearFill, year);
        text('day-readable-value', day.toFixed(1));
        const dayWindow = calendar.getPeriodWindow(now, 'day');
        text('day-remaining', remainingTime(dayWindow.end - now.getTime()));
        const ring = byId('day-ring');
        if (ring) ring.style.setProperty('--day-progress', day + '%');
        document.querySelectorAll('.year-label').forEach((label) => { label.textContent = bs ? bs.year : '—'; });
        if (bs) {
            document.querySelector('.month1').textContent = calendar.monthNames[bs.monthIndex];
            document.querySelector('.day1').textContent = bs.day;
            text('date-year', bs.year); text('calendar-era', 'BS');
            text('nepali-date-native', nepaliNumber.format(bs.day) + ' ' + calendar.monthNamesNe[bs.monthIndex] + ' ' + nepaliNumber.format(bs.year));
        } else {
            text('nepali-date-native', '');
            const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', month: 'long', day: 'numeric', year: 'numeric' }).formatToParts(now);
            const part = (type) => parts.find((value) => value.type === type).value;
            document.querySelector('.month1').textContent = part('month');
            document.querySelector('.day1').textContent = part('day');
            text('date-year', part('year')); text('calendar-era', 'AD');
        }
        byId('calendar-status').hidden = Boolean(bs);
        if (!bs) text('calendar-status', 'The available Nepali calendar covers ' + supportedYears + '. Day and week progress remain available.');
        if (sourceLink && bs && calendar.dataInfo.sourceUrl) sourceLink.href = calendar.dataInfo.sourceUrl + '/' + bs.year + '/' + (bs.monthIndex + 1);
        text('copyright-year', new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kathmandu', year: 'numeric' }).format(now));
        renderPeriod(now, bs);
        const dateKey = dayWindow.start + ':' + (bs ? bs.year : 'unsupported');
        renderMilestones(now, bs);
        renderInternational(now, dateKey !== renderedDay);
        if (dateKey !== renderedDay) { renderedDay = dateKey; renderYearMap(now, bs); }
    }
    periodButtons.forEach((button) => button.addEventListener('click', () => {
        period = button.dataset.period;
        periodButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
        update();
    }));

    const themeButton = byId('theme-toggle');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    let themePreference = null;
    try { themePreference = localStorage.getItem('darkmode'); } catch { /* Storage may be disabled. */ }
    function setTheme(dark) {
        document.body.classList.toggle('dark-theme', dark);
        themeButton.setAttribute('aria-pressed', String(dark));
        themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    setTheme(themePreference === 'enabled' || (themePreference !== 'disabled' && systemTheme.matches));
    themeButton.addEventListener('click', () => {
        const dark = !document.body.classList.contains('dark-theme');
        themePreference = dark ? 'enabled' : 'disabled';
        setTheme(dark);
        try { localStorage.setItem('darkmode', themePreference); } catch { /* Theme still works without storage. */ }
    });
    systemTheme.addEventListener('change', (event) => { if (themePreference === null) setTheme(event.matches); });
    // Retain the old browser-local visit count without presenting it as analytics.
    let visits = 1;
    try { visits = Math.max(0, Number(localStorage.getItem('visitorCount')) || 0) + 1; localStorage.setItem('visitorCount', String(visits)); } catch { /* Optional local state. */ }
    text('counter', visits);
    function startTimer() { if (timer === null) timer = setInterval(update, 1000); }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { clearInterval(timer); timer = null; }
        else { update(); startTimer(); }
    });
    update();
    if (!document.hidden) startTimer();
}());
