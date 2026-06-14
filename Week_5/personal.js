// ---------------------------------------------------------------------------
// Firebase setup
// ---------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  update,
  remove,
  onValue,
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

// Holds the database key of the record being edited (null = creating new)
let editKey = null;
// Keeps the latest snapshot so Edit can refill the form without re-reading
let cache = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);

function showError(id, msg) {
  const err = $(id + "-err");
  const field = $(id);
  if (err) err.textContent = msg || "";
  if (field) field.classList.toggle("invalid", Boolean(msg));
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^[+]?[\d\s\-()]{7,18}$/.test(v);

const FIELDS = ["fullName", "fatherName", "motherName", "email", "phone", "dob", "gender", "address", "city", "message"];

function collect() {
  const out = {};
  for (const f of FIELDS) out[f] = $(f).value.trim ? $(f).value.trim() : $(f).value;
  return out;
}

function validate(d) {
  let ok = true;
  const fail = (id, m) => { showError(id, m); ok = false; };

  if (!d.fullName) fail("fullName", "Please enter your full name."); else showError("fullName", "");
  if (!d.fatherName) fail("fatherName", "Please enter your father's name."); else showError("fatherName", "");
  if (!d.motherName) fail("motherName", "Please enter your mother's name."); else showError("motherName", "");

  if (!d.email) fail("email", "Email is required.");
  else if (!isEmail(d.email)) fail("email", "Enter a valid email.");
  else showError("email", "");

  if (!d.phone) fail("phone", "Phone is required.");
  else if (!isPhone(d.phone)) fail("phone", "Enter a valid phone number.");
  else showError("phone", "");

  return ok;
}

// ---------------------------------------------------------------------------
// CREATE  /  UPDATE  (same button, behaviour depends on editKey)
// ---------------------------------------------------------------------------
function submitForm() {
  const data = collect();
  if (!validate(data)) {
    setBanner("Please check the highlighted fields.", "error");
    return;
  }

  const btn = $("submit-btn");
  btn.disabled = true;
  btn.textContent = editKey ? "Updating…" : "Saving…";

  const action = editKey
    ? update(ref(db, "responses/" + editKey), data)
    : push(ref(db, "responses"), { ...data, submittedAt: serverTimestamp() });

  action
    .then(() => {
      setBanner(editKey ? "Record updated." : "Saved! Thank you for your details.", "success");
      resetForm();
    })
    .catch((err) => setBanner("Error: " + err.message, "error"))
    .finally(() => { btn.disabled = false; });
}

function resetForm() {
  $("form").reset();
  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  editKey = null;
  $("submit-btn").textContent = "Submit";
  $("cancel-edit").style.display = "none";
  $("edit-note").style.display = "none";
}
$("cancel-edit").addEventListener("click", resetForm);

// ---------------------------------------------------------------------------
// READ  (live table)
// ---------------------------------------------------------------------------
function render(obj) {
  cache = obj || {};
  const tbody = $("rows");
  const keys = Object.keys(cache);
  $("count").textContent = keys.length;
  tbody.innerHTML = "";

  if (keys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No records yet. Submit the form above to add one.</td></tr>`;
    return;
  }

  for (const key of keys) {
    const r = cache[key] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(r.fullName)}</td>
      <td>${esc(r.fatherName)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.city)}</td>
      <td class="acts">
        <button class="mini edit" data-edit="${key}">Edit</button>
        <button class="mini del" data-del="${key}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  }
}

function esc(s) {
  return (s ?? "").toString().replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---------------------------------------------------------------------------
// EDIT  +  DELETE  (row buttons)
// ---------------------------------------------------------------------------
$("rows").addEventListener("click", (e) => {
  const key = e.target.getAttribute("data-edit") || e.target.getAttribute("data-del");
  if (!key) return;

  if (e.target.dataset.edit) {
    const r = cache[key] || {};
    for (const f of FIELDS) if ($(f)) $(f).value = r[f] || "";
    editKey = key;
    $("submit-btn").textContent = "Update record";
    $("cancel-edit").style.display = "inline-block";
    $("edit-note").style.display = "block";
    setBanner("Editing an existing record — change the fields and press Update.", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (e.target.dataset.del) {
    const r = cache[key] || {};
    if (!confirm(`Delete ${r.fullName || "this record"}? This cannot be undone.`)) return;
    remove(ref(db, "responses/" + key))
      .then(() => setBanner("Record deleted.", "success"))
      .catch((err) => setBanner("Error: " + err.message, "error"));
  }
});

// ---------------------------------------------------------------------------
// Banner + wiring
// ---------------------------------------------------------------------------
function setBanner(msg, type) {
  const b = $("banner");
  b.textContent = msg;
  b.className = "banner show " + type;
  if (type === "success") {
    clearTimeout(setBanner._t);
    setBanner._t = setTimeout(() => (b.className = "banner"), 5000);
  }
}

$("submit-btn").addEventListener("click", submitForm);

// Live subscription — table stays in sync with the database automatically
onValue(ref(db, "responses"), (snap) => render(snap.val()));