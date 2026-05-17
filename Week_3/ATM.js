$(document).ready(function () {

    let balance = 10000;
    let correctPIN = "1234";
    let actionType = "";

    // Show input section when clicking deposit or withdraw
    $("#showDeposit").click(function () {
        $("#inputSection").removeClass("hidden");
        actionType = "deposit";
    });

    $("#showWithdraw").click(function () {
        $("#inputSection").removeClass("hidden");
        actionType = "withdraw";
    });

    // Deposit logic
    $("#depositBtn").click(function () {
        let amount = Number($("#amount").val());

        if (amount <= 0 || amount % 100 !== 0) {
            alert("Enter valid amount (multiple of 100)");
            return;
        }

        let pin = prompt("Enter PIN:");

        if (pin === correctPIN) {
            balance += amount;
            updateBalance();
            alert("Deposit Successful");
        } else {
            alert("Wrong PIN");
        }
    });

    // Withdraw logic
    $("#withdrawBtn").click(function () {
        let amount = Number($("#amount").val());

        if (amount <= 0 || amount % 100 !== 0) {
            alert("Enter valid amount (multiple of 100)");
            return;
        }

        if (amount > balance) {
            alert("Insufficient Balance");
            return;
        }

        let pin = prompt("Enter PIN:");

        if (pin === correctPIN) {
            balance -= amount;
            updateBalance();
            alert("Withdraw Successful");
        } else {
            alert("Wrong PIN");
        }
    });

    // Update balance display
    function updateBalance() {
        $("#balance").text(balance);
    }

    // Eye icon toggle
    $("#eyeIcon").click(function () {

        if ($("#balance").hasClass("hidden")) {
            $("#balance").removeClass("hidden");
            $("#hiddenText").addClass("hidden");
            $("#eyeIcon").text("👁️"); // open eye
        } else {
            $("#balance").addClass("hidden");
            $("#hiddenText").removeClass("hidden");
            $("#eyeIcon").text("🙈"); // closed eye
        }
    });

});