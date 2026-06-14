import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

  const firebaseConfig = {
    apiKey: "AIzaSyC6NXJDSCI6FsuH_E1oOeoQUsIYe9hXLjk",
    authDomain: "smartcart-6cea7.firebaseapp.com",
    databaseURL: "https://smartcart-6cea7-default-rtdb.firebaseio.com",
    projectId: "smartcart-6cea7",
    storageBucket: "smartcart-6cea7.firebasestorage.app",
    messagingSenderId: "415384301478",
    appId: "1:415384301478:web:e7b32bd5ba8ca229236967",
    measurementId: "G-KYJXNCV0JQ"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ ONE clean function with 10 fields
function writeUserData(userId, firstname, lastname, email, age, phone, city, country, gender, occupation) {
    set(ref(db, 'users/' + userId), {
        firstname:  firstname,
        lastname:   lastname,
        email:      email,
        age:        age,
        phone:      phone,
        city:       city,
        country:    country,
        gender:     gender,
        occupation: occupation
    }).then(() => {
        console.log(`✅ User ${userId} - ${firstname} ${lastname} added!`);
    }).catch((error) => {
        console.error("Error:", error);
    });
}

// 10 Users
writeUserData(1,  "Nikita",  "Sharma",   "nikita@gmail.com",  21, "9801234567", "Kathmandu",  "Nepal", "Female", "Student");
writeUserData(2,  "Riya",    "Ojha",     "riya@gmail.com",    22, "9802345678", "Kanchanpur", "Nepal", "Female", "Teacher");
writeUserData(3,  "Saugat",  "Chand",    "saugat@gmail.com",  23, "9803456789", "Baitadi",    "Nepal", "Male",   "Engineer");
writeUserData(4,  "Unik",    "Bhandari", "unik@gmail.com",    20, "9804567890", "Kavre",      "Nepal", "Male",   "Nurse");
writeUserData(5,  "Abiral",  "Gurung",   "abiral@gmail.com",  25, "9805678901", "Butwal",     "Nepal", "Male",   "Doctor");
writeUserData(6,  "Maya",    "Tamang",   "maya@gmail.com",    19, "9806789012", "Dharan",     "Nepal", "Female", "Student");
writeUserData(7,  "Bikash",  "Shrestha", "bikash@gmail.com",  24, "9807890123", "Chitwan",    "Nepal", "Male",   "Developer");
writeUserData(8,  "Rajani",   "Shrestha", "rajani@gmail.com",   22, "9808901234", "Bhaktapur",  "Nepal", "Female", "Designer");
writeUserData(9,  "Suraj",   "Basnet",    "suraj@gmail.com",   26, "9809012345", "Hetauda",    "Nepal", "Male",   "Accountant");
writeUserData(10, "Mandila",   "Magar",   "mandila@gmail.com",   21, "9800123456", "Janakpur",   "Nepal", "Female", "Banker");