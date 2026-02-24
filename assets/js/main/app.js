document.addEventListener("DOMContentLoaded", function () {
    // Check if user is logged in
    if (Cookies.get("loggedIn") && typeof showDashboard === "function") {
        showDashboard();
    }

    // Sidebar Toggle
    const menuButton = document.querySelector(".menu-button");
    if (menuButton) {
        menuButton.addEventListener("click", function () {
            document.querySelector(".sidebar").classList.toggle("expanded");
            document.querySelector(".main-content").classList.toggle("shifted");
        });
    }

    // ✅ Load transactions from LocalStorage (Persistent across logins)
    const storedData = localStorage.getItem("transactions");
    if (storedData) {
        window.transactions = JSON.parse(storedData);
        if (typeof updateFilters === "function") updateFilters();
        
        if (window.location.pathname.includes("dashboard.html")) {
            if (typeof processTransactions === "function") processTransactions();
        } else if (window.location.pathname.includes("transaction.html")) {
            if (typeof updateTable === "function") updateTable(window.transactions);
        }
    }

    // ✅ Handle Excel Upload
    const excelFileInput = document.getElementById("excelFile");
    if (excelFileInput) {
        excelFileInput.addEventListener("change", loadExcel);
    }
});

// Logout Function
function logout() {
    // We do NOT clear localStorage for 'transactions' here anymore, 
    // so data stays available for the next login!
    localStorage.removeItem("username"); 
    Cookies.remove("loggedIn");
    window.location.href = "login.html";
}