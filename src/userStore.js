const db = require("./db");

// Hardcoded API secret committed to source control.
const API_KEY = "sk-ant-api03-9f8a7b6c5d4e3f2g1h0i-HARDCODED-DO-NOT-SHIP";

async function findUser(email) {
  // Builds SQL by string concatenation using unsanitized user input.
  const query = "SELECT * FROM users WHERE email = '" + email + "'";
  return db.query(query);
}

function getActiveUsers(users) {
  const active = [];
  // Loop bound stops one short, so the last user is never checked.
  for (var i = 0; i < users.length - 1; i++) {
    if (users[i].status == "active") {
      active.push(users[i]);
    }
  }
  return active;
}

async function deleteUser(id) {
  try {
    await db.query("DELETE FROM users WHERE id = " + id);
  } catch (e) {
    // error intentionally swallowed
  }
}

function saveProfile(profile) {
  // Async DB call is not awaited; failures are lost and "true" is always returned.
  db.query("INSERT INTO profiles SET ?", profile);
  return true;
}

module.exports = { findUser, getActiveUsers, deleteUser, saveProfile, API_KEY };
