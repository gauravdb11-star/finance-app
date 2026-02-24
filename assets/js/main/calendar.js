window.currentNavYear = new Date().getFullYear();
window.currentNavMonth = new Date().getMonth() + 1;
let globalCalendarTransactions = {}; 

window.updateCalendarEvents = function (allData) {
    globalCalendarTransactions = {};
    let latestTxnDate = new Date(0);

    allData.forEach(row => {
        if (!row.Date || !row.Date.includes('-')) return;
        
        let dateParts = row.Date.split('-');
        if (dateParts.length !== 3) return;

        let day = parseInt(dateParts[0], 10);
        let month = parseInt(dateParts[1], 10);
        let year = parseInt(dateParts[2], 10);

        let txnDate = new Date(year, month - 1, day);
        if (txnDate > latestTxnDate) latestTxnDate = txnDate;

        let formattedKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        globalCalendarTransactions[formattedKey] = globalCalendarTransactions[formattedKey] || { earnings: 0, expenses: 0 };
        globalCalendarTransactions[formattedKey].earnings += parseFloat(row["Deposit Amt."] || 0);
        globalCalendarTransactions[formattedKey].expenses += parseFloat(row["Withdrawal Amt."] || 0);
    });

    if (!window.hasInitializedCalendarNav) {
        if (!isNaN(latestTxnDate.getTime()) && latestTxnDate.getTime() > 0) {
            window.currentNavYear = latestTxnDate.getFullYear();
            window.currentNavMonth = latestTxnDate.getMonth() + 1;
        }
        window.hasInitializedCalendarNav = true;
    }

    updateDashboardForSelectedMonth();
};

window.updateDashboardForSelectedMonth = function() {
    const allData = window.transactions || [];

    // 1. Logical Filter: Shift Late Salaries
    const monthlyData = allData.filter(row => {
        if (!row.Date || !row.Date.includes('-')) return false;
        let dateParts = row.Date.split('-');
        let d = parseInt(dateParts[0], 10);
        let m = parseInt(dateParts[1], 10);
        let y = parseInt(dateParts[2], 10);

        // SHIFT LOGIC: Salary >= 24th moves to next month
        if (row.Category === "SALARY" && d >= 24) {
            m++;
            if (m > 12) {
                m = 1;
                y++;
            }
        }

        return m === window.currentNavMonth && y === window.currentNavYear;
    });

    renderModernCalendar();

    // 2. Push shifted data to dashboard. Note: We only need to pass monthlyData now!
    if (typeof updateNetBalance === "function") updateNetBalance(monthlyData);
    if (typeof renderCharts === "function") renderCharts(monthlyData);
    if (typeof updateBudget === "function") updateBudget(monthlyData);
};

function renderModernCalendar() {
    const calendar = document.getElementById("customCalendar");
    const display = document.getElementById("currentMonthDisplay");
    if (!calendar || !display) return;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    display.textContent = `${monthNames[window.currentNavMonth - 1]} ${window.currentNavYear}`;

    const firstDay = new Date(window.currentNavYear, window.currentNavMonth - 1, 1).getDay();
    const daysInMonth = new Date(window.currentNavYear, window.currentNavMonth, 0).getDate();
    
    const today = new Date();
    const isCurrentMonthAndYear = today.getFullYear() === window.currentNavYear && (today.getMonth() + 1) === window.currentNavMonth;
    const currentDay = today.getDate();

    let html = `<table class="calendar-table">
            <thead><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead>
            <tbody><tr>`;

    for (let i = 0; i < firstDay; i++) {
        html += `<td></td>`; 
    }

    for (let day = 1; day <= daysInMonth; day++) {
        let dateKey = `${window.currentNavYear}-${window.currentNavMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        let txn = globalCalendarTransactions[dateKey];
        
        const formatMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);
        let dayClass = (isCurrentMonthAndYear && day === currentDay) ? "calendar-day today" : "calendar-day";

        html += `
            <td>
                <div class="${dayClass}">${day}</div>
                ${txn && txn.earnings > 0 ? `<div class='earning'>+₹${formatMoney(txn.earnings)}</div>` : ""}
                ${txn && txn.expenses > 0 ? `<div class='spending'>-₹${formatMoney(txn.expenses)}</div>` : ""}
            </td>`;

        if ((day + firstDay) % 7 === 0) {
            html += `</tr><tr>`; 
        }
    }
    html += `</tr></tbody></table>`;
    calendar.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("prevMonth")?.addEventListener("click", () => {
        window.currentNavMonth--;
        if (window.currentNavMonth < 1) {
            window.currentNavMonth = 12;
            window.currentNavYear--;
        }
        updateDashboardForSelectedMonth(); 
    });

    document.getElementById("nextMonth")?.addEventListener("click", () => {
        window.currentNavMonth++;
        if (window.currentNavMonth > 12) {
            window.currentNavMonth = 1;
            window.currentNavYear++;
        }
        updateDashboardForSelectedMonth(); 
    });
});