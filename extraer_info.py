from pathlib import Path
from bs4 import BeautifulSoup
import csv
import re

# Carpeta raíz donde están las canciones
CARPETA_RAIZ = Path("./")

# Archivo de salida
CSV_SALIDA = "canciones_tono.csv"

# Patrón para reconocer acordes
PATRON_ACORDES = re.compile(
    r'\b(?:Do|Re|Mi|Fa|Sol|La|Si|[A-G])'
    r'(?:#|b)?'
    r'(?:maj7|maj9|maj|min|m|sus2|sus4|sus|dim|aug|add9|6|7|9|11|13)?'
    r'(?:/[A-G](?:#|b)?)?\b'
)


def extraer_acordes(pre_texto):
    """
    Devuelve todos los acordes distintos encontrados en el <pre>,
    manteniendo el orden de aparición.
    """

    encontrados = PATRON_ACORDES.findall(pre_texto)

    acordes = []

    for acorde in encontrados:
        if acorde not in acordes:
            acordes.append(acorde)

    return " ".join(acordes)


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
        tono = ""

        tono_div = soup.find("div", class_="tono")

        if tono_div:
            span = tono_div.find("span")
            if span:
                tono = span.get_text(strip=True)

        # Todos los acordes del <pre>
        acordes = ""

        pre = soup.find("pre")

        if pre:
            texto_pre = pre.get_text("\n")
            acordes = extraer_acordes(texto_pre)

        datos.append({
            "archivo": str(archivo),
            "title": titulo_html,
            "titulo": titulo_visible,
            "numero_antiguo": numero_antiguo,
            "numero_nuevo": numero_nuevo,
            "tono": tono,
            "acordes": acordes
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
        "acordes"
    ]

    writer = csv.DictWriter(
        csvfile,
        fieldnames=campos,
        delimiter=";"
    )

    writer.writeheader()
    writer.writerows(datos)

print(f"CSV generado: {CSV_SALIDA}")
print(f"Canciones procesadas: {len(datos)}")