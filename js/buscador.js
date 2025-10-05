const buscador = document.getElementById("buscador");
const filtro = document.getElementById("filtro");
const items = document.querySelectorAll("li");

// Función para normalizar texto (quita tildes)
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")          // separa letras de los acentos
        .replace(/[\u0300-\u036f]/g, ""); // elimina los acentos
}

function filtrar() {
    const texto = normalizar(buscador.value);
    const tipo = filtro.value;

    items.forEach(li => {
        const titulo = normalizar(li.querySelector("a").textContent);
        const autor = normalizar(li.dataset.author || "");
        const momentos = (li.dataset.momento || "").toLowerCase().split(",").map(normalizar);
        const bib = normalizar(li.dataset.bib || "");
        const nold = li.dataset.nold || "";
        const nnew = normalizar(li.dataset.nnew || "");

        let mostrar = false;

        if(tipo === "titulo") {
            mostrar = titulo.includes(texto);
        } else if(tipo === "autor") {
            mostrar = autor.includes(texto);
        } else if(tipo === "momento") {
            mostrar = momentos.some(m => m.includes(texto));
        } else if(tipo === "bib") {
            mostrar = bib.includes(texto);
        } else if(tipo === "nold") {
            mostrar = nold.includes(texto);
        } else if(tipo === "nnew") {
            mostrar = nnew.includes(texto);
        } else if(tipo === "todos") {
            mostrar = titulo.includes(texto) ||
                      autor.includes(texto) ||
                      momentos.some(m => m.includes(texto)) ||
                      bib.includes(texto) ||
                      nold.includes(texto) ||
                      nnew.includes(texto);
        }

        li.style.display = mostrar ? "" : "none";
    });

    document.querySelectorAll("ul.lista").forEach(ul => {
        const visibles = ul.querySelectorAll("li:not([style*='display: none'])").length;
        if (visibles === 0) {
            ul.style.display = "none";
            if (ul.previousElementSibling && ul.previousElementSibling.tagName === "H2") {
                ul.previousElementSibling.style.display = "none";
            }
        } else {
            ul.style.display = "";
            if (ul.previousElementSibling && ul.previousElementSibling.tagName === "H2") {
                ul.previousElementSibling.style.display = "";
            }
        }
    });
}

buscador.addEventListener("keyup", filtrar);
filtro.addEventListener("change", filtrar);
