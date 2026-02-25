document.addEventListener("DOMContentLoaded", function () {
    // 1. Check if user is logged in (SAFE VERSION - Prevents crashes if Cookies library is missing)
    if (typeof Cookies !== "undefined" && Cookies.get("loggedIn") && typeof showDashboard === "function") {
        showDashboard();
    }

    // 2. Sidebar Toggle
    const menuButton = document.querySelector(".menu-button");
    if (menuButton) {
        menuButton.addEventListener("click", function () {
            document.querySelector(".sidebar").classList.toggle("expanded");
            document.querySelector(".main-content").classList.toggle("shifted");
        });
    }

    // 3. Load transactions from LocalStorage (Persistent across logins)
    const storedData = localStorage.getItem("transactions");
    if (storedData) {
        window.transactions = JSON.parse(storedData);
        if (typeof updateFilters === "function") updateFilters();
        
        // Page-specific routing
        if (window.location.pathname.includes("dashboard.html")) {
            if (typeof processTransactions === "function") processTransactions();
        } else if (window.location.pathname.includes("transaction.html")) {
            if (typeof updateTable === "function") updateTable(window.transactions);
        }
    }

    // 4. Handle Excel Upload
    const excelFileInput = document.getElementById("excelFile");
    if (excelFileInput) {
        excelFileInput.addEventListener("change", typeof loadExcel === "function" ? loadExcel : function(){});
    }
});

// Logout Function
function logout() {
    // We do NOT clear localStorage for 'transactions' here anymore, 
    // so data stays available for the next login!
    localStorage.removeItem("username"); 
    
    // Safely remove cookie
    if (typeof Cookies !== "undefined") {
        Cookies.remove("loggedIn");
    }
    
    window.location.href = "login.html";
}