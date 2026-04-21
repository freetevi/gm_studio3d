const loginCard = document.getElementById("login-card");
const panelCard = document.getElementById("panel-card");

const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginMessage = document.getElementById("login-message");

const itemForm = document.getElementById("item-form");
const itemCategory = document.getElementById("item-category");
const itemTitle = document.getElementById("item-title");
const itemFile = document.getElementById("item-file");
const itemImage = document.getElementById("item-image");
const itemMessage = document.getElementById("item-message");

const logoutBtn = document.getElementById("logout-btn");

function setLoggedInUI(loggedIn) {
  loginCard.classList.toggle("hidden", loggedIn);
  panelCard.classList.toggle("hidden", !loggedIn);
}

async function checkSession() {
  if (!window.sb) {
    loginMessage.textContent = "Configure o Supabase em supabase.config.js";
    setLoggedInUI(false);
    return;
  }

  const { data, error } = await window.sb.auth.getSession();
  if (error) {
    loginMessage.textContent = "Erro ao validar sessao.";
    setLoggedInUI(false);
    return;
  }

  setLoggedInUI(Boolean(data.session));
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  if (!window.sb) {
    loginMessage.textContent = "Supabase nao configurado.";
    return;
  }

  const { error } = await window.sb.auth.signInWithPassword({
    email: loginEmail.value.trim(),
    password: loginPassword.value
  });

  if (error) {
    loginMessage.textContent = error.message || "Falha no login.";
    return;
  }

  loginPassword.value = "";
  setLoggedInUI(true);
});

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  itemMessage.textContent = "";

  if (!window.sb) {
    itemMessage.textContent = "Supabase nao configurado.";
    return;
  }

  const payload = {
    category: itemCategory.value,
    title: itemTitle.value.trim(),
    image_url: itemImage.value.trim()
  };

  if (!payload.category || !payload.title) {
    itemMessage.textContent = "Preencha categoria e nome.";
    return;
  }

  const selectedFile = itemFile.files?.[0];
  if (!payload.image_url && !selectedFile) {
    itemMessage.textContent = "Envie um arquivo ou informe uma URL da imagem.";
    return;
  }

  if (selectedFile) {
    const ext = (selectedFile.name.split(".").pop() || "jpg").toLowerCase();
    const safeCategory = payload.category.replace(/[^a-z0-9-]/gi, "");
    const fileName = `${safeCategory}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await window.sb.storage
      .from("catalogo")
      .upload(fileName, selectedFile, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      itemMessage.textContent = uploadError.message || "Falha ao enviar imagem.";
      return;
    }

    const { data: publicData } = window.sb.storage.from("catalogo").getPublicUrl(fileName);
    payload.image_url = publicData?.publicUrl || "";
  }

  if (!payload.image_url) {
    itemMessage.textContent = "Nao foi possivel obter URL da imagem.";
    return;
  }

  const { error } = await window.sb.from("catalog_items").insert(payload);

  if (error) {
    itemMessage.textContent = error.message || "Nao foi possivel salvar.";
    return;
  }

  itemTitle.value = "";
  itemImage.value = "";
  itemFile.value = "";
  itemMessage.textContent = "Item salvo com sucesso.";
});

logoutBtn.addEventListener("click", async () => {
  if (window.sb) {
    await window.sb.auth.signOut();
  }
  setLoggedInUI(false);
});

checkSession();
