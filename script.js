const revealElements = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

revealElements.forEach((el) => observer.observe(el));

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

let catalogData = {};
const categoryTitle = {
  "action-figure": "Action Figure",
  "chaveiros": "Chaveiros",
  "articulados": "Modelos Articulados",
  "interiores": "Design de Interiores",
  "luminarias": "Luminarias",
  "organizadores": "Organizadores"
};

const caseCards = document.querySelectorAll(".case-card[data-category]");
const catalogTitle = document.getElementById("catalog-title");
const catalogSubtitle = document.getElementById("catalog-subtitle");
const catalogGrid = document.getElementById("catalog-grid");

function renderCatalog(categoryKey) {
  const entry = catalogData[categoryKey];
  if (!entry || !catalogGrid || !catalogTitle || !catalogSubtitle) {
    return;
  }

  caseCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.category === categoryKey);
  });

  catalogTitle.textContent = categoryTitle[categoryKey] || categoryKey;
  catalogSubtitle.textContent = `${entry.items.length} modelos nessa categoria.`;

  catalogGrid.innerHTML = "";
  entry.items.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "catalog-item";
    figure.innerHTML = `
      <img src="${item.image}" alt="${item.label}" loading="lazy" />
      <figcaption>${item.label}</figcaption>
    `;
    catalogGrid.appendChild(figure);
  });
}

caseCards.forEach((card) => {
  const categoryKey = card.dataset.category;
  card.addEventListener("click", () => renderCatalog(categoryKey));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      renderCatalog(categoryKey);
    }
  });
});

async function loadCatalogFromApi() {
  try {
    const response = await fetch("/api/catalog");
    const apiCatalog = await response.json();
    catalogData = Object.fromEntries(
      Object.entries(apiCatalog).map(([key, items]) => [key, { items }])
    );
  } catch {
    catalogData = {};
  }

  const firstCategory = caseCards[0]?.dataset.category;
  if (firstCategory) {
    renderCatalog(firstCategory);
  }
}

loadCatalogFromApi();
