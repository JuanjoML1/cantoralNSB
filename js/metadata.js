function obtenerValor(objeto, ruta) {
    return ruta.split(".").reduce(
        (valor, clave) => valor?.[clave],
        objeto
    );
}

// ============================================================
// CARGAR CAMPOS INDIVIDUALES
// ============================================================

function cargarCampos(elemento, datos) {
    // Textos
    elemento.querySelectorAll("[data-md]").forEach(el => {
        const valor = obtenerValor(datos, el.dataset.md);
        el.textContent = valor ?? "-";
    });
    // Enlaces
    const enlaces = [];
    if (elemento.matches("[data-md-href]")) {
        enlaces.push(elemento);
    }
    enlaces.push(...elemento.querySelectorAll("[data-md-href]"));
    enlaces.forEach(el => {
        const valor = obtenerValor(datos, el.dataset.mdHref);
        if (valor) {
            el.href = valor;
            el.style.removeProperty("display");
        } else {
            el.removeAttribute("href");
            el.style.display = "none";
        }
    });
}

// ============================================================
// CARGAR LISTAS DINÁMICAS
// ============================================================

function cargarListas(metadata) {
    document.querySelectorAll("[data-md-list]").forEach(lista => {
        const ruta = lista.dataset.mdList;
        const datos = obtenerValor(metadata, ruta);
        // Guardar todas las filas originales como plantilla
        const plantilla = Array.from(lista.children).map(
            elemento => elemento.cloneNode(true)
        );

        if (!Array.isArray(datos) || datos.length === 0) {
            lista.replaceChildren();
            lista.style.display = "none";
            return;
        }

        lista.style.removeProperty("display");
        lista.replaceChildren();
        // Crear un bloque completo de filas por cada edición
        datos.forEach((item, indice) => {
            plantilla.forEach((fila, posicion) => {
                const elemento = fila.cloneNode(true);
                if (indice > 0 && posicion === 0) {
                    elemento.classList.add("inicio-edicion");
                }
                cargarCampos(elemento, item);
                lista.appendChild(elemento);
            });
        });
    });
}

// ============================================================
// CARGAR METADATA
// ============================================================

function cargarMetadata() {
    const script = document.getElementById("nsb-metadata");

    if (!script) {
        console.error("No se encuentra nsb-metadata");
        return;
    }

    const metadata = JSON.parse(script.textContent);

    // Primero las listas
    cargarListas(metadata);

    // Después los campos individuales
    document.querySelectorAll("[data-md]").forEach(el => {
        if (el.closest("[data-md-list]")) return;
        const valor = obtenerValor(metadata, el.dataset.md);
        el.textContent = valor ?? "-";
    });

    // Enlaces individuales
    document.querySelectorAll("[data-md-href]").forEach(el => {
        if (el.closest("[data-md-list]")) return;
        const valor = obtenerValor(metadata, el.dataset.mdHref);
        if (valor) {
            el.href = valor;
            el.style.removeProperty("display");
        } else {
            el.removeAttribute("href");
            el.style.display = "none";
        }
    });
}

document.addEventListener("DOMContentLoaded", cargarMetadata);