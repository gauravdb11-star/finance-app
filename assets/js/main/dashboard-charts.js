function renderCharts(filteredData) {
    const categoryMap = {};
    const monthlyMap = {};
    const depositMap = {};

    filteredData.forEach(row => {
        if (!row.Date || typeof row.Date !== 'string') return;

        let dateParts = row.Date.includes('-') ? row.Date.split('-') : row.Date.split('/');
        if (dateParts.length !== 3) return;

        const month = dateParts[1].padStart(2, '0') + '/' + dateParts[2];

        const withdrawal = row["Withdrawal Amt."] ?? row["Withdrawal Amount"] ?? 0;
        const deposit = row["Deposit Amt."] ?? row["Deposit Amount"] ?? 0;

        if (row.Category) {
            categoryMap[row.Category] = (categoryMap[row.Category] || 0) + withdrawal;
        }

        monthlyMap[month] = (monthlyMap[month] || 0) + (-Math.abs(withdrawal)); // Ensure expenses are negative
        depositMap[month] = (depositMap[month] || 0) + Math.abs(deposit); // Ensure deposits are positive

    });

    // Destroy existing charts if they exist
    if (categoryChart && typeof categoryChart.destroy === "function") {
        categoryChart.destroy();
    }
    if (monthlyChart && typeof monthlyChart.destroy === "function") {
        monthlyChart.destroy();
    }

    // Remove "SALARY" from categoryMap if it exists
    if (categoryMap.hasOwnProperty("SALARY")) {
        delete categoryMap["SALARY"];
    }

    // Render Category Pie Chart
const originalColors = [
    '#FF1744', '#FF9100', '#FFEA00', '#76FF03', '#00E676',
    '#00E5FF', '#2979FF', '#D500F9', '#FF4081', '#1DE9B6'
];

const ctx = document.getElementById('categoryChart').getContext('2d');

categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: Object.keys(categoryMap),
        datasets: [{
            label: 'Amount',
            data: Object.values(categoryMap),
            backgroundColor: [...originalColors], // Store original colors
            hoverOffset: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 0, bottom: 0 } },
        plugins: {
            legend: {
                position: 'left',
                labels: { color: "#AFDDE5", font: { size: 10 }, boxWidth: 10 }
            },
            tooltip: { enabled: true }
        },
        elements: { arc: { borderWidth: 1 } },
        onHover: function(event, elements) {
            let chart = categoryChart;
            let dataset = chart.data.datasets[0];

            if (!elements.length) {
                // If hovering outside the chart, reset colors
                dataset.backgroundColor = [...originalColors];
                chart.update();
                return;
            }

            let activeIndex = elements[0].index;

            // Reset all colors before applying transparency
            dataset.backgroundColor = originalColors.map((color, index) =>
                index === activeIndex ? color : 'rgba(100, 100, 100, 0.9)' // Non-hovered sections become cloudy white
            );

            chart.update();
        }
    }
});

// Reset colors when mouse leaves the entire canvas
ctx.canvas.addEventListener('mouseleave', () => {
    categoryChart.data.datasets[0].backgroundColor = [...originalColors];
    categoryChart.update();
});



    // Reset spending values before updating
    document.querySelectorAll(".spending-cell p").forEach(valueElement => {
        valueElement.textContent = "₹0";
        valueElement.closest(".spending-cell").style.opacity = "0.5";
    });

    // Update spending categories
    Object.keys(categoryMap).forEach(category => {
        const valueElement = document.getElementById(category);
        if (valueElement) {
            let rawValue = categoryMap[category];
            const amount = parseFloat(rawValue.toString().replace(/,/g, "")) || 0;
            valueElement.textContent = `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
            valueElement.closest(".spending-cell").style.opacity = (amount === 0) ? "0.5" : "1";
        }
    });

// Render Negative Stacked Bar Chart
    monthlyChart = new Chart(document.getElementById('monthlyChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: Object.keys(monthlyMap),
            datasets: [
                {
                    label: 'Expenses',
                    data: Object.values(monthlyMap),
                    backgroundColor: 'rgba(255, 87, 51, 0.8)',
                    borderColor: '#FF5733',
                    borderWidth: 1,
                    stack: 'combined'
                },
                {
                    label: 'Deposits',
                    data: Object.values(depositMap),
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
                legend: { labels: { color: "#AFDDE5" } }
            },
            scales: {
                x: { 
                    stacked: true,
                    ticks: { color: "#AFDDE5" },
                    grid: { display: false } 
                },
                y: { 
                    stacked: true,
                    ticks: { color: "#AFDDE5" },
                    grid: { color: "rgba(255, 255, 255, 0.1)" } 
                }
            }
        }
    });
}
