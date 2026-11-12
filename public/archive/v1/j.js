const timeSpan = document.querySelector('.time');
const progressBar = document.querySelector('.progress-inner');
const DayPerentage = document.querySelector('.percentageofDay');
const ProgressofDay = document.querySelector('.progressInn');
const Mosoftheyear = document.querySelector('.month1');
const CurrDay = document.querySelector('.day1');

const monthNames = [
    'Baisakh',
    'Jestha',
    'Asar',
    'Shrawan',
    'Bhadra',
    'Aswin',
    'Kartik',
    'Mangsir',
    'Poush',
    'Magh',
    'Falgun',
    'Chaitra'
];

// Month-length data aligned with Nepali calendar reference.
const bsMonthData = {
    2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30]
};

const bsYearStartAD = {
    2081: new Date(2024, 3, 13),
    2082: new Date(2025, 3, 14),
    2083: new Date(2026, 3, 14)
};

function getSortedBsYears() {
    return Object.keys(bsYearStartAD)
        .map(Number)
        .sort((a, b) => a - b);
}

function getBsYearWindow(adDate) {
    const years = getSortedBsYears();
    let currentYear = years[0];

    for (let i = 0; i < years.length; i++) {
        if (adDate >= bsYearStartAD[years[i]]) {
            currentYear = years[i];
        } else {
            break;
        }
    }

    const startDate = bsYearStartAD[currentYear];
    const nextYear = currentYear + 1;
    let endDate = bsYearStartAD[nextYear];

    if (!endDate && bsMonthData[currentYear]) {
        const totalDays = bsMonthData[currentYear].reduce((a, b) => a + b, 0);
        endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
    }

    if (!endDate) {
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    return {
        year: currentYear,
        startDate,
        endDate
    };
}

function getStartOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(startDate, endDate) {
    const start = getStartOfDay(startDate).getTime();
    const end = getStartOfDay(endDate).getTime();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function getBsDate(adDate) {
    let year = 2082;
    if (adDate >= bsYearStartAD[2083]) {
        year = 2083;
    } else if (adDate >= bsYearStartAD[2082]) {
        year = 2082;
    } else {
        year = 2081;
    }

    const months = bsMonthData[year];
    let dayOfYear = daysBetween(bsYearStartAD[year], adDate) + 1;

    if (dayOfYear < 1) {
        dayOfYear = 1;
    }

    const totalDays = months.reduce((a, b) => a + b, 0);
    if (dayOfYear > totalDays) {
        dayOfYear = totalDays;
    }

    let monthIndex = 0;
    while (monthIndex < months.length && dayOfYear > months[monthIndex]) {
        dayOfYear -= months[monthIndex];
        monthIndex++;
    }

    return {
        year,
        monthIndex,
        day: dayOfYear
    };
}

function updateDayProgress(now) {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const totalTime = endOfDay.getTime() - startOfDay.getTime();
    const elapsedTime = now.getTime() - startOfDay.getTime();
    const percentage = (elapsedTime / totalTime) * 100;
    const rounded = percentage.toFixed(5);

    ProgressofDay.style.width = rounded + '%';
    DayPerentage.innerHTML = rounded + '%';
    CheckColours(Number(rounded));
}

function updateYearProgress(now) {
    const yearWindow = getBsYearWindow(now);
    const startTime = yearWindow.startDate.getTime();
    const endTime = yearWindow.endDate.getTime();
    const totalTime = endTime - startTime;
    let elapsedTime = now.getTime() - startTime;

    if (elapsedTime < 0) {
        elapsedTime = 0;
    }
    if (elapsedTime > totalTime) {
        elapsedTime = totalTime;
    }

    const percentage = (elapsedTime / totalTime) * 100;
    const rounded = percentage.toFixed(6);

    progressBar.style.width = rounded + '%';
    timeSpan.innerHTML = rounded + '%';
    document.querySelectorAll('.year-label').forEach((el) => {
        el.textContent = yearWindow.year;
    });
    checkColors(Number(rounded));
}

function updateBsMonthDay(now) {
    const bsDate = getBsDate(now);
    Mosoftheyear.innerHTML = monthNames[bsDate.monthIndex];
    CurrDay.innerHTML = bsDate.day;
}

function updateAllProgress() {
    const now = new Date();
    updateDayProgress(now);
    updateYearProgress(now);
    updateBsMonthDay(now);
}

const icon = document.getElementById('icons');

function enableDarkmode() {
    document.body.classList.add('dark-theme');
    icon.src = 'sun.png';
    localStorage.setItem('darkmode', 'enabled');
}

function disableDarkmode() {
    document.body.classList.remove('dark-theme');
    icon.src = 'moon.png';
    localStorage.setItem('darkmode', 'disabled');
}

if (localStorage.getItem('darkmode') === 'enabled') {
    enableDarkmode();
}

icon.onclick = function () {
    if (document.body.classList.contains('dark-theme')) {
        disableDarkmode();
    } else {
        enableDarkmode();
    }
};

let count = localStorage.getItem('visitorCount') || 0;
const counterElement = document.getElementById('counter');
counterElement.textContent = count;
count++;
localStorage.setItem('visitorCount', count);

const checkColors = (width) => {
    if (width > 50 && width < 80) {
        progressBar.style.background = 'yellow';
    } else if (width > 80) {
        progressBar.style.background = 'red';
    } else {
        progressBar.style.background = '#00f047';
    }
};

const CheckColours = (width1) => {
    if (width1 > 50 && width1 < 80) {
        ProgressofDay.style.background = 'yellow';
    } else if (width1 > 80) {
        ProgressofDay.style.background = 'red';
    } else {
        ProgressofDay.style.background = '#00f047';
    }
};

setInterval(updateAllProgress, 500);
updateAllProgress();

window.addEventListener('scroll', function () {
    var header = document.querySelector('header');
    header.classList.toggle('sticky', window.scrollY > 0);
});

function RealTimeClock() {
    var rtClock = new Date();
    var hours = rtClock.getHours();
    var minutes = rtClock.getMinutes();
    var seconds = rtClock.getSeconds();

    var amPm = (hours < 12) ? 'AM' : 'PM';
    hours = (hours > 12) ? hours - 12 : hours;
    hours = ('0' + hours).slice(-2);
    minutes = ('0' + minutes).slice(-2);
    seconds = ('0' + seconds).slice(-2);
    document.getElementById('clock').innerHTML = hours + ':' + minutes + ':' + seconds + ' ' + amPm;
    setTimeout(RealTimeClock, 1000);
}
        
        
