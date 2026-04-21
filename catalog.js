const categoryTitle = {
  "action-figure": "Action Figure",
  chaveiros: "Chaveiros",
  articulados: "Modelos Articulados",
  interiores: "Design de Interiores",
  luminarias: "Luminarias",
  organizadores: "Organizadores"
};

const params = new URLSearchParams(window.location.search);
const category = params.get("cat") || "action-figure";

const catalogTitle = document.getElementById("catalog-title");
const catalogSubtitle = document.getElementById("catalog-subtitle");
const catalogGrid = document.getElementById("catalog-grid");

function renderItems(items) {
  catalogGrid.innerHTML = "";

  if (!items || items.length === 0) {
    catalogSubtitle.textContent = "Nenhum item cadastrado ainda nessa categoria.";
    return;
  }

  catalogSubtitle.textContent = `${items.length} modelos nessa categoria.`;

  items.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "catalog-item";
    figure.innerHTML = `
      <img src="${item.image}" alt="${item.label}" loading="lazy" />
      <figcaption>${item.label}</figcaption>
    `;
    catalogGrid.appendChild(figure);
  });
}

async function loadCatalog() {
  catalogTitle.textContent = categoryTitle[category] || "Categoria";

  if (!window.sb) {
    catalogSubtitle.textContent = "Configure o Supabase em supabase.config.js.";
    return;
  }

  const { data, error } = await window.sb
    .from("catalog_items")
    .select("title, image_url")
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    catalogSubtitle.textContent = "Erro ao carregar catalogo.";
    return;
  }

  const normalized = (data || []).map((item) => ({
    label: item.title,
    image: item.image_url
  }));

  renderItems(normalized);
}

loadCatalog();
