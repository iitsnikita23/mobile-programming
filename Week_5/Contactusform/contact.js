// ---------------------------------------------------------------------------
// Firebase setup
// ---------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6NXJDSCI6FsuH_E1oOeoQUsIYe9hXLjk",
  authDomain: "smartcart-6cea7.firebaseapp.com",
  databaseURL: "https://smartcart-6cea7-default-rtdb.firebaseio.com",
  projectId: "smartcart-6cea7",
  storageBucket: "smartcart-6cea7.firebasestorage.app",
  messagingSenderId: "415384301478",
  appId: "1:415384301478:web:e7b32bd5ba8ca229236967",
  measurementId: "G-KYJXNCV0JQ",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

function showError(id, message) {
  const err = $(id + "-err");
  const field = $(id);
  if (err) err.textContent = message || "";
  if (field) field.classList.toggle("invalid", Boolean(message));
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isPhone(v) {
  // optional, but if filled must look like a phone (7-15 digits, + and spaces ok)
  return /^[+]?[\d\s\-()]{7,18}$/.test(v);
}

// ---------------------------------------------------------------------------
// Validation — returns true when the whole form is valid
// ---------------------------------------------------------------------------
function validate(data) {
  let ok = true;
  const fail = (id, msg) => { showError(id, msg); ok = false; };

  if (!data.firstName) fail("firstName", "First name is required.");
  else showError("firstName", "");

  if (!data.lastName) fail("lastName", "Last name is required.");
  else showError("lastName", "");

  if (!data.email) fail("email", "Email is required.");
  else if (!isEmail(data.email)) fail("email", "Enter a valid email address.");
  else showError("email", "");

  if (data.phone && !isPhone(data.phone)) fail("phone", "Enter a valid phone number.");
  else showError("phone", "");

  if (!data.country) fail("country", "Please select your country.");
  else showError("country", "");

  if (!data.inquiryType) fail("inquiryType", "Please choose an inquiry type.");
  else showError("inquiryType", "");

  if (!data.subject) fail("subject", "Subject is required.");
  else showError("subject", "");

  if (!data.message || data.message.length < 10)
    fail("message", "Message must be at least 10 characters.");
  else showError("message", "");

  if (!data.consent) fail("consent", "Please agree before sending.");
  else showError("consent", "");

  return ok;
}

// ---------------------------------------------------------------------------
// Read all 10 fields from the form
// ---------------------------------------------------------------------------
function collect() {
  return {
    firstName: $("firstName").value.trim(),
    lastName: $("lastName").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
    company: $("company").value.trim(),
    country: $("country").value,
    inquiryType: $("inquiryType").value,
    subject: $("subject").value.trim(),
    contactMethod: (document.querySelector('input[name="contactMethod"]:checked') || {}).value || "Email",
    message: $("message").value.trim(),
    consent: $("consent").checked,
  };
}

// ---------------------------------------------------------------------------
// Submit -> push to Firebase
// ---------------------------------------------------------------------------
function submitForm() {
  const data = collect();
  if (!validate(data)) {
    setBanner("Please fix the highlighted fields.", "error");
    return;
  }

  const btn = $("submit-btn");
  btn.disabled = true;
  btn.textContent = "Sending…";

  // push() creates a unique key under "contacts" for every submission
  push(ref(db, "contacts"), {
    ...data,
    submittedAt: serverTimestamp(),
  })
    .then(() => {
      setBanner("Thanks! Your message has been sent. We'll be in touch.", "success");
      resetForm();
    })
    .catch((err) => {
      setBanner("Something went wrong: " + err.message, "error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = "Send message";
    });
}

function resetForm() {
  ["firstName", "lastName", "email", "phone", "company", "country",
   "inquiryType", "subject", "message"].forEach((id) => { if ($(id)) $(id).value = ""; });
  const email = document.querySelector('input[name="contactMethod"][value="Email"]');
  if (email) email.checked = true;
  if ($("consent")) $("consent").checked = false;
  if ($("char-count")) $("char-count").textContent = "0 / 1000";
  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function setBanner(message, type) {
  const b = $("form-banner");
  b.textContent = message;
  b.className = "banner show " + type;
  if (type === "success") {
    clearTimeout(setBanner._t);
    setBanner._t = setTimeout(() => (b.className = "banner"), 5000);
  }
}

// Wire up the button (no <form> submit reload)
$("submit-btn").addEventListener("click", submitForm);

// Live character counter for the message field
$("message").addEventListener("input", (e) => {
  $("char-count").textContent = e.target.value.length + " / 1000";
});