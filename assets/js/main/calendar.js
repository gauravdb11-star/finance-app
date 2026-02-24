// Global function so it can be called by filters.js and transactions.js
window.updateCalendarEvents = function (filteredData) {
    const calendar = document.getElementById("customCalendar");
    if (!calendar) return;

    let transactionsByDate = {};
    let latestTxnDate = new Date(0);

    filteredData.forEach(row => {
        if (!row.Date || typeof row.Date !== 'string' || !row.Date.includes('-')) return;
        
        // Expected format: DD-MM-YYYY
        let dateParts = row.Date.split('-');
        if (dateParts.length !== 3) return;

        let day = parseInt(dateParts[0], 10);
        let month = parseInt(dateParts[1], 10);
        let year = parseInt(dateParts[2], 10);

        let txnDate = new Date(year, month - 1, day);
        if (txnDate > latestTxnDate) latestTxnDate = txnDate;

        // Use YYYY-MM-DD as a consistent mapping key
        let formattedKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        transactionsByDate[formattedKey] = transactionsByDate[formattedKey] || { earnings: 0, expenses: 0 };
        transactionsByDate[formattedKey].earnings += parseFloat(row["Deposit Amt."] || 0);
        transactionsByDate[formattedKey].expenses += parseFloat(row["Withdrawal Amt."] || 0);
    });

    // Get selected filters
    let selectedYear = document.getElementById("calendarYear")?.value;
    let selectedMonth = document.getElementById("calendarMonth")?.value;

    // Default to the latest month/year from transactions if no filter is selected
    if (!selectedYear || !selectedMonth) {
        if (!isNaN(latestTxnDate.getTime()) && latestTxnDate.getTime() > 0) {
            selectedYear = latestTxnDate.getFullYear();
            selectedMonth = latestTxnDate.getMonth() + 1;
        } else {
            const now = new Date();
            selectedYear = now.getFullYear();
            selectedMonth = now.getMonth() + 1;
        }

        // Update dropdown UI to match defaults
        if (document.getElementById("calendarYear")) document.getElementById("calendarYear").value = selectedYear;
        if (document.getElementById("calendarMonth")) document.getElementById("calendarMonth").value = selectedMonth;
    }

    generateCalendarUI(parseInt(selectedYear), parseInt(selectedMonth), transactionsByDate);
};

function generateCalendarUI(year, month, transactionsByDate) {
    const calendar = document.getElementById("customCalendar");
    calendar.innerHTML = ""; 

    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let html = `
        <table class="calendar-table">
            <thead>
                <tr>
                    <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                </tr>
            </thead>
            <tbody><tr>`;

    // Fill empty cells before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
        html += `<td></td>`; 
    }

    // Generate days
    for (let day = 1; day <= daysInMonth; day++) {
        let dateKey = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        let txn = transactionsByDate[dateKey];

        // Format to Indian Rupees
        const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

        html += `
            <td>
                <div class="calendar-day">${day}</div>
                ${txn && txn.earnings > 0 ? `<div class='earning'>+${formatMoney(txn.earnings)}</div>` : ""}
                ${txn && txn.expenses > 0 ? `<div class='spending'>-${formatMoney(txn.expenses)}</div>` : ""}
            </td>`;

        if ((day + firstDay) % 7 === 0) {
            html += `</tr><tr>`; 
        }
    }
    
    html += `</tr></tbody></table>`;
    calendar.innerHTML = html;
}