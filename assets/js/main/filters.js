function updateFilters() {
    if (!window.transactions) return;

    const categories = new Set();
    const years = new Set();
    const months = new Set();

    window.transactions.forEach(row => {
        if (row.Category) categories.add(row.Category);
        
        if (row.Date && typeof row.Date === 'string') {
            const dateParts = row.Date.split('-'); // Expected Format: DD-MM-YYYY
            if (dateParts.length === 3) {
                months.add(dateParts[1]); // Extract Month
                years.add(dateParts[2]);  // Extract Year
            }
        }
    });

    const categoryFilter = document.getElementById("categoryFilter");
    const yearElements = [document.getElementById("yearFilter"), document.getElementById("calendarYear")];
    const monthElements = [document.getElementById("monthFilter"), document.getElementById("calendarMonth")];

    // Populate Category Dropdown
    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>' +
            [...categories].sort().map(cat => `<option value="${cat}">${cat}</option>`).join('');
        categoryFilter.addEventListener("change", applyFilters);
    }

    // Populate Year Dropdowns
    yearElements.forEach(yearFilter => {
        if (yearFilter) {
            yearFilter.innerHTML = '<option value="">All Years</option>' +
                [...years].sort().map(year => `<option value="${year}">${year}</option>`).join('');
            yearFilter.addEventListener("change", applyFilters);
        }
    });

    // Populate Month Dropdowns
    monthElements.forEach(monthFilter => {
        if (monthFilter) {
            monthFilter.innerHTML = '<option value="">All Months</option>' +
                [...months].sort().map(month => {
                    const monthName = new Date(0, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
                    return `<option value="${month}">${monthName}</option>`;
                }).join('');
            monthFilter.addEventListener("change", applyFilters);
        }
    });
}

function applyFilters() {
    const selectedCategory = document.getElementById("categoryFilter")?.value || "";
    const selectedYear = document.getElementById("yearFilter")?.value || document.getElementById("calendarYear")?.value || "";
    const selectedMonth = document.getElementById("monthFilter")?.value || document.getElementById("calendarMonth")?.value || "";

    const filteredData = window.transactions.filter(row => {
        if (!row.Date || typeof row.Date !== 'string') return false;
        
        const dateParts = row.Date.split('-');
        if (dateParts.length !== 3) return false;

        const month = dateParts[1];
        const year = dateParts[2];

        const matchCategory = !selectedCategory || row.Category === selectedCategory;
        const matchYear = !selectedYear || year === selectedYear;
        const matchMonth = !selectedMonth || month === selectedMonth;

        return matchCategory && matchYear && matchMonth;
    });

    // Update specific pages based on current URL
    if (window.location.pathname.includes("dashboard.html")) {
        if (typeof updateNetBalance === "function") updateNetBalance(filteredData);
        if (typeof renderCharts === "function") renderCharts(filteredData);
        if (typeof updateCalendarEvents === "function") updateCalendarEvents(filteredData);
        if (typeof updateBudget === "function") updateBudget(filteredData);
    }

    if (window.location.pathname.includes("transaction.html")) {
        if (typeof updateTable === "function") updateTable(filteredData);
    }
}