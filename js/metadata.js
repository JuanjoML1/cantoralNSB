function cargarMetadata() {

    const metadata = JSON.parse(
        document.getElementById("nsb-metadata").textContent
    );

    document.querySelectorAll("[data-md]").forEach(el => {

        const ruta = el.dataset.md.split(".");

        let valor = metadata;

        for (const clave of ruta) {

            if (valor == null) break;

            valor = valor[clave];
        }

        el.textContent = valor ?? "-";

    });

    // Enlaces
    document.querySelectorAll("[data-md-href]").forEach(el => {

        const ruta = el.dataset.mdHref.split(".");

        let valor = metadata;

        for (const clave of ruta) {

            if (valor == null) break;

            valor = valor[clave];
        }

        if (valor) {
            el.href = valor;
        } else {
            el.style.display = "none";
        }

    });

}

document.addEventListener("DOMContentLoaded", cargarMetadata);