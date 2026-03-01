// cambiar_tema.js
document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("btn-theme");

    // Detectar tema guardado o preferencia del sistema
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    // Función para actualizar el icono
    function updateIcon() {
        toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
    }

    // Inicializamos el icono al cargar
    updateIcon();

    // Cambiar tema al pulsar el botón
    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");       // Alterna la clase dark
        const current = document.body.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("theme", current);       // Guarda la elección
        updateIcon();                                 // Actualiza el icono
    });
});