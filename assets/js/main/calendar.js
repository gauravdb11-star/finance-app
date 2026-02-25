window.currentNavYear = new Date().getFullYear();
window.currentNavMonth = new Date().getMonth() + 1;

window.updateCalendarEvents = function (allData) {
    let latestTxnDate = new Date(0);

    allData.forEach(row => {
        if (!row.Date || !row.Date.includes('-')) return;
        let parts = row.Date.split('-');
        let txnDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (txnDate > latestTxnDate) latestTxnDate = txnDate;
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

// --- UPGRADED: MAXIMUM DEPOSIT DETECTOR ---
function getDynamicCycleDates(targetMonth, targetYear, allData) {
    let maxDepositsByMonth = {};

    // 1. Find the absolute largest deposit for EVERY month in your data
    allData.forEach(row => {
        let deposit = parseFloat(row["Deposit Amt."] || 0);
        if (deposit > 0 && row.Date && row.Date.includes('-')) {
            let parts = row.Date.split('-');
            let monthKey = `${parts[2]}-${parts[1]}`; // Group by YYYY-MM
            let d = parseInt(parts[0], 10);
            
            // If we haven't checked this month yet, OR if this deposit is bigger than the previous biggest
            if (!maxDepositsByMonth[monthKey] || deposit > maxDepositsByMonth[monthKey].amount) {
                maxDepositsByMonth[monthKey] = {
                    amount: deposit,
                    date: new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, d)
                };
            }
        }
    });

    // 2. Extract those exact dates and sort them chronologically
    let salaryDates = Object.values(maxDepositsByMonth)
        .map(item => item.date)
        .sort((a, b) => a - b);

    // Failsafe: If there are zero deposits in the entire dataset
    if (salaryDates.length === 0) {
        return {
            start: new Date(targetYear, targetMonth - 1, 1),
            end: new Date(targetYear, targetMonth, 0)
        };
    }

    // 3. Find the Salary that funds this target month (Before the 15th of the month)
    let midMonthLimit = new Date(targetYear, targetMonth - 1, 15);
    let validStartSalaries = salaryDates.filter(d => d < midMonthLimit);
    
    let startSalaryDate;
    if (validStartSalaries.length > 0) {
        // Grab the most recent massive deposit before the mid-month cutoff
        startSalaryDate = validStartSalaries[validStartSalaries.length - 1]; 
    } else {
        // Failsafe: If no prior salary exists (e.g., your very first month of data)
        startSalaryDate = new Date(targetYear, targetMonth - 1, 1); 
    }

    // 4. Find the End Date (The day BEFORE the next massive deposit)
    let futureSalaries = salaryDates.filter(d => d > startSalaryDate);
    let cycleStart = new Date(startSalaryDate);
    let cycleEnd;

    if (futureSalaries.length > 0) {
        let nextSalaryDate = futureSalaries[0];
        cycleEnd = new Date(nextSalaryDate);
        cycleEnd.setDate(cycleEnd.getDate() - 1); // Exact day before next salary!
    } else {
        // If the next salary hasn't arrived yet, span to the end of the current physical month
        cycleEnd = new Date(targetYear, targetMonth, 0); 
    }

    return { start: cycleStart, end: cycleEnd };
}

window.updateDashboardForSelectedMonth = function() {
    const allData = window.transactions || [];

    const cycleDates = getDynamicCycleDates(window.currentNavMonth, window.currentNavYear, allData);

    const cycleData = allData.filter(row => {
        if (!row.Date || !row.Date.includes('-')) return false;
        let parts = row.Date.split('-');
        let txnDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        return txnDate >= cycleDates.start && txnDate <= cycleDates.end;
    });

    const calendarMonthData = allData.filter(row => {
        if (!row.Date || !row.Date.includes('-')) return false;
        let parts = row.Date.split('-');
        return parseInt(parts[1], 10) === window.currentNavMonth && parseInt(parts[2], 10) === window.currentNavYear;
    });

    renderModernCalendar(calendarMonthData, cycleDates);

    if (typeof updateNetBalance === "function") updateNetBalance(cycleData);
    if (typeof renderCharts === "function") renderCharts(cycleData);
    if (typeof updateBudget === "function") updateBudget(cycleData);
};

function renderModernCalendar(calendarMonthData, cycleDates) {
    const calendar = document.getElementById("customCalendar");
    const display = document.getElementById("currentMonthDisplay");
    if (!calendar || !display) return;

    let monthlyTransactions = {};
    calendarMonthData.forEach(row => {
        let parts = row.Date.split('-');
        let day = parseInt(parts[0], 10);
        monthlyTransactions[day] = monthlyTransactions[day] || { earnings: 0, expenses: 0 };
        monthlyTransactions[day].earnings += parseFloat(row["Deposit Amt."] || 0);
        monthlyTransactions[day].expenses += parseFloat(row["Withdrawal Amt."] || 0);
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[window.currentNavMonth - 1];
    
    const formatCycleDate = (d) => `${monthNames[d.getMonth()]} ${d.getDate()}`;
    const cycleText = `${formatCycleDate(cycleDates.start)} - ${formatCycleDate(cycleDates.end)}`;

    display.innerHTML = `
        <div style="line-height: 1.2;">
            ${monthName} ${window.currentNavYear}
            <div style="font-size: 10px; color: #888; font-weight: normal; margin-top: 2px;">
                Cycle: ${cycleText}
            </div>
        </div>
    `;

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
        let txn = monthlyTransactions[day];
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