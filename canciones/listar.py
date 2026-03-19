import os

# Carpeta donde está el script
carpeta = os.path.dirname(os.path.abspath(__file__))

# Nombre del archivo de salida
archivo_salida = os.path.join(carpeta, "lista_archivos.txt")

# Obtener solo archivos
archivos = [f for f in os.listdir(carpeta) if os.path.isfile(os.path.join(carpeta, f))]

# Guardar en txt
with open(archivo_salida, "w", encoding="utf-8") as f:
    for archivo in archivos:
        f.write(archivo + "\n")

print(f"Se han guardado {len(archivos)} archivos en {archivo_salida}")