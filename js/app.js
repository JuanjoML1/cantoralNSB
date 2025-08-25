// -------- Utilidades --------

// Quita acentos y pasa a minúsculas para búsqueda robusta.
function norm(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Ordenadores
const sorters = {
  "title-asc": (a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
  "number-asc": (a, b) => (a.number ?? Infinity) - (b.number ?? Infinity),
  "number-desc": (a, b) => (b.number ?? -Infinity) - (a.number ?? -Infinity)
};

// -------- Elementos del DOM --------
const listaEl = document.getElementById("lista");
const buscadorEl = document.getElementById("buscador");
const sectionSel = document.getElementById("filter-section");
const groupSel = document.getElementById("filter-group");
const sortSel = document.getElementById("sort");

let SONGS = []; // se cargará desde JSON

// -------- Render principal --------
function render() {
  const q = norm(buscadorEl.value);
  const selSection = sectionSel.value; // 'all' o una sección
  const selGroup = groupSel.value;     // 'all' o un grupo
  const sorter = sorters[sortSel.value] || sorters["title-asc"];

  // Filtra
  const filtered = SONGS.filter(song => {
    const inGroup = selGroup === "all" || song.group === selGroup;
    const inSection = selSection === "all" || (song.sections || []).includes(selSection);

    // Búsqueda en título + keywords
    const haystack = norm(song.title + " " + (song.keywords || []).join(" "));
    const matchesText = q === "" || haystack.includes(q);

    return inGroup && inSection && matchesText;
  }).sort(sorter);

  // Pinta la lista
  listaEl.innerHTML = "";
  for (const s of filtered) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s.file;
    // Si quieres mostrar el número delante cuando exista:
    a.textContent = (s.number ? `${s.number} · ` : "") + s.title;
    li.appendChild(a);
    listaEl.appendChild(li);
  }
}

// -------- Construye selects (secciones y grupos) a partir del JSON --------
function buildFilters(data) {
  const sections = new Set();
  const groups = new Set();
  data.forEach(s => {
    (s.sections || []).forEach(sec => sections.add(sec));
    if (s.group) groups.add(s.group);
  });

  // Rellena secciones
  for (const sec of Array.from(sections).sort()) {
    const opt = document.createElement("option");
    opt.value = sec;
    opt.textContent = capitalize(sec);
    sectionSel.appendChild(opt);
  }

  // Rellena grupos
  for (const grp of Array.from(groups).sort()) {
    const opt = document.createElement("option");
    opt.value = grp;
    opt.textContent = grp;
    groupSel.appendChild(opt);
  }
}

function capitalize(s) {
  return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
}

// -------- Eventos --------
[buscadorEl, sectionSel, groupSel, sortSel].forEach(el => {
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

// -------- Carga del JSON --------
fetch("canciones.json")
  .then(r => r.json())
  .then(data => {
    SONGS = data;
    buildFilters(SONGS);
    render();
  })
  .catch(err => {
    console.error("Error cargando canciones.json:", err);
    listaEl.innerHTML = "<li>⚠️ No se pudo cargar la lista de canciones.</li>";
  });
