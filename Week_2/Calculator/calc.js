function calculate(operator) {
    let num1 = Number(document.getElementById("num1").value);
    let num2 = Number(document.getElementById("num2").value);
    let result;

    if (isNaN(num1) || isNaN(num2)) {
        document.getElementById("result").innerText = "Result: Enter valid numbers";
        return;
    }

    if (operator === '+') {
        result = num1 + num2;
    }
    else if (operator === '-') {
        result = num1 - num2;
    }
    else if (operator === '*') {
        result = num1 * num2;
    }
    else if (operator === '/') {
        if (num2 === 0) {
            document.getElementById("result").innerText = "Result: Cannot divide by zero";
            return;
        }
        result = num1 / num2;
    }
    else if (operator === '%') {
        result = num1 % num2;
    }

    document.getElementById("result").innerText = "Result: " + result;
}