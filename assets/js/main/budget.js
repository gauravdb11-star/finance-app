window.updateBudget = function(cycleData) {
    if (!document.getElementById("safeToSpendTxt")) return; // Only run on budget.html

    // 1. YOUR DICTIONARY
    const NEEDS = ["HOME LOAN", "HOSPITAL", "FOOD", "INSURANCE", "CREDIT CARD", "RENT", "GROCERIES", "UTILITIES", "BILLS", "EMI", "SOCIETY", "MEDICAL", "TRANSPORT", "FUEL"];
    const WANTS = ["MOVIE", "RECHARGE", "TRAVEL", "MISC", "DINING", "ENTERTAINMENT", "SHOPPING", "SUBSCRIPTIONS", "ZOMATO", "SWIGGY"];
    const SAVINGS = ["INVESTMENT", "STOCKS", "MUTUAL FUNDS", "SAVINGS", "PPF", "FD"];

    let spentNeeds = 0, spentWants = 0, spentSavings = 0, maxDeposit = 0;
    
    // Subcategory trackers
    let breakdown = { needs: {}, wants: {}, savings: {} };

    // 2. SCAN AND SORT DATA
    if (cycleData && cycleData.length > 0) {
        cycleData.forEach(row => {
            let deposit = parseFloat(row["Deposit Amt."] || 0);
            let withdrawal = parseFloat(row["Withdrawal Amt."] || 0);
            let cat = (row.Category || "UNCATEGORIZED").toString().toUpperCase();

            if (deposit > maxDeposit) maxDeposit = deposit;

            if (withdrawal > 0) {
                if (NEEDS.includes(cat)) {
                    spentNeeds += withdrawal;
                    breakdown.needs[cat] = (breakdown.needs[cat] || 0) + withdrawal;
                } else if (WANTS.includes(cat) || cat === "UNCATEGORIZED") {
                    spentWants += withdrawal;
                    let displayCat = cat === "UNCATEGORIZED" ? "MISC" : cat;
                    breakdown.wants[displayCat] = (breakdown.wants[displayCat] || 0) + withdrawal;
                } else if (SAVINGS.includes(cat)) {
                    spentSavings += withdrawal;
                    breakdown.savings[cat] = (breakdown.savings[cat] || 0) + withdrawal;
                }
            }
        });
    }

    // 3. CORE 60-30-10 MATH
    let totalIncome = maxDeposit > 0 ? maxDeposit : 1; 
    let limitNeeds = totalIncome * 0.60;
    let limitWants = totalIncome * 0.30;
    let limitSavings = totalIncome * 0.10;

    let pctNeeds = (spentNeeds / limitNeeds) * 100;
    let pctWants = (spentWants / limitWants) * 100;
    let pctSavings = (spentSavings / limitSavings) * 100;

    const formatMoney = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

    // 4. DAILY BURN RATE MATH
    let daysLeftInCycle = 30; // Default
    const today = new Date();
    
    if (cycleData.length > 0) {
        let lastRowDateStr = cycleData[0].Date; 
        if (lastRowDateStr && lastRowDateStr.includes('-')) {
            let parts = lastRowDateStr.split('-');
            let cycleYear = parseInt(parts[2], 10);
            let cycleMonth = parseInt(parts[1], 10) - 1;
            
            let cycleEnd = new Date(cycleYear, cycleMonth + 1, 0); 
            let diffTime = cycleEnd - today;
            let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0 && diffDays <= 31) daysLeftInCycle = diffDays;
            else if (diffDays <= 0) daysLeftInCycle = 1; 
        }
    }

    let remainingWants = Math.max(0, limitWants - spentWants);
    let dailySafeSpend = remainingWants / daysLeftInCycle;

    // --- 5. UPDATE THE UI ---
    
    // Top Hero Cards
    document.getElementById("safeToSpendTxt").textContent = `₹${formatMoney(dailySafeSpend)}`;
    document.getElementById("cycleDaysTxt").textContent = `Based on ${daysLeftInCycle} days remaining in current cycle`;

    // AI Insight Generator
    let insightStr = "";
    if (pctWants > 95) {
        insightStr = `⚠️ Stop! You have used ${pctWants.toFixed(0)}% of your Wants budget. You need to stick to absolutely zero fun spending for the next few days.`;
    } else if (pctNeeds > 100) {
        insightStr = `🚨 Warning: Your essential bills exceeded 60% of your income. You will need to borrow from your Savings to cover the deficit.`;
    } else if (pctSavings >= 100) {
        insightStr = `🎉 Incredible! You already hit your 10% investing goal for this cycle. Anything extra you save now is pure wealth building.`;
    } else if (dailySafeSpend > 1000) {
        insightStr = `🍷 Looking good! You have a massive ₹${formatMoney(dailySafeSpend)} a day to spend on food, shopping, and entertainment. Enjoy yourself!`;
    } else {
        insightStr = `✅ You are pacing perfectly. Stick to ₹${formatMoney(dailySafeSpend)} a day and you will hit all your financial goals this month.`;
    }
    document.getElementById("insightTxt").textContent = insightStr;

    // Main Battery Bars and Drill-Downs
    const updateBucket = (name, spent, limit, pct, breakdownObj, color) => {
        document.getElementById(`limit${name}Txt`).textContent = ` / ₹${formatMoney(limit)}`;
        document.getElementById(`spent${name}Txt`).textContent = `₹${formatMoney(spent)}`;
        document.getElementById(`${name.toLowerCase()}Pct`).textContent = `${Math.min(pct, 100).toFixed(0)}%`;
        
        let bar = document.getElementById(`bar${name}`);
        bar.style.width = `${Math.min(pct, 100)}%`;
        
        // Turn red if overspending (except Savings!)
        if (pct > 95 && name !== "Savings") {
            bar.style.background = "linear-gradient(90deg, #FF5733, #ff3b30)";
            bar.style.boxShadow = "0 0 10px rgba(255, 87, 51, 0.6)";
            document.getElementById(`${name.toLowerCase()}Pct`).style.color = "#FF5733";
        }

        // Render Heat Bars (Top 3 Subcategories)
        let listEl = document.getElementById(`${name.toLowerCase()}List`);
        listEl.innerHTML = "";
        
        let sortedItems = Object.entries(breakdownObj).sort((a, b) => b[1] - a[1]).slice(0, 3);
        
        if (sortedItems.length === 0) {
            listEl.innerHTML = `<div class="text-muted" style="font-size: 12px; text-align: center; padding: 10px;">No spending yet</div>`;
        } else {
            sortedItems.forEach(([catName, amount]) => {
                let subPct = Math.min((amount / limit) * 100, 100); // What % of the total bucket did this category eat?
                
                listEl.innerHTML += `
                    <div class="heat-bar-container">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span style="color:#E0E0E0; font-weight:600; font-size:12px;">${catName}</span>
                            <span style="color:#aaa; font-size:12px;">₹${formatMoney(amount)}</span>
                        </div>
                        <div class="progress mini-progress">
                            <div class="progress-bar" style="width: ${subPct}%; background-color: ${color};"></div>
                        </div>
                    </div>
                `;
            });
        }
    };

    // Trigger UI updates with base colors for the Heat Bars
    updateBucket("Needs", spentNeeds, limitNeeds, pctNeeds, breakdown.needs, "#0FA4AF");
    updateBucket("Wants", spentWants, limitWants, pctWants, breakdown.wants, "#FACC15");
    updateBucket("Savings", spentSavings, limitSavings, pctSavings, breakdown.savings, "#28A745");
};