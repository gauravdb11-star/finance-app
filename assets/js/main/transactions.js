window.transactions = []; // Global scope

const CATEGORIES = [
    "SALARY", "INVESTMENT", "HOME LOAN", "INSURANCE", 
    "CREDIT CARD", "MOVIE", "RECHARGE", "HOSPITAL", 
    "TRAVEL", "FOOD", "MISC", "Uncategorized"
];

// --------------------------------------------------------
// NEW: Backup & Restore Functions
// --------------------------------------------------------
window.downloadBackup = function() {
    const data = localStorage.getItem("transactions");
    if (!data || data === "[]") {
        alert("No data to backup!");
        return;
    }

    // Create a downloadable JSON file
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Create an invisible link to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance_backup.json`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

function restoreBackup(file, event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (!Array.isArray(backupData)) throw new Error("Invalid backup format");

            window.transactions = backupData;
            localStorage.setItem("transactions", JSON.stringify(window.transactions));
            processTransactions();
            
            alert(`Dashboard successfully restored from backup! (${backupData.length} transactions)`);
            event.target.value = ""; 
        } catch (error) {
            alert("Error reading backup file. Make sure it is a valid JSON backup.");
        }
    };
    reader.readAsText(file);
}

// --------------------------------------------------------
// File Upload Handler (Handles both Excel and JSON Backup)
// --------------------------------------------------------
function loadExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    // If the user uploads a JSON backup file, route it to the restore function
    if (file.name.endsWith(".json")) {
        restoreBackup(file, event);
        return;
    }

    if (typeof XLSX === "undefined") {
        alert("Excel Library (SheetJS) is missing!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            let headerRowIndex = -1;
            for (let i = 0; i < rawData.length; i++) {
                if (rawData[i] && String(rawData[i][0]).trim() === "Date" && String(rawData[i][1]).includes("Narration")) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                alert("Could not find standard bank statement headers. Please check the file.");
                return;
            }

            let existingTransactions = JSON.parse(localStorage.getItem("transactions")) || [];
            let newTransactionsAdded = 0;
            let hasStartedTransactions = false;

            function isDuplicate(newTxn) {
                return existingTransactions.some(existing => 
                    existing.Date === newTxn.Date &&
                    existing.Narration === newTxn.Narration &&
                    existing["Withdrawal Amt."] === newTxn["Withdrawal Amt."] &&
                    existing["Deposit Amt."] === newTxn["Deposit Amt."] &&
                    existing["Closing Balance"] === newTxn["Closing Balance"]
                );
            }

            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                let row = rawData[i];
                if (!row || !row[0]) continue;
                
                let dateStr = String(row[0]).trim();

                if (dateStr.includes("***")) {
                    if (!hasStartedTransactions) continue;
                    else break;
                }

                if (hasStartedTransactions && !dateStr.includes("/")) break;
                hasStartedTransactions = true; 

                const narration = String(row[1] || "").trim();
                const withdrawal = parseFloat(row[4]) || 0;
                const deposit = parseFloat(row[5]) || 0;
                const closingBal = parseFloat(row[6]) || 0;

                const extractedData = parseNarration(narration);
                const category = autoCategorize(extractedData, deposit, withdrawal);

                let txn = {
                    "id": "txn_" + Date.now() + "_" + Math.floor(Math.random() * 10000), 
                    "Date": formatHDFCDate(dateStr), 
                    "Narration": narration,
                    "Name": extractedData.name,
                    "Reason": extractedData.reason,
                    "Withdrawal Amt.": withdrawal,
                    "Deposit Amt.": deposit,
                    "Closing Balance": closingBal,
                    "Category": category 
                };

                if (!isDuplicate(txn)) {
                    existingTransactions.push(txn);
                    newTransactionsAdded++;
                }
            }

            if (newTransactionsAdded === 0) {
                alert("No new transactions found. All entries in this file are already saved.");
                event.target.value = ""; 
                return;
            }

            window.transactions = existingTransactions;
            localStorage.setItem("transactions", JSON.stringify(window.transactions)); 
            processTransactions();
            
            alert(`Successfully added ${newTransactionsAdded} new transaction(s)!`);
            event.target.value = ""; 

        } catch (error) {
            console.error("Error processing Excel file:", error);
            alert("Error processing file. Press F12 to check the console for details.");
        }
    };
    reader.readAsArrayBuffer(file);
}

// --------------------------------------------------------
// Parsing & UI Logic (Unchanged from previous code)
// --------------------------------------------------------
function parseNarration(narration) {
    let parts = narration.split('-');
    let type = parts[0] ? parts[0].trim() : "";
    let name = "", reason = "";

    if (type === "UPI") {
        name = parts[1] ? parts[1].trim() : "";
        reason = parts.length >= 6 ? parts[parts.length - 1].trim() : "";
    } else if (type === "NEFT CR") {
        name = parts[2] ? parts[2].trim() : "";
        reason = parts[parts.length - 1] ? parts[parts.length - 1].trim() : "";
    } else if (type === "NWD") {
        name = parts[3] ? parts[3].trim() : "ATM";
        reason = "CASH WITHDRAWAL";
    } else if (type === "ACH D") {
        name = parts[1] ? parts[1].trim() : "";
        reason = "AUTO DEBIT";
    } else if (type === "POS") {
        name = parts[1] ? parts[1].trim() : "";
        reason = "CARD SWIPE";
    } else if (type === "IB BILLPAY DR") {
        name = parts[1] ? parts[1].trim() : "";
        reason = "BILL PAYMENT";
    } else if (type === "CASH DEPOSIT") {
        name = "SELF";
        reason = "CASH DEPOSIT";
    } else {
        name = narration; reason = "";
    }
    return { type, name, reason };
}

function formatHDFCDate(dateStr) {
    if (!dateStr) return "";
    let parts = dateStr.split('/');
    if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2].length === 2 ? "20" + parts[2] : parts[2]; 
        return `${day}-${month}-${year}`;
    }
    return String(dateStr); 
}

function autoCategorize(parsedData, depositAmt, withdrawalAmt) {
    const searchString = (parsedData.type + " " + parsedData.name + " " + parsedData.reason).toLowerCase();
    
    if (depositAmt > 0) {
        if (searchString.includes("sbin0000tbu") || searchString.includes("sbin0004266") || searchString.includes("salary")) return "SALARY";
        if (searchString.includes("interest") || searchString.includes("int pd") || searchString.includes("cash deposit") || searchString.includes("526099xxxxxx2755")) return "INVESTMENT"; 
        return "Uncategorized"; 
    }

    if (withdrawalAmt > 0) {
        if (searchString.includes("hdfc bank ltd") || searchString.includes("home loan")) return "HOME LOAN";
        if (searchString.includes("bajaj life") || searchString.includes("maxlifeinsura") || searchString.includes("insurance")) return "INSURANCE";
        if (searchString.includes("hdfc8e") || searchString.includes("credit card")) return "CREDIT CARD";
        if (searchString.includes("bigtree") || searchString.includes("movie")) return "MOVIE";
        
        const rechargeTerms = ["jio", "cable", "wifi", "duolingo", "bsnl", "google india digital", "google india service", "google play", "google pay", "recharge"];
        if (rechargeTerms.some(kw => searchString.includes(kw))) return "RECHARGE";

        const hospitalTerms = ["hospital", "medicine", "sonography", "blood test", "medical", "dugad", "ganesh chandrakant", "srs", "meghnad", "tata 1mg", "tap", "arihant", "shreeyash", "shriyash", "clinic"];
        if (hospitalTerms.some(kw => searchString.includes(kw))) return "HOSPITAL";

        const travelTerms = ["petrol", "taxi", "metro", "bus", "ticket", "bike", "fuel", "gawade petroleum", "indian oil", "express petro", "ola", "redbus", "bpcl ufill", "solanke", "mane", "survas", "pradip jotiram", "faridabano", "superitendent", "bangalore metro", "vitm", "indian railways", "sai automobiles", "d r gavane", "anteshwar"];
        if (travelTerms.some(kw => searchString.includes(kw))) return "TRAVEL";

        if (searchString.includes("gaurav dadarao bhaga") && !searchString.includes("sanjyoti")) return "INVESTMENT";

        const foodTerms = ["food", "breakfast", "idli", "milk", "gajaar", "carrot", "nasta", "vada pav", "vadapav", "juice", "panipuri", "fruit", "pav", "duudh", "samosa", "coconut", "bhaji", "vegetable", "bharatpe me", "shev", "canteen", "bhel", "sabji", "lunch", "dhokla", "chips", "hotel", "water", "snaks", "thali", "dinner", "egg", "pohe", "sweets", "dahi", "chiwda", "apple", "dal khichadi", "puri bhaji", "bottle", "dryfruits", "pizza", "taak", "bakery", "dosa", "swiggy", "zomato", "cake", "gawade patil", "south bites", "choudhary", "ashirwad", "mai wadewale", "shreeram", "amol fruit", "prem super market", "bikaner", "sahara", "avenue food", "parvathi", "gupta", "sameer", "punaram", "patil", "satp", "lakshman", "dattaraya", "hanumant", "akash", "dhanshree", "kalibai", "devknya", "sanju", "chaudhary", "bapu ashok", "kambl", "patrao", "ameer", "sachin kumar", "deepak singh", "vijayalakshmi", "harisha", "sanjay kumar", "kumaraswamy", "gfb", "kstdc", "jagdish", "venkateswara", "gokhana", "nilesh kumar", "pankaj", "shaiesta", "shrini", "mulla", "atikh", "prashant", "pradeep sweets", "nehere", "ganesh bhel", "mohan", "avate", "mahalaxmi", "poonam", "crown plaza", "pancham", "vedant", "mankar", "janata", "sayeeda", "shree narayan", "jijai"];
        if (foodTerms.some(kw => searchString.includes(kw))) return "FOOD";
        
        if (searchString.includes("nwd") || searchString.includes("atm")) return "MISC";
    }
    return "Uncategorized"; 
}

function processTransactions() {
    if (!window.transactions || window.transactions.length === 0) return;
    
    if (typeof updateFilters === "function") updateFilters();
    
    // Check if we are on the Dashboard (Calendar exists)
    if (typeof updateCalendarEvents === "function") {
        // Let the Calendar act as the Master Filter and update the tiles!
        updateCalendarEvents(window.transactions); 
    } else {
        // If we are on the Transactions or Society page, update normally
        if (typeof updateNetBalance === "function") updateNetBalance(window.transactions);
        if (typeof updateTable === "function") updateTable(window.transactions);
    }
}

window.updateCategory = function(txnId, newCategory) {
    const txn = window.transactions.find(t => t.id === txnId);
    if (txn) {
        txn.Category = newCategory;
        localStorage.setItem("transactions", JSON.stringify(window.transactions));
        processTransactions();
    }
};

function updateTable(filteredData = window.transactions) {
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("transactionTable");

    if (!tableBody || !tableHeader) return; 
    tableBody.innerHTML = "";
    const columnsToDisplay = ["Date", "Name", "Reason", "Withdrawal Amt.", "Deposit Amt.", "Category"];

    if (filteredData.length > 0) {
        tableHeader.innerHTML = `<tr>${columnsToDisplay.map(header => `<th>${header}</th>`).join('')}</tr>`;
        
        filteredData.forEach(row => {
            const isUncat = row.Category === "Uncategorized";
            const tr = document.createElement("tr");
            
            if (isUncat) tr.style.backgroundColor = "rgba(220, 53, 69, 0.2)";

            let html = "";
            columnsToDisplay.forEach(col => {
                if (col === "Category") {
                    let selectHtml = `<select class="form-control form-control-sm" onchange="updateCategory('${row.id}', this.value)" style="background-color: ${isUncat ? '#ffb3b3' : '#2A2A2A'}; color: ${isUncat ? '#000' : '#fff'}; border: 1px solid #555;">`;
                    CATEGORIES.forEach(cat => {
                        selectHtml += `<option value="${cat}" ${row.Category === cat ? 'selected' : ''}>${cat}</option>`;
                    });
                    selectHtml += `</select>`;
                    html += `<td>${selectHtml}</td>`;
                } else {
                    html += `<td>${row[col] !== undefined && row[col] !== null ? row[col] : ''}</td>`;
                }
            });
            tr.innerHTML = html;
            tableBody.appendChild(tr);
        });
    } else {
        tableHeader.innerHTML = "";
        tableBody.innerHTML = "<tr><td colspan='100%' class='text-center'>No transactions found for these filters.</td></tr>";
    }
}