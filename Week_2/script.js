function calculate() {

    // get values
    var english = Number(document.getElementById('english').value);
    var math = Number(document.getElementById('math').value);
    var science = Number(document.getElementById('science').value);
    var social = Number(document.getElementById('social').value);
    var computer = Number(document.getElementById('computer').value);
    var nepali = Number(document.getElementById('nepali').value);
    var account = Number(document.getElementById('account').value);
    var economics = Number(document.getElementById('economics').value);

    // total
    var total = english + math + science + social + computer + nepali + account + economics;

    var division = "";
    var color = "black";

    // condition
    if (total > 700) {
        division = "Distinction";
        color = "green";
    } 
    else if (total > 600) {
        division = "First Division";
    } 
    else if (total > 500) {
        division = "Second Division";
    } 
    else if (total > 400) {
        division = "Third Division";
    } 
    else {
        division = "Fail";
        color = "red";
    }

    // display result
    var result = document.getElementById("result");
    result.innerHTML = "Total Marks = " + total + "<br>" + division;
    result.style.color = color;
}