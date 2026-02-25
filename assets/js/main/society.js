document.addEventListener("DOMContentLoaded", () => {
    loadSavedConfig();
});

// Load parameters from memory if they exist
function loadSavedConfig() {
    const saved = localStorage.getItem("societyLoanConfig");
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById("cfgLoanAmount").value = config.loanAmount;
        document.getElementById("cfgStartDate").value = config.startDate;
        document.getElementById("cfgPrincipal").value = config.monthlyPrincipal;
        document.getElementById("cfgInitialRate").value = config.initialRate;
        document.getElementById("cfgChangeDate").value = config.changeDate || "";
        document.getElementById("cfgNewRate").value = config.newRate || config.initialRate;
        document.getElementById("cfgShares").value = config.shares;
        document.getElementById("cfgSavings").value = config.savings;
        document.getElementById("cfgCd").value = config.cd;
        document.getElementById("cfgCharges").value = config.charges;
        
        generateLedger(); // Auto-generate on page load
    }
}

// The Core Generator Engine
window.generateLedger = function() {
    // 1. Gather all inputs
    const config = {
        loanAmount: parseFloat(document.getElementById("cfgLoanAmount").value) || 0,
        startDate: document.getElementById("cfgStartDate").value,
        monthlyPrincipal: parseFloat(document.getElementById("cfgPrincipal").value) || 0,
        initialRate: parseFloat(document.getElementById("cfgInitialRate").value) || 0,
        changeDate: document.getElementById("cfgChangeDate").value,
        newRate: parseFloat(document.getElementById("cfgNewRate").value) || 0,
        shares: parseFloat(document.getElementById("cfgShares").value) || 0,
        savings: parseFloat(document.getElementById("cfgSavings").value) || 0,
        cd: parseFloat(document.getElementById("cfgCd").value) || 0,
        charges: parseFloat(document.getElementById("cfgCharges").value) || 0
    };

    if (!config.startDate || config.loanAmount <= 0) return alert("Please provide a valid Loan Amount and Start Date.");

    // Save to browser memory
    localStorage.setItem("societyLoanConfig", JSON.stringify(config));

    // 2. Setup Loop Variables
    let currentBalance = config.loanAmount;
    let ledger = [];
    
    // Parse Start Date (e.g., "2021-04")
    let currentYear = parseInt(config.startDate.split("-")[0], 10);
    let currentMonth = parseInt(config.startDate.split("-")[1], 10);

    // Parse Rate Change Date
    let changeYear = 9999, changeMonth = 99;
    if (config.changeDate) {
        changeYear = parseInt(config.changeDate.split("-")[0], 10);
        changeMonth = parseInt(config.changeDate.split("-")[1], 10);
    }

    // Get today's real-world month/year to determine "Paid" vs "Pending"
    const today = new Date();
    const realYear = today.getFullYear();
    const realMonth = today.getMonth() + 1; // 1-12

    let totalPrinPaid = 0;
    let totalIntPaid = 0;
    let currentOutstanding = config.loanAmount;
    let nextUpcomingEmi = 0;

    // 3. Mathematical Loop (Run until loan is dead)
    while (currentBalance > 0) {
        // Determine active interest rate for this specific month
        let activeRate = config.initialRate;
        if (currentYear > changeYear || (currentYear === changeYear && currentMonth >= changeMonth)) {
            activeRate = config.newRate;
        }

        // Calculate precise days in this month
        let daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

        // Standard Indian Banking formula: (Balance * Rate% / 365) * Days
        let rawInterest = (currentBalance * (activeRate / 100)) / 365 * daysInMonth;
        let monthlyInterest = Math.round(rawInterest);

        // Ensure we don't overpay principal on the very last month
        let actualPrincipalCut = Math.min(config.monthlyPrincipal, currentBalance);
        
        let emi = actualPrincipalCut + monthlyInterest;
        let totalDeduction = emi + config.shares + config.savings + config.cd + config.charges;

        // Is this month in the past (already paid) or future (pending)?
        let isPaid = false;
        if (currentYear < realYear || (currentYear === realYear && currentMonth < realMonth)) {
            isPaid = true;
        }

        // Apply deduction
        currentBalance -= actualPrincipalCut;

        // Save row data
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let dateStr = `${monthNames[currentMonth - 1]}-${currentYear}`;

        ledger.push({
            date: dateStr,
            isPaid: isPaid,
            totalCut: totalDeduction,
            prinCut: actualPrincipalCut,
            intCut: monthlyInterest,
            balance: currentBalance
        });

        // Update real-time metrics only for "PAID" months
        if (isPaid) {
            totalPrinPaid += actualPrincipalCut;
            totalIntPaid += monthlyInterest;
            currentOutstanding = currentBalance;
        } else if (nextUpcomingEmi === 0) {
            // First unpaid month = our upcoming deduction
            nextUpcomingEmi = totalDeduction;
        }

        // Move to next month
        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
    }

    // 4. Render Dashboard Tiles
    const formatMoney = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    document.getElementById("socOutstanding").textContent = formatMoney(currentOutstanding);
    document.getElementById("socEmi").textContent = formatMoney(nextUpcomingEmi);
    document.getElementById("socPrincipalPaid").textContent = formatMoney(totalPrinPaid);
    document.getElementById("socInterestPaid").textContent = formatMoney(totalIntPaid);

    let progressPercent = Math.min(100, Math.round((totalPrinPaid / config.loanAmount) * 100));
    const progressBar = document.getElementById("socProgressBar");
    if(progressBar) {
        progressBar.style.width = `${progressPercent}%`;
        progressBar.textContent = `${progressPercent}% Paid`;
    }

    // 5. Render Ledger Table (Most recent / upcoming first)
    const tbody = document.getElementById("societyTableBody");
    tbody.innerHTML = "";

    // Reverse the array to show newest at the top
    ledger.reverse().forEach(row => {
        let statusBadge = row.isPaid 
            ? `<span style="background: rgba(40, 167, 69, 0.2); color: #28A745; padding: 2px 8px; border-radius: 10px; font-size: 11px;">PAID</span>`
            : `<span style="background: rgba(255, 193, 7, 0.2); color: #FACC15; padding: 2px 8px; border-radius: 10px; font-size: 11px;">PENDING</span>`;

        const tr = document.createElement("tr");
        if (!row.isPaid) tr.style.opacity = "0.5";

        tr.innerHTML = `
            <td style="padding: 10px; border-bottom: 1px solid #222;">
                <strong>${row.date}</strong><br>${statusBadge}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #222; color: #E0E0E0;">${formatMoney(row.totalCut)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #222; color: #28A745;">${formatMoney(row.prinCut)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #222; color: #FACC15;">${formatMoney(row.intCut)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #222; color: #FF5733; font-weight: bold;">${formatMoney(row.balance)}</td>
        `;
        tbody.appendChild(tr);
    });
};