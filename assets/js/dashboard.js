
document.addEventListener("DOMContentLoaded", function() {
    let currentDate = new Date();
    let monthYear = currentDate.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthYear = monthYear.replace(' ', '-');
    
    let filteredData = jsonData.find(row => row["MONTH & YEAR"] === monthYear);
    
    if (filteredData) {
        document.getElementById("remainingPrincipal").textContent = filteredData["PRINCIPLE BALANCE"];
        document.getElementById("totalSocietyCutting").textContent = filteredData["TOTAL SOC CUTTING"];
        document.getElementById("actualCutting").textContent = filteredData["ACTUAL SOC CUTTING"];
        document.getElementById("difference").textContent = filteredData["DIFFERENCE"];
    }
    
    let sumTotalSociety = jsonData.reduce((sum, row) => sum + (row["TOTAL SOC CUTTING"] || 0), 0);
    let sumActualCutting = jsonData.reduce((sum, row) => sum + (row["ACTUAL SOC CUTTING"] || 0), 0);
    let sumDifference = jsonData.reduce((sum, row) => sum + (row["DIFFERENCE"] || 0), 0);
    
    document.getElementById("sumTotalSociety").textContent = sumTotalSociety;
    document.getElementById("sumActualCutting").textContent = sumActualCutting;
    document.getElementById("sumDifference").textContent = sumDifference;
    
    document.getElementById("loanClosure").textContent = jsonData[jsonData.length - 1]["MONTH & YEAR"];
    
    document.getElementById("loanTable").innerHTML = jsonData.map(row => 
        `<tr>
            <td>${row["MONTH & YEAR"]}</td>
            <td>${row["PRINCIPLE BALANCE"]}</td>
            <td>${row["MONTHLY INTEREST"]}</td>
            <td>${row["TOTAL SOC CUTTING"]}</td>
            <td>${row["ACTUAL SOC CUTTING"]}</td>
            <td>${row["DIFFERENCE"]}</td>
        </tr>`
    ).join('');
});
