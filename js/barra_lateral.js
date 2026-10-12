const btnMenu = document.getElementById("btn-menu");
const menu = document.getElementById("secciones-lateral");

const btnTools = document.getElementById("btn-tools");
const tools = document.getElementById("tools-lateral");

// Abrir/cerrar menús al hacer click en los botones
btnMenu.addEventListener("click", (e) => {
    menu.classList.toggle("abierto");
    tools.classList.remove("abierto");
    e.stopPropagation(); // evita que el clic se propague al document
});

btnTools.addEventListener("click", (e) => {
    tools.classList.toggle("abierto");
    menu.classList.remove("abierto");
    e.stopPropagation(); // evita que el clic se propague al document
});

// Cerrar menús al pinchar en un enlace interno (ej. btn-indice a un h2)
menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
        menu.classList.remove("abierto");
    });
});

tools.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
        tools.classList.remove("abierto");
    });
});

// Cerrar menús al hacer click fuera
document.addEventListener("click", (e) => {
    // si el clic NO es dentro de los menús ni en los botones
    if (!menu.contains(e.target) &&
        !tools.contains(e.target) &&
        e.target !== btnMenu &&
        e.target !== btnTools) {
        menu.classList.remove("abierto");
        tools.classList.remove("abierto");
    }
});

//Botón "home"
document.getElementById("btn-home").addEventListener("click", () => {
    window.location.href = "index.html";
});

//Botón "acerca de"
document.getElementById("btn-acerca").addEventListener("click", () => {
    window.location.href = "acerca.html";
});

// Ajustar la altura de la barra fija para los h2 pegajosos (index)
// Mide #barra-fija y la expone como --barra-h (top + scroll-margin)
function actualizarAlturaBarra() {
    const barra = document.getElementById("barra-fija");
    if (!barra) return;
    const h = Math.ceil(barra.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--barra-h", h + "px");
}

window.addEventListener("load", actualizarAlturaBarra);
window.addEventListener("resize", actualizarAlturaBarra);
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", actualizarAlturaBarra);
} else {
    actualizarAlturaBarra();
}