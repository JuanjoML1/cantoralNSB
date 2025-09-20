import os
import csv
import re

# Carpeta con tus archivos de canciones y CSV
CARPETA = "canciones"
CSV = "datos_cabeceras.csv"

# Listar archivos HTML encontrados
archivos_html = [f for f in os.listdir(CARPETA) if f.endswith(".html")]
print("Archivos HTML encontrados:")
"""for f in archivos_html:
    print(" -", f)
"""
print(f"Total: {len(archivos_html)}\n")

# Leer CSV y crear diccionario: nombre_archivo -> datos
datos = {}
with open(CSV, newline='', encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    for row in reader:
  if len(row) < 4:
      continue
  archivo_csv, antiguo, nuevo, tono = row
  key = archivo_csv.strip().lower().replace(" ", "")
  datos[key] = {
      "antiguo": antiguo.strip(),
      "nuevo": nuevo.strip(),
      "tono": tono.strip()
  }

# Función para normalizar nombres de archivo
def normalizar(nombre):
    return nombre.lower().replace(" ", "")

# Procesar archivos
for archivo in archivos_html:
    ruta = os.path.join(CARPETA, archivo)
    with open(ruta, "r", encoding="utf-8") as f:
  contenido = f.read()

    # Normalizar nombre para buscar en CSV
    key = normalizar(archivo)
    d = datos.get(key)

    if not d:
  print(f"⚠️ No hay datos en CSV para {archivo}. Se mantienen los valores actuales.")
  continue

    # Actualizar antiguo
    contenido = re.sub(
  r'(<span class="antiguo">).*?(</span>)',
  lambda m: f"{m.group(1)}{d['antiguo']}{m.group(2)}",
  contenido,
  flags=re.IGNORECASE
    )

    # Actualizar nuevo
    contenido = re.sub(
  r'(<span class="nuevo">).*?(</span>)',
  lambda m: f"{m.group(1)}{d['nuevo']}{m.group(2)}",
  contenido,
  flags=re.IGNORECASE
    )

    # Actualizar tono
    contenido = re.sub(
  r'(<div class="tono">\s*<span>).*?(</span>\s*</div>)',
  lambda m: f"{m.group(1)}{d['tono']}{m.group(2)}",
  contenido,
  flags=re.IGNORECASE
    )

    # Guardar archivo
    with open(ruta, "w", encoding="utf-8") as f:
  f.write(contenido)

    #print(f"Actualizado: {archivo}")
