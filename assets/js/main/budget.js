document.addEventListener("DOMContentLoaded", function () {
    function calculateBudget() {
        let salary = extractSalaryFromCSV();
        updateBudgetUI(salary);
    }

    function extractSalaryFromCSV() {
        let salary = 0;
        let selectedYear = document.getElementById("calendarYear")?.value || new Date().getFullYear();
        let selectedMonth = document.getElementById("calendarMonth")?.value || (new Date().getMonth() + 1);

        let transactions = JSON.parse(sessionStorage.getItem("transactions")) || [];

        transactions.forEach(row => {
            if (!row.Date || typeof row.Date !== 'string') return;
            let dateParts = row.Date.split('-');
            if (dateParts.length !== 3) return;
            let formattedMonth = dateParts[1];
            let formattedYear = dateParts[2];

            if (formattedYear == selectedYear && formattedMonth == selectedMonth && row["Deposit Amt."]) {
                salary += row["Deposit Amt."] || row["Deposit Amount"] || 0;
            }
        });

        return salary;
    }
document.addEventListener("DOMContentLoaded", function () {
    // Fetch salary from the Donut Chart data
    let salary = getSalaryFromChart();
   
    if (!salary) return; // Exit if salary is not found
    // Define category budgets
    let needBudget = salary * 0.6;
    let wantBudget = salary * 0.3;
    let savingsBudget = salary * 0.1;
    // Get spending from sessionStorage
    let transactions = JSON.parse(sessionStorage.getItem("transactions")) || [];
   
    // Calculate spending for each category
    let spending = {
        need: 0,
        want: 0,
        savings: 0,
        subcategories: {
            homeLoan: 0,
            creditCard: 0,
            hospital: 0,
            travel: 0,
            food: 0,
            recharge: 0,
            movie: 0,
            misc: 0,
            investment: 0,
            insurance: 0
        }
    };
    transactions.forEach(txn => {
        let amount = parseFloat(txn.amount);
        let category = txn.category.toLowerCase(); // Normalize category names
        if (["home loan", "credit card", "hospital", "travel", "food"].includes(category)) {
            spending.need += amount;
            spending.subcategories[category.replace(" ", "")] += amount;
        } else if (["recharge", "movie", "misc"].includes(category)) {
            spending.want += amount;
            spending.subcategories[category] += amount;
        } else if (["investment", "insurance"].includes(category)) {
            spending.savings += amount;
            spending.subcategories[category] += amount;
        }
    });
    // Update UI for Need
    updateProgress("need", needBudget, spending.need);
    updateProgress("homeLoan", needBudget, spending.subcategories.homeLoan);
    updateProgress("creditCard", needBudget, spending.subcategories.creditCard);
    updateProgress("hospital", needBudget, spending.subcategories.hospital);
    updateProgress("travel", needBudget, spending.subcategories.travel);
    updateProgress("food", needBudget, spending.subcategories.food);
    // Update UI for Want
    updateProgress("want", wantBudget, spending.want);
    updateProgress("recharge", wantBudget, spending.subcategories.recharge);
    updateProgress("movie", wantBudget, spending.subcategories.movie);
    updateProgress("misc", wantBudget, spending.subcategories.misc);
    // Update UI for Savings
    updateProgress("savings", savingsBudget, spending.savings);
    updateProgress("investment", savingsBudget, spending.subcategories.investment);
    updateProgress("insurance", savingsBudget, spending.subcategories.insurance);
});
// Function to update progress bars
function updateProgress(category, budget, spent) {
    let progressElement = document.getElementById(`${category}Progress`);
    let totalElement = document.getElementById(`${category}Total`);
    let spentElement = document.getElementById(`${category}Spent`);
    let remainingElement = document.getElementById(`${category}Remaining`);
    if (progressElement) {
        let percentage = (spent / budget) * 100;
        progressElement.style.width = `${Math.min(percentage, 100)}%`;
    }
    if (totalElement) totalElement.textContent = budget.toFixed(2);
    if (spentElement) spentElement.textContent = spent.toFixed(2);
    if (remainingElement) remainingElement.textContent = (budget - spent).toFixed(2);
}
// Function to get salary from Donut Chart
function getSalaryFromChart() {
    let salaryElement = document.getElementById("budgetDonutChart");
    return salaryElement ? parseFloat(salaryElement.getAttribute("data-salary")) : null;
}