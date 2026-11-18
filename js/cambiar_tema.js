// =====================================================
// cambiar_tema.js
// Gestión del tema y visibilidad de acordes
// Requiere acordes.js cargado previamente
// =====================================================

/* =====================================================
   1. CAMBIAR TEMA CLARO / OSCURO
   ===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // El tema se aplica siempre (index y canciones), aunque la página no tenga botón #btn-theme.
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }

    // El botón solo existe en index/acerca/crear_hoja.
    const toggleBtn = document.getElementById("btn-theme");
    if (!toggleBtn) return;

    // Actualizar icono
    function updateIcon() {
        toggleBtn.textContent =
            document.body.classList.contains("dark")
                ? "☀️"
                : "🌙";
    }

    // Inicializar icono
    updateIcon();

    // Cambiar tema al pulsar
    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const current = document.body.classList.contains("dark")
            ? "dark"
            : "light";
        localStorage.setItem("theme", current);
        updateIcon();
    });
});

/* =====================================================
   2. MOSTRAR / OCULTAR ACORDES
   ===================================================== */

// El botón #btn-acordes solo existe en index.html
// Las canciones leen la preferencia de localStorage y ocultan las líneas que contienen exclusivamente acordes.
// Por defecto: acordes ocultos (modo gente).
// La detección se realiza mediante isChordLine() definida en acordes.js.

document.addEventListener("DOMContentLoaded", () => {
    const KEY = "mostrarAcordes";
    const btnAcordes = document.getElementById("btn-acordes");

    /* Obtener preferencia */
    function getMostrarAcordes() {
        try {
            return localStorage.getItem(KEY) === "1";
        } catch (e) {
            return false;
        }
    }

    /* Actualizar botón */
    function updateAcordesBtn() {
        if (!btnAcordes) return;
        const mostrar = getMostrarAcordes();
        btnAcordes.textContent = "🎸";
        btnAcordes.style.opacity = mostrar ? "1" : "0.4";
        btnAcordes.style.filter = mostrar
            ? "none"
            : "grayscale(100%)";
        btnAcordes.title = mostrar
            ? "Ocultar acordes (modo gente)"
            : "Mostrar acordes (modo músico)";
        btnAcordes.setAttribute(
            "aria-pressed",
            mostrar ? "true" : "false"
        );
    }

    /* Ocultar líneas de acordes */
    function ocultarAcordesEnPres() {
        document.querySelectorAll("pre").forEach(pre => {
            const html = pre.innerHTML;
            const lineas = html.split("\n");
            const filtradas = lineas.filter(linea => {
                // Conservar líneas vacías o con espacios.
                if (linea.trim() === "") return true;
                // Utilizar el detector común de acordes.
                return !isChordLine(linea);
            });

            if (filtradas.length !== lineas.length) {
                pre.innerHTML = filtradas.join("\n");
            }
        });
    }

    /* =================================================
       3. BOTÓN DE VISIBILIDAD EN EL ÍNDICE
       ================================================= */

    if (btnAcordes) {
        updateAcordesBtn();
        btnAcordes.addEventListener("click", () => {
            const nuevo = !getMostrarAcordes();
            try {
                localStorage.setItem(
                    KEY,
                    nuevo ? "1" : "0"
                );
            } catch (e) {
                /* Sin localStorage, no persiste */
            }
            updateAcordesBtn();
        });
    }

    /* =================================================
       4. APLICAR PREFERENCIA EN CANCIONES
       ================================================= */

    if (
        document.querySelector("pre") &&
        !getMostrarAcordes()
    ) {
        ocultarAcordesEnPres();
    }

    /* =================================================
       5. REAPLICAR TRAS TRANSPONER
       ================================================= */

    // Envolvemos las funciones globales para volver a ocultar las líneas de acordes después de ejecutarlas.

    [
        "subirTono",
        "bajarTono",
        "resetTono",
        "toggleCifrado"
    ].forEach(nombre => {
        const original = window[nombre];
        if (
            typeof original === "function" &&
            !original._conAcordesEnvuelto
        ) {
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