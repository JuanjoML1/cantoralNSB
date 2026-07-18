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

}

document.addEventListener("DOMContentLoaded", cargarMetadata);