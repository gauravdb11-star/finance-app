function updateNetBalance(filteredData) {
    const incomeEl = document.getElementById("totalIncome");
    const expenseEl = document.getElementById("totalExpenses");
    const balanceEl = document.getElementById("netBalance");

    // Standard Currency Formatter (INR)
    const formatCurrency = (num) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);

    if (!filteredData || !filteredData.length) {
        if (incomeEl) incomeEl.textContent = "0";
        if (expenseEl) expenseEl.textContent = "0";
        if (balanceEl) balanceEl.textContent = "0";
        return;
    }

    let totalIncome = 0;
    let totalExpenses = 0;

    filteredData.forEach(row => {
        totalIncome += parseFloat(row["Deposit Amt."] ?? row["Deposit Amount"] ?? 0);
        totalExpenses += parseFloat(row["Withdrawal Amt."] ?? row["Withdrawal Amount"] ?? 0);
    });

    // Get the last transaction's Closing Balance
    const lastTransaction = filteredData[filteredData.length - 1];
    const netBalance = lastTransaction && lastTransaction["Closing Balance"] !== undefined 
        ? parseFloat(lastTransaction["Closing Balance"]) 
        : 0;

    // Apply formatted numbers to DOM elements
    if (incomeEl) incomeEl.textContent = formatCurrency(Math.round(totalIncome));
    if (expenseEl) expenseEl.textContent = formatCurrency(Math.round(totalExpenses));
    if (balanceEl) balanceEl.textContent = formatCurrency(Math.round(netBalance));
}