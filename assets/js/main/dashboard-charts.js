let categoryChart = null;

window.renderCharts = function(filteredData) {
    const categoryMap = {};

    filteredData.forEach(row => {
        if (!row.Date || typeof row.Date !== 'string') return;

        const withdrawal = parseFloat(row["Withdrawal Amt."] || 0);
        const category = row.Category || "Uncategorized";

        // Map Category Totals (excluding salaries/deposits from the pie chart)
        if (withdrawal > 0 && category !== "SALARY") {
            categoryMap[category] = (categoryMap[category] || 0) + withdrawal;
        }
    });

    // Destroy existing chart to prevent hover glitches when updating filters
    if (categoryChart) {
        categoryChart.destroy();
    }

    // ---------------------------------------------
    // 1. UPDATE SPENDING GRID UI
    // ---------------------------------------------
    // Reset all spending cells to 0 and dimmed opacity
    document.querySelectorAll(".spending-cell p").forEach(valueElement => {
        valueElement.textContent = "₹0";
        valueElement.closest(".spending-cell").style.opacity = "0.4";
    });

    // Apply exact values to matching IDs
    Object.keys(categoryMap).forEach(category => {
        // Find the HTML element where ID exactly matches the Category string (e.g., id="HOME LOAN")
        const safeId = category.replace(/\s+/g, '_'); 
		const valueElement = document.getElementById(safeId);
        if (valueElement) {
            const amount = categoryMap[category];
            valueElement.textContent = new Intl.NumberFormat("en-IN", { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
            valueElement.closest(".spending-cell").style.opacity = "1"; // Light up active cells
        }
    });

    // ---------------------------------------------
    // 2. RENDER CATEGORY PIE CHART
    // ---------------------------------------------
    const pieCtx = document.getElementById('categoryChart');
    if (pieCtx) {
        const originalColors = [
            '#FF1744', '#FF9100', '#FFEA00', '#76FF03', '#00E676',
            '#00E5FF', '#2979FF', '#D500F9', '#FF4081', '#1DE9B6', '#FFFFFF'
        ];

        categoryChart = new Chart(pieCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: Object.keys(categoryMap),
                datasets: [{
                    data: Object.values(categoryMap),
                    backgroundColor: [...originalColors],
                    hoverOffset: 4,
                    borderWidth: 1,
                    borderColor: '#121212' // Dark border to blend with card
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: {
                    legend: { position: 'left', labels: { color: "#AFDDE5", font: { size: 10 }, boxWidth: 12 } }
                }
            }
        });
    }

    // ---------------------------------------------
    // 3. UPDATE RECENT & TOP EXPENSES LISTS
    // ---------------------------------------------
    updateRecentAndTopTransactions(filteredData);
};


// Generates the sleek flexbox lists for Recent and Top expenses
window.updateRecentAndTopTransactions = function(filteredData) {
    const recentEl = document.getElementById('last6Spendings');
    const topEl = document.getElementById('topExpensesList');
    
// 1. RECENT TRANSACTIONS (Exactly 6 transactions to fit the tile perfectly)
    if (recentEl) {
        recentEl.innerHTML = '';
        const recent = [...filteredData].reverse().slice(0, 6); // Changed from 15 to 6
        
        if (recent.length === 0) {
            recentEl.innerHTML = `<li class="text-center text-muted mt-4" style="list-style:none;">No transactions</li>`;
        } else {
            recent.forEach(txn => {
                const amount = parseFloat(txn["Withdrawal Amt."] || txn["Deposit Amt."] || 0);
                const isWithdrawal = parseFloat(txn["Withdrawal Amt."] || 0) > 0;
                const fmtAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
                const name = txn.Name || txn.Reason || txn.Category || "Transaction";
                
                recentEl.innerHTML += `
                    <li class="d-flex justify-content-between align-items-center mb-2" style="background: #1a1a1a; border-radius: 8px; padding: 8px 12px; list-style: none;">
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-size: 13px; font-weight: bold; color: #E0E0E0;">${name.substring(0, 20)}</span>
                            <span style="font-size: 10px; color: #888;">${txn.Date} &bull; ${txn.Category}</span>
                        </div>
                        <span style="color: ${isWithdrawal ? '#FF5733' : '#28A745'}; font-weight: bold; font-size: 13px;">
                            ${isWithdrawal ? '-' : '+'}${fmtAmt}
                        </span>
                    </li>
                `;
            });
        }
    }

    // 2. TOP 5 EXPENSES (Highest withdrawals in the filtered period)
    if (topEl) {
        topEl.innerHTML = '';
        // Filter only expenses, sort from highest to lowest
        const expenses = filteredData.filter(t => parseFloat(t["Withdrawal Amt."] || 0) > 0);
        expenses.sort((a, b) => parseFloat(b["Withdrawal Amt."]) - parseFloat(a["Withdrawal Amt."]));
        
        const top5 = expenses.slice(0, 5);
        
        if (top5.length === 0) {
            topEl.innerHTML = `<li class="text-center text-muted mt-4" style="list-style:none;">No expenses</li>`;
        } else {
            top5.forEach(txn => {
                const amt = parseFloat(txn["Withdrawal Amt."]);
                const fmtAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
                const name = txn.Name || txn.Reason || txn.Category || "Expense";
                
                topEl.innerHTML += `
                    <li class="d-flex justify-content-between align-items-center mb-3" style="background: transparent; border-bottom: 1px solid #222; padding: 8px 5px; list-style: none;">
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <span style="font-size: 13px; font-weight: bold; color: #E0E0E0;">${name.substring(0, 16)}</span>
                            <span style="font-size: 10px; color: #888;">${txn.Date} &bull; ${txn.Category}</span>
                        </div>
                        <span style="color: #FF5733; font-weight: bold; font-size: 14px;">${fmtAmt}</span>
                    </li>
                `;
            });
        }
    }
};