window.updateNetBalance = function(cycleData) {
    const incomeEl = document.getElementById("totalIncome");
    const expenseEl = document.getElementById("totalExpenses");
    const balanceEl = document.getElementById("netBalance");

    const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

    if (!cycleData || !cycleData.length) {
        if (incomeEl) incomeEl.textContent = "₹0";
        if (expenseEl) expenseEl.textContent = "₹0";
        if (balanceEl) balanceEl.textContent = "₹0";
        return;
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    // 1. Calculate Income & Expenses for the Pay Cycle
    cycleData.forEach(row => {
        totalIncome += parseFloat(row["Deposit Amt."] || 0);
        totalExpenses += parseFloat(row["Withdrawal Amt."] || 0);
    });

    // 2. TRUE BANK BALANCE CALCULATION
    // Because the cycleData is a chronological slice (e.g., Jan 25 - Feb 24),
    // the very last transaction in this array holds the true closing balance 
    // at the absolute end of your paycheck cycle!
    const lastTransaction = cycleData[cycleData.length - 1];
    let effectiveBalance = parseFloat(lastTransaction["Closing Balance"] || 0);

    // Apply values to the DOM
    if (incomeEl) incomeEl.textContent = formatCurrency(Math.round(totalIncome));
    if (expenseEl) expenseEl.textContent = formatCurrency(Math.round(totalExpenses));
    if (balanceEl) balanceEl.textContent = formatCurrency(Math.round(effectiveBalance));
};