window.updateNetBalance = function(logicalMonthlyData) {
    const incomeEl = document.getElementById("totalIncome");
    const expenseEl = document.getElementById("totalExpenses");
    const balanceEl = document.getElementById("netBalance");

    const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

    if (!logicalMonthlyData || !logicalMonthlyData.length) {
        if (incomeEl) incomeEl.textContent = "₹0";
        if (expenseEl) expenseEl.textContent = "₹0";
        if (balanceEl) balanceEl.textContent = "₹0";
        return;
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    // 1. Calculate Income & Expenses using the shifted data (Late salary belongs to NEXT month)
    logicalMonthlyData.forEach(row => {
        totalIncome += parseFloat(row["Deposit Amt."] || 0);
        totalExpenses += parseFloat(row["Withdrawal Amt."] || 0);
    });

    // 2. TRUE BANK BALANCE CALCULATION
    const allData = window.transactions || [];
    let actualClosingBalance = 0;
    let lateSalarySpike = 0;

    // Use the globals we set in calendar.js
    const targetMonth = window.currentNavMonth || new Date().getMonth() + 1;
    const targetYear = window.currentNavYear || new Date().getFullYear();

    // Find the physical transactions that occurred in this calendar month
    const physicalMonthData = allData.filter(row => {
        if (!row.Date || !row.Date.includes('-')) return false;
        let parts = row.Date.split('-');
        return parseInt(parts[1], 10) === targetMonth && parseInt(parts[2], 10) === targetYear;
    });

    if (physicalMonthData.length > 0) {
        // The last chronological transaction is the End of Month balance
        const lastPhysicalTxn = physicalMonthData[physicalMonthData.length - 1];
        actualClosingBalance = parseFloat(lastPhysicalTxn["Closing Balance"] || 0);

        // Detect the late salary so we can subtract it from this month's spending pool
        physicalMonthData.forEach(row => {
            let d = parseInt(row.Date.split('-')[0], 10);
            if (row.Category === "SALARY" && d >= 24) {
                lateSalarySpike += parseFloat(row["Deposit Amt."] || 0);
            }
        });
    } else {
        // Fallback if no physical data exists
        actualClosingBalance = parseFloat(logicalMonthlyData[logicalMonthlyData.length - 1]["Closing Balance"] || 0);
    }

    // 3. Output the true leftover balance
    let effectiveBalance = actualClosingBalance - lateSalarySpike;

    if (incomeEl) incomeEl.textContent = formatCurrency(Math.round(totalIncome));
    if (expenseEl) expenseEl.textContent = formatCurrency(Math.round(totalExpenses));
    if (balanceEl) balanceEl.textContent = formatCurrency(Math.round(effectiveBalance));
};