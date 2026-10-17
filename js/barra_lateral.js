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
// - PC: la botonera es lateral (no ocupa alto) -> solo se mide #barra-fija.
// - Móvil: header fijo arriba + #barra-fija sticky debajo -> se suman.
function actualizarAlturaBarra() {
    const header = document.getElementById("barra-superior");
    const barra = document.getElementById("barra-fija");

    const movil = window.matchMedia("(max-width: 700px)").matches;
    const altoHeader = (movil && header) ? Math.ceil(header.getBoundingClientRect().height) : 0;

    if (!barra) {
        document.documentElement.style.setProperty("--barra-h", altoHeader + "px");
        return;
    }

    const hBarra = Math.ceil(barra.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--barra-h", (altoHeader + hBarra) + "px");
}

window.addEventListener("load", actualizarAlturaBarra);
window.addEventListener("resize", actualizarAlturaBarra);
window.addEventListener("orientationchange", () => {
    // la rotación cambia la altura: medir dos veces (antes y tras el reflow)
    actualizarAlturaBarra();
    setTimeout(actualizarAlturaBarra, 300);
});
if (document.fonts && document.fonts.ready) {
    // en móvil real la fuente carga tarde y agranda la barra:
    // volver a medir cuando esté lista + margen de seguridad
    document.fonts.ready.then(() => {
        actualizarAlturaBarra();
        setTimeout(actualizarAlturaBarra, 300);
    });
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizarAlturaBarra);
} else {
    actualizarAlturaBarra();
}
// red de seguridad: por si algo (fuente, zoom, teclado) cambia la altura tarde
setTimeout(actualizarAlturaBarra, 1000);