let balance = 10000;
let correctPIN = "1234";

function Deposit() {

    let amount = Number(document.getElementById("num1").value);

    // Check valid amount
    if (amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    // Check multiple of 100
    if (amount % 100 !== 0) {
        alert("Amount must be multiple of 100");
        return;
    }

    // Ask for PIN
    let pin = prompt("Enter PIN");

    if (pin === correctPIN) {

        balance = balance + amount;

        document.getElementById("balance").innerText = balance;

        alert("Deposit Successful");

    } else {
        alert("Incorrect PIN");
    }
}

function Withdraw() {

    let amount = Number(document.getElementById("num2").value);

    // Check valid amount
    if (amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    // Check multiple of 100
    if (amount % 100 !== 0) {
        alert("Amount must be multiple of 100");
        return;
    }

    // Check sufficient balance
    if (amount > balance) {
        alert("Insufficient Balance");
        return;
    }

    // Ask for PIN
    let pin = prompt("Enter PIN");

    if (pin === correctPIN) {

        balance = balance - amount;

        document.getElementById("balance").innerText = balance;

        alert("Withdrawal Successful");

    } else {
        alert("Incorrect PIN");
    }
}