// ---------------------------------------------------------------------------
// Firebase setup
// ---------------------------------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
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
// Small helpers (toast + field reading + validation)
// ---------------------------------------------------------------------------
function toast(message, type = "info") {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.className = "toast"), 3000);
}

function val(id) {
  return document.getElementById(id).value.trim();
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

// ---------------------------------------------------------------------------
// CREATE  /  overwrite-by-write
// ---------------------------------------------------------------------------
function writeUserData() {
  const userId = val("create-id");
  const name = val("create-name");
  const email = val("create-email");

  if (!userId) return toast("User ID is required.", "error");
  if (!name) return toast("Name is required.", "error");
  if (!isEmail(email)) return toast("Enter a valid email address.", "error");

  set(ref(db, "users/" + userId), { name, email })
    .then(() => {
      toast(`User "${userId}" saved.`, "success");
      document.getElementById("create-id").value = "";
      document.getElementById("create-name").value = "";
      document.getElementById("create-email").value = "";
    })
    .catch((err) => toast("Error saving user: " + err.message, "error"));
}
window.writeUserData = writeUserData;

// ---------------------------------------------------------------------------
// READ one by ID
// ---------------------------------------------------------------------------
function readUserById() {
  const userId = val("read-id");
  const out = document.getElementById("read-result");

  if (!userId) {
    out.textContent = "";
    return toast("Enter a User ID to read.", "error");
  }

  get(ref(db, "users/" + userId)).then((snapshot) => {
    if (!snapshot.exists()) {
      out.innerHTML = `<span class="muted">No user found for ID "${userId}".</span>`;
      return;
    }
    const user = snapshot.val();
    out.innerHTML = `<strong>${user.name}</strong> &middot; <span class="mono">${user.email}</span>`;
  });
}
window.readUserById = readUserById;

// ---------------------------------------------------------------------------
// UPDATE  (fetch into form, then save)
// ---------------------------------------------------------------------------
function fetchUserForUpdate() {
  const userId = val("update-id");
  if (!userId) return toast("Enter a User ID to fetch.", "error");

  get(ref(db, "users/" + userId)).then((snapshot) => {
    if (!snapshot.exists()) return toast(`No user found for ID "${userId}".`, "error");
    const user = snapshot.val();
    document.getElementById("update-name").value = user.name;
    document.getElementById("update-email").value = user.email;
    toast("User loaded into the form.", "info");
  });
}
window.fetchUserForUpdate = fetchUserForUpdate;

function updateUserData() {
  const userId = val("update-id");
  const name = val("update-name");
  const email = val("update-email");

  if (!userId) return toast("Enter a User ID to update.", "error");
  if (!name) return toast("Name is required.", "error");
  if (!isEmail(email)) return toast("Enter a valid email address.", "error");

  update(ref(db, "users/" + userId), { name, email })
    .then(() => toast(`User "${userId}" updated.`, "success"))
    .catch((err) => toast("Error updating user: " + err.message, "error"));
}
window.updateUserData = updateUserData;

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
function deleteUserData(idFromTable) {
  const userId = idFromTable || val("delete-id");
  if (!userId) return toast("Enter a User ID to delete.", "error");
  if (!confirm(`Delete user "${userId}"? This cannot be undone.`)) return;

  remove(ref(db, "users/" + userId))
    .then(() => {
      toast(`User "${userId}" deleted.`, "success");
      if (!idFromTable) document.getElementById("delete-id").value = "";
    })
    .catch((err) => toast("Error deleting user: " + err.message, "error"));
}
window.deleteUserData = deleteUserData;

// ---------------------------------------------------------------------------
// LIVE LIST  (real-time table that updates whenever the DB changes)
// ---------------------------------------------------------------------------
function renderUsers(usersObj) {
  const tbody = document.getElementById("users-body");
  const count = document.getElementById("user-count");
  tbody.innerHTML = "";

  const ids = usersObj ? Object.keys(usersObj) : [];
  count.textContent = ids.length;

  if (ids.length === 0) {
    tbody.innerHTML =
      `<tr><td colspan="4" class="muted center">No users yet. Add one above to get started.</td></tr>`;
    return;
  }

  for (const id of ids) {
    const u = usersObj[id] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${id}</td>
      <td>${u.name ?? ""}</td>
      <td class="mono">${u.email ?? ""}</td>
      <td class="row-actions">
        <button class="btn-ghost" data-edit="${id}">Edit</button>
        <button class="btn-danger" data-del="${id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  }
}

// Wire up the per-row buttons (event delegation)
document.getElementById("users-body").addEventListener("click", (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    document.getElementById("update-id").value = editId;
    fetchUserForUpdate();
    document.getElementById("update").scrollIntoView({ behavior: "smooth" });
  }
  if (delId) deleteUserData(delId);
});

// Subscribe once — table stays in sync with the database automatically.
onValue(ref(db, "users"), (snapshot) => renderUsers(snapshot.val()));