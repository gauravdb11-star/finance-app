document.addEventListener("DOMContentLoaded", function () {
    const profileBtn = document.getElementById("profileButton");
    const dropdown = document.getElementById("profileDropdown");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const logoutBtn = document.getElementById("logoutBtn");

    // Prevent error by checking if elements exist
    if (!profileBtn || !dropdown || !usernameDisplay || !logoutBtn) return;

    // Load Username from Local Storage
    const storedUsername = localStorage.getItem("username") || "Guest";
    usernameDisplay.innerText = storedUsername;

    // Toggle Dropdown on Profile Button Click
    profileBtn.addEventListener("click", function (event) {
        const isVisible = dropdown.style.display === "block";
        dropdown.style.display = isVisible ? "none" : "block";
        event.stopPropagation(); // Prevents closing when clicking inside dropdown
    });

    // Close Dropdown When Clicking Outside
    document.addEventListener("click", function (event) {
        if (!profileBtn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.style.display = "none";
        }
    });

    // Use the logout function defined in app.js
    logoutBtn.addEventListener("click", logout);
});