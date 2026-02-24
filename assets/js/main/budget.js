let budgetChartInstance = null; // Store chart instance globally to destroy it on update

window.updateBudget = function (filteredData) {
    let totalIncome = 0;
    
    let spending = {
        needs: 0, // 60% Target
        wants: 0, // 30% Target
        savings: 0 // 10% Target
    };

    // Calculate totals from filtered data
    filteredData.forEach(row => {
        const deposit = parseFloat(row["Deposit Amt."] || 0);
        const withdrawal = parseFloat(row["Withdrawal Amt."] || 0);
        const category = row.Category || "Uncategorized";

        totalIncome += deposit;

        if (withdrawal > 0) {
            if (["HOME LOAN", "HOSPITAL", "FOOD", "INSURANCE", "CREDIT CARD"].includes(category)) {
                spending.needs += withdrawal;
            } else if (["MOVIE", "RECHARGE", "TRAVEL", "MISC", "Uncategorized"].includes(category)) {
                spending.wants += withdrawal;
            } else if (["INVESTMENT"].includes(category)) {
                spending.savings += withdrawal;
            }
        }
    });

    // Define Budget Targets (60-30-10 Rule)
    const budget = {
        needs: totalIncome * 0.60,
        wants: totalIncome * 0.30,
        savings: totalIncome * 0.10
    };

    // Update the UI Progress Bars and Text
    updateProgressUI("need", budget.needs, spending.needs);
    updateProgressUI("want", budget.wants, spending.wants);
    updateProgressUI("saving", budget.savings, spending.savings);

    // Update Available Cash
    const availableCashEl = document.getElementById("availableCash");
    if (availableCashEl) {
        availableCashEl.textContent = new Intl.NumberFormat('en-IN').format(totalIncome - (spending.needs + spending.wants + spending.savings));
    }

    // Render the Budget Donut Chart
    renderBudgetDonutChart(spending.needs, spending.wants, spending.savings, totalIncome);
};

function updateProgressUI(categoryPrefix, targetBudget, spentAmount) {
    const totalEl = document.getElementById(`${categoryPrefix}Total`);
    const spentEl = document.getElementById(`${categoryPrefix}Spent`);
    const remainingEl = document.getElementById(`${categoryPrefix}Remaining`);
    const progressEl = document.getElementById(`${categoryPrefix}Progress`);

    if (!totalEl || !spentEl || !remainingEl || !progressEl) return;

    const remaining = targetBudget - spentAmount;
    let percentage = targetBudget > 0 ? (spentAmount / targetBudget) * 100 : 0;
    
    // Format Numbers
    const format = (num) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);

    totalEl.textContent = format(targetBudget);
    spentEl.textContent = format(spentAmount);
    remainingEl.textContent = format(remaining);

    // Update Progress Bar visually
    progressEl.style.width = `${Math.min(percentage, 100)}%`;
    
    // Change color to danger if over budget
    if (percentage > 100) {
        progressEl.classList.remove("bg-success", "bg-warning", "bg-danger");
        progressEl.classList.add("bg-danger");
    }
}

function renderBudgetDonutChart(needs, wants, savings, totalIncome) {
    const ctx = document.getElementById("budgetChart");
    if (!ctx) return;

    if (budgetChartInstance) {
        budgetChartInstance.destroy();
    }

    // If there is no income, show empty grey chart
    const dataValues = totalIncome > 0 ? [needs, wants, savings] : [1];
    const bgColors = totalIncome > 0 ? ['#DC3545', '#FFC107', '#28A745'] : ['#444444'];
    const labels = totalIncome > 0 ? ['Needs (60%)', 'Wants (30%)', 'Savings (10%)'] : ['No Income Data'];

    budgetChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: "#FFFFFF", font: { size: 10 } } }
            }
        }
    });
}