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