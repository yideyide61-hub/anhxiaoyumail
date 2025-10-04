const API_BASE = "https://api.mail.tm";
let user = null;
let token = null;
let mailbox = null;

async function createAccount() {
  const random = Math.random().toString(36).substring(2, 10);
  const domainRes = await fetch(`${API_BASE}/domains`);
  const domains = await domainRes.json();
  const domain = domains["hydra:member"][0].domain;
  const address = `${random}@${domain}`;

  const password = "TempPass123!";
  const res = await fetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });

  if (res.ok) {
    user = { address, password };
    await login();
  }
}

async function login() {
  const res = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  const data = await res.json();
  token = data.token;
  document.getElementById("emailDisplay").innerText = user.address;
  document.getElementById("copyEmailBtn").style.display = "inline-block";
  fetchMessages();
}

async function fetchMessages() {
  const res = await fetch(`${API_BASE}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const container = document.getElementById("messages");
  container.innerHTML = "";

  if (data["hydra:member"].length === 0) {
    container.innerHTML = "<p>No messages yet...</p>";
    return;
  }

  data["hydra:member"].forEach(msg => {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `
      <div class="msg-header">
        <strong>${msg.from?.address || "Unknown"}</strong>
        <div class="msg-buttons">
          <button onclick="copyMessageLink('${msg.id}')">Copy Link</button>
          <button class="delete" onclick="deleteMessage('${msg.id}')">Delete</button>
        </div>
      </div>
      <p><strong>${msg.subject}</strong></p>
      <p>${msg.intro}</p>
    `;
    container.appendChild(div);
  });
}

async function deleteMessage(id) {
  await fetch(`${API_BASE}/messages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  fetchMessages();
}

function copyMessageLink(id) {
  const link = `${API_BASE}/messages/${id}`;
  navigator.clipboard.writeText(link);
  alert("Message link copied!");
}

document.getElementById("newEmailBtn").addEventListener("click", createAccount);

document.getElementById("copyEmailBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(user.address);
  alert("Email copied!");
});

// Auto-refresh inbox every 10 seconds
setInterval(() => {
  if (token) fetchMessages();
}, 10000);
