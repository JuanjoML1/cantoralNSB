const buscador = document.getElementById("buscador");
const filtro = document.getElementById("filtro");
const items = document.querySelectorAll("#lista li");

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

        let mostrar = false;

        if(tipo === "titulo") {
            mostrar = titulo.includes(texto);
        } else if(tipo === "autor") {
            mostrar = autor.includes(texto);
        } else if(tipo === "momento") {
            mostrar = momentos.some(m => m.includes(texto));
        } else if(tipo === "bib") {
            mostrar = bib.includes(texto);
        } else if(tipo === "todos") {
            mostrar = titulo.includes(texto) ||
                      autor.includes(texto) ||
                      momentos.some(m => m.includes(texto)) ||
                      bib.includes(texto);
        }

        li.style.display = mostrar ? "" : "none";
    });
}

buscador.addEventListener("keyup", filtrar);
filtro.addEventListener("change", filtrar);
