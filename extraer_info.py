from pathlib import Path
from bs4 import BeautifulSoup
import csv
import re

# Carpeta raíz donde están las canciones
CARPETA_RAIZ = Path(r"./")

# Archivo de salida
CSV_SALIDA = "canciones.csv"


def extraer_primera_linea_acordes(pre_texto):
    """
    Devuelve la primera línea no vacía dentro del <pre>.
    """
    lineas = pre_texto.splitlines()

    for linea in lineas:
        limpia = linea.strip()

        if limpia:
            return limpia

    return ""


datos = []

# Busca todos los HTML recursivamente
for archivo in CARPETA_RAIZ.rglob("*.html"):

    try:
        with open(archivo, "r", encoding="utf-8") as f:
            contenido = f.read()

        soup = BeautifulSoup(contenido, "html.parser")

        # <title>
        titulo_html = soup.title.string.strip() if soup.title else ""

        # <h1 class="titulo">
        h1_titulo = soup.find("h1", class_="titulo")
        titulo_visible = h1_titulo.get_text(strip=True) if h1_titulo else ""

        # <span class="antiguo">
        span_antiguo = soup.find("span", class_="antiguo")
        numero_antiguo = span_antiguo.get_text(strip=True) if span_antiguo else ""

        # <span class="nuevo">
        span_nuevo = soup.find("span", class_="nuevo")
        numero_nuevo = span_nuevo.get_text(strip=True) if span_nuevo else ""

        # <div class="tono"><span>
        tono_div = soup.find("div", class_="tono")
        tono = ""

        if tono_div:
            span = tono_div.find("span")
            if span:
                tono = span.get_text(strip=True)

        # Primera línea dentro del <pre>
        pre = soup.find("pre")
        primera_linea = ""

        if pre:
            texto_pre = pre.get_text("\n")
            primera_linea = extraer_primera_linea_acordes(texto_pre)

        datos.append({
            "archivo": str(archivo),
            "title": titulo_html,
            "titulo": titulo_visible,
            "numero_antiguo": numero_antiguo,
            "numero_nuevo": numero_nuevo,
            "tono": tono,
            "primera_linea_acordes": primera_linea
        })

    except Exception as e:
        print(f"Error en {archivo}: {e}")

# Guardar CSV
with open(CSV_SALIDA, "w", newline="", encoding="utf-8-sig") as csvfile:

    campos = [
        "archivo",
        "title",
        "titulo",
        "numero_antiguo",
        "numero_nuevo",
        "tono",
        "primera_linea_acordes"
    ]

    writer = csv.DictWriter(csvfile, fieldnames=campos, delimiter=";")

    writer.writeheader()
    writer.writerows(datos)

print(f"CSV generado: {CSV_SALIDA}")
print(f"Canciones procesadas: {len(datos)}")
