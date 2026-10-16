const btnMenu = document.getElementById("btn-menu");
const menu = document.getElementById("secciones-lateral");

const btnTools = document.getElementById("btn-tools");
const tools = document.getElementById("tools-lateral");

// Abrir/cerrar menús al hacer click en los botones (solo si existen en la página)
if (btnMenu && menu) {
    btnMenu.addEventListener("click", (e) => {
        menu.classList.toggle("abierto");
        tools?.classList.remove("abierto");
        e.stopPropagation(); // evita que el clic se propague al document
    });
}

if (btnTools && tools) {
    btnTools.addEventListener("click", (e) => {
        tools.classList.toggle("abierto");
        menu?.classList.remove("abierto");
        e.stopPropagation(); // evita que el clic se propague al document
    });
}

// Cerrar menús al pinchar en un enlace interno (ej. btn-indice a un h2)
menu?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
        menu.classList.remove("abierto");
    });
});

tools?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
        tools.classList.remove("abierto");
    });
});

// Cerrar menús al hacer click fuera
document.addEventListener("click", (e) => {
    // si el clic NO es dentro de los menús ni en los botones
    if ((!menu || !menu.contains(e.target)) &&
        (!tools || !tools.contains(e.target)) &&
        e.target !== btnMenu &&
        e.target !== btnTools) {
        menu?.classList.remove("abierto");
        tools?.classList.remove("abierto");
    }
});

//Botón "home"
document.getElementById("btn-home")?.addEventListener("click", () => {
    window.location.href = "index.html";
});

//Botón "acerca de"
document.getElementById("btn-acerca")?.addEventListener("click", () => {
    window.location.href = "acerca.html";
});

// Ajustar la altura fija superior y exponerla como --barra-h.
// - PC: solo #barra-fija es sticky -> se mide.
// - Móvil: botonera fija arriba + #barra-fija sticky debajo -> se suman.
function actualizarAlturaBarra() {
    const lateral = document.getElementById("lateral-controles");
    const altoLateral = lateral ? Math.ceil(lateral.getBoundingClientRect().height) : 0;

    const barra = document.getElementById("barra-fija");
    if (!barra) {
        document.documentElement.style.setProperty("--barra-h", altoLateral + "px");
        return;
    }

    const hBarra = Math.ceil(barra.getBoundingClientRect().height);

    if (window.matchMedia("(max-width: 700px)").matches) {
        document.documentElement.style.setProperty("--barra-h", (altoLateral + hBarra) + "px");
        return;
    }

    document.documentElement.style.setProperty("--barra-h", hBarra + "px");
}

window.addEventListener("load", actualizarAlturaBarra);
window.addEventListener("resize", actualizarAlturaBarra);
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizarAlturaBarra);
} else {
    actualizarAlturaBarra();
}