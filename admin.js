const loginCard = document.getElementById("login-card");
const panelCard = document.getElementById("panel-card");

const loginForm = document.getElementById("login-form");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginMessage = document.getElementById("login-message");

const itemForm = document.getElementById("item-form");
const itemCategory = document.getElementById("item-category");
const itemTitle = document.getElementById("item-title");
const itemImage = document.getElementById("item-image");
const itemMessage = document.getElementById("item-message");

const logoutBtn = document.getElementById("logout-btn");

function setLoggedInUI(loggedIn) {
  loginCard.classList.toggle("hidden", loggedIn);
  panelCard.classList.toggle("hidden", !loggedIn);
}

async function checkSession() {
  try {
    const response = await fetch("/api/admin/me", { credentials: "include" });
    setLoggedInUI(response.ok);
  } catch {
    setLoggedInUI(false);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginUsername.value.trim(),
        password: loginPassword.value
      })
    });

    const result = await response.json();
    if (!response.ok) {
      loginMessage.textContent = result.message || "Falha no login.";
      return;
    }

    loginPassword.value = "";
    setLoggedInUI(true);
  } catch {
    loginMessage.textContent = "Erro de conexao no login.";
  }
});

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  itemMessage.textContent = "";

  try {
    const response = await fetch("/api/admin/items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: itemCategory.value,
        title: itemTitle.value.trim(),
        image: itemImage.value.trim()
      })
    });

    const result = await response.json();
    if (!response.ok) {
      itemMessage.textContent = result.message || "Nao foi possivel salvar.";
      return;
    }

    itemTitle.value = "";
    itemImage.value = "";
    itemMessage.textContent = "Item salvo com sucesso.";
  } catch {
    itemMessage.textContent = "Erro de conexao ao salvar item.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
  setLoggedInUI(false);
});

checkSession();
