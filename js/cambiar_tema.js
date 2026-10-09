// cambiar_tema.js
document.addEventListener("DOMContentLoaded", () => {
    // El tema se aplica SIEMPRE (index y canciones),
    // aunque la página no tenga botón #btn-theme.
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    // El botón solo existe en index/acerca/crear_hoja.
    const toggleBtn = document.getElementById("btn-theme");
    if (!toggleBtn) return;

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

// =====================================================
// Mostrar / ocultar acordes (preferencia global)
// - El botón #btn-acordes solo existe en index.html.
// - Las canciones no se tocan: ya cargan este mismo
//   fichero (../../js/cambiar_tema.js), así que al abrir
//   una canción se lee localStorage y se ocultan las
//   líneas que son solo acordes.
// - Por defecto modo gente (ocultos). El músico lo activa
//   una vez en el índice y queda guardado.
// - Detección duplicada a propósito de transponer.js.
//   No se modifica transponer.js.
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    const KEY = "mostrarAcordes"; // "1" = ver acordes, "0"/ausente = ocultar
    const btnAcordes = document.getElementById("btn-acordes");

    function getMostrarAcordes() {
        try {
            return localStorage.getItem(KEY) === "1";
        } catch (e) {
            return false;
        }
    }

    function updateAcordesBtn() {
        if (!btnAcordes) return;
        const mostrar = getMostrarAcordes();
        btnAcordes.textContent = "🎸";
        btnAcordes.style.opacity = mostrar ? "1" : "0.4";
        btnAcordes.style.filter = mostrar ? "none" : "grayscale(100%)";
        btnAcordes.title = mostrar
            ? "Ocultar acordes (modo gente)"
            : "Mostrar acordes (modo músico)";
        btnAcordes.setAttribute("aria-pressed", mostrar ? "true" : "false");
    }

    // Misma expresión que transponer.js (copia intencional, no tocar transponer.js)
    const CHORD_RE_ACORDES =
        /(Do#|Re#|Fa#|Sol#|La#|Reb|Mib|Solb|Lab|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(m|maj7|7|sus4|sus2|º7|º|\+|m7b5)?/g;

    function esLineaAcordes(linea) {
        const resto = linea
            .replace(CHORD_RE_ACORDES, "")
            .replace(/[()\[\]]/g, "")
            .replace(/\s+/g, "");
        // Ojo: las líneas con tags (<span...>) no dan "" y se conservan,
        // igual que hace el transpositor. Solo se quitan líneas puras de acordes.
        return resto.length === 0;
    }

    function ocultarAcordesEnPres() {
        document.querySelectorAll("pre").forEach((pre) => {
            const html = pre.innerHTML;
            const lineas = html.split("\n");

            const filtradas = lineas.filter((linea) => {
                // Conservar líneas vacías o que solo contienen espacios.
                if (linea.trim() === "") return true;

                // Eliminar únicamente las líneas de acordes.
                return !esLineaAcordes(linea);
            });

            if (filtradas.length !== lineas.length) {
                pre.innerHTML = filtradas.join("\n");
            }
        });
    }

    // 1) Si estamos en index, el botón solo guarda la preferencia.
    if (btnAcordes) {
        updateAcordesBtn();
        btnAcordes.addEventListener("click", () => {
            const nuevo = !getMostrarAcordes();
            try {
                localStorage.setItem(KEY, nuevo ? "1" : "0");
            } catch (e) { /* sin localStorage, no persiste */ }
            updateAcordesBtn();
        });
    }

    // 2) Si estamos en una canción (hay <pre>) y toca ocultar, ocultar ahora.
    if (document.querySelector("pre") && !getMostrarAcordes()) {
        ocultarAcordesEnPres();
    }

    // 3) Reaplicar el ocultado tras transponer/cambiar cifrado/reset,
    // sin modificar transponer.js: envolvemos las funciones globales.
    ["subirTono", "bajarTono", "resetTono", "toggleCifrado"].forEach((nombre) => {
        const original = window[nombre];
        if (typeof original === "function" && !original._conAcordesEnvuelto) {
            const envuelta = function () {
                const r = original.apply(this, arguments);
                if (!getMostrarAcordes()) {
                    ocultarAcordesEnPres();
                }
                return r;
            };
            envuelta._conAcordesEnvuelto = true;
            window[nombre] = envuelta;
        }
    });
});