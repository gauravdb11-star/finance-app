document.addEventListener("DOMContentLoaded", function () {
    function generateCalendar(year, month, transactions) {
        const calendar = document.getElementById("customCalendar");
        calendar.innerHTML = ""; // Clear previous content

        let firstDay = new Date(year, month - 1, 1).getDay();
        let daysInMonth = new Date(year, month, 0).getDate();
        
        let html = `<table class="calendar-table">
            <tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr><tr>`;

        for (let i = 0; i < firstDay; i++) {
            html += "<td></td>"; // Empty cells before first day
        }

        for (let day = 1; day <= daysInMonth; day++) {
            let dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            let transaction = transactions[dateStr];

            html += `<td>
                <div class="calendar-day">${day}</div>
                ${transaction ? `
                    ${transaction.earnings > 0 ? `<div class='earning'>&#8377;${transaction.earnings.toFixed(2)}</div>` : ""}
                    ${transaction.expenses > 0 ? `<div class='spending'>&#8377;${transaction.expenses.toFixed(2)}</div>` : ""}` : ""}
            </td>`;

            if ((day + firstDay) % 7 === 0) {
                html += "</tr><tr>"; // New row after Saturday
            }
        }
        html += "</tr></table>";
        calendar.innerHTML = html;
    }

    window.updateCalendarEvents = function (filteredData) {
    let transactions = {};
    let latestTxnDate = new Date(0); // Initialize with earliest possible date

    filteredData.forEach(row => {
        if (!row.Date || typeof row.Date !== 'string' || !row.Date.includes('-')) return;
        let dateParts = row.Date.split('-');
        if (dateParts.length !== 3) return;

        let txnDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        if (txnDate > latestTxnDate) latestTxnDate = txnDate; // Track latest transaction date

        let formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        transactions[formattedDate] = transactions[formattedDate] || { earnings: 0, expenses: 0 };
        transactions[formattedDate].earnings += row["Deposit Amt."] || row["Deposit Amount"] || 0;
        transactions[formattedDate].expenses += row["Withdrawal Amt."] || row["Withdrawal Amount"] || 0;
    });

    // Get selected filters
    let selectedYear = document.getElementById("calendarYear")?.value || "";
    let selectedMonth = document.getElementById("calendarMonth")?.value || "";

    // If filters are empty, default to the latest month from transactions
    if (!selectedYear || !selectedMonth) {
        if (!isNaN(latestTxnDate.getTime())) {
            selectedYear = latestTxnDate.getFullYear();
            selectedMonth = latestTxnDate.getMonth() + 1; // JS months are 0-based

            // Update the dropdowns
            document.getElementById("calendarYear").value = selectedYear;
            document.getElementById("calendarMonth").value = selectedMonth;
        } else {
            selectedYear = new Date().getFullYear();
            selectedMonth = new Date().getMonth() + 1;
        }
    }

    generateCalendar(selectedYear, selectedMonth, transactions);
};


});