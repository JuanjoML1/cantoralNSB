from bs4 import BeautifulSoup
import os

# Carpeta donde se guardarán los HTMLs de las canciones
os.makedirs("canciones", exist_ok=True)

# Abrimos el index.html
with open("index.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f, "html.parser")

# Extraemos todos los enlaces dentro del ul#lista
enlaces = soup.select("#lista li a")

# Plantilla de canción
plantilla = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>{titulo}</title>
<link rel="stylesheet" href="../css/estilo.css">
</head>
<body>
<h1>{titulo}</h1>
<pre>
Aquí irá la letra...
</pre>
</body>
<script src="../js/transponer.js"></script>

</html>
"""

# Creamos los archivos de cada canción
for a in enlaces:
    ruta = a['href']    # ej: "canciones/a_belen_se_va_y_se_viene.html"
    titulo = a.text.strip()   # ej: "A Belén se va y se viene"
    
    # Nos aseguramos de que la carpeta exista
    carpeta = os.path.dirname(ruta)
    os.makedirs(carpeta, exist_ok=True)
    
    # Creamos el archivo HTML si no existe
    if not os.path.exists(ruta):
  with open(ruta, "w", encoding="utf-8") as f:
      f.write(plantilla.format(titulo=titulo))

print("Todos los HTMLs de canciones se han generado correctamente!")