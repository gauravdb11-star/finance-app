let categoryChart = null;
let monthlyChart = null;

window.renderCharts = function(filteredData) {
    const categoryMap = {};
    const monthlyMap = {};
    const depositMap = {};

    filteredData.forEach(row => {
        if (!row.Date || typeof row.Date !== 'string') return;

        let dateParts = row.Date.split('-'); // Format is DD-MM-YYYY
        if (dateParts.length !== 3) return;

        // Group by MM/YYYY for the bar chart
        const monthYear = `${dateParts[1]}/${dateParts[2]}`;

        const withdrawal = parseFloat(row["Withdrawal Amt."] || 0);
        const deposit = parseFloat(row["Deposit Amt."] || 0);
        const category = row.Category || "Uncategorized";

        // Map Category Totals (excluding salaries/deposits from the pie chart)
        if (withdrawal > 0 && category !== "SALARY") {
            categoryMap[category] = (categoryMap[category] || 0) + withdrawal;
        }

        monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + (-Math.abs(withdrawal)); // Expenses as negative
        depositMap[monthYear] = (depositMap[monthYear] || 0) + Math.abs(deposit); // Deposits as positive
    });

    // Destroy existing charts to prevent hover glitches
    if (categoryChart) categoryChart.destroy();
    if (monthlyChart) monthlyChart.destroy();

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
        const valueElement = document.getElementById(category);
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
    // 3. RENDER MONTHLY EXPENSE TREND (BAR CHART)
    // ---------------------------------------------
    const barCtx = document.getElementById('monthlyChart');
    if (barCtx) {
        // Sort labels chronologically if possible
        const sortedLabels = Object.keys(monthlyMap).sort((a, b) => {
            const [mA, yA] = a.split('/');
            const [mB, yB] = b.split('/');
            return new Date(yA, mA - 1) - new Date(yB, mB - 1);
        });

        const expensesData = sortedLabels.map(label => monthlyMap[label] || 0);
        const depositsData = sortedLabels.map(label => depositMap[label] || 0);

        monthlyChart = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: sortedLabels,
                datasets: [
                    {
                        label: 'Expenses',
                        data: expensesData,
                        backgroundColor: 'rgba(255, 87, 51, 0.8)',
                        borderColor: '#FF5733',
                        borderWidth: 1,
                        stack: 'combined'
                    },
                    {
                        label: 'Deposits',
                        data: depositsData,
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        borderColor: '#28A745',
                        borderWidth: 1,
                        stack: 'combined'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: "#AFDDE5", font: { size: 10 } } }
                },
                scales: {
                    x: { stacked: true, ticks: { color: "#AFDDE5" }, grid: { display: false } },
                    y: { stacked: true, ticks: { color: "#AFDDE5" }, grid: { color: "rgba(255, 255, 255, 0.1)" } }
                }
            }
        });
    }
}