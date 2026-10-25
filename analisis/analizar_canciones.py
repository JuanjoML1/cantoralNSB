#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Analiza cada canción completa en una única petición a Ollama.

Estructura esperada:
cantoralNSB/
├── canciones/
│   └── autor/cancion.html
└── analisis/
    ├── analizar_canciones.py
    ├── prompt.txt
    ├── temas.txt
    ├── tiempos_liturgicos.txt
    ├── momentos_misa.txt
    └── canciones/
        └── autor/cancion.json
"""

import argparse
import copy
import json
import re
import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup


BASE_DIR = Path(__file__).resolve().parent
CARPETA_ORIGEN = BASE_DIR.parent / "canciones"
CARPETA_SALIDA = BASE_DIR / "canciones"

OLLAMA_URL = "http://localhost:11434/api/chat"
MODELO = "qwen3:8b"
TEMPERATURA = 0.1
TIMEOUT_SEGUNDOS = 900

ARCHIVOS_CONFIG = {
    "prompt": BASE_DIR / "prompt.txt",
    "temas": BASE_DIR / "temas.txt",
    "tiempos": BASE_DIR / "tiempos_liturgicos.txt",
    "momentos": BASE_DIR / "momentos_misa.txt",
}

ESQUEMA_ANALISIS_VACIO = {
    "temas": [],
    "citas_biblicas": {
        "explicitas": [],
        "relacionadas": []
    },
    "tiempo_liturgico": [],
    "celebraciones": [],
    "momento_misa": []
}

def leer_texto(ruta: Path, obligatorio: bool = False) -> str:
    if not ruta.is_file():
        if obligatorio:
            raise FileNotFoundError(f"No se encuentra el archivo de configuración: {ruta}")
        print(f"AVISO: no se encuentra el archivo opcional: {ruta.name}")
        return ""
    return ruta.read_text(encoding="utf-8-sig").strip()


def cargar_metadata_html(ruta_html: Path) -> dict:
    """Lee los metadatos JSON del script nsb-metadata del HTML."""
    html = ruta_html.read_text(encoding="utf-8-sig")
    soup = BeautifulSoup(html, "html.parser")
    bloque = soup.find("script", id="nsb-metadata")

    if bloque is None:
        raise ValueError(f"No se encuentra <script id='nsb-metadata'> en {ruta_html}")

    contenido = bloque.string if bloque.string is not None else bloque.get_text()
    if not contenido.strip():
        raise ValueError(f"El bloque nsb-metadata está vacío en {ruta_html}")

    try:
        metadata = json.loads(contenido)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Los metadatos del HTML no son JSON válido: {exc}") from exc

    if not isinstance(metadata, dict):
        raise ValueError("Los metadatos de nsb-metadata deben ser un objeto JSON.")

    return metadata


def es_linea_de_acordes(linea: str) -> bool:
    """Detecta líneas compuestas casi por completo por símbolos de acordes."""
    limpia = linea.strip()
    if not limpia:
        return False

    tokens = limpia.split()
    patron = re.compile(
        r"^(?:"
        r"[A-G](?:#|b)?"
        r"(?:m|maj|min|dim|aug|sus|add)?"
        r"(?:\d{1,2})?"
        r"(?:\([^)]*\))?"
        r"(?:/[A-G](?:#|b)?)?"
        r"|N\.?C\.?"
        r")$",
        re.IGNORECASE,
    )
    proporcion = sum(bool(patron.fullmatch(token)) for token in tokens) / len(tokens)
    tiene_vocales = bool(re.search(r"[aeiouáéíóúüñ]", limpia, re.IGNORECASE))

    return len(tokens) <= 14 and proporcion >= 0.75 and not tiene_vocales


def extraer_letra_sin_acordes(ruta_html: Path) -> str:
    """Extrae el texto de <pre>, elimina acordes entre corchetes y líneas de acordes."""
    html = ruta_html.read_text(encoding="utf-8-sig")
    soup = BeautifulSoup(html, "html.parser")
    pre = soup.find("pre")

    if pre is None:
        raise ValueError(f"No se encuentra el bloque <pre> en {ruta_html}")

    texto = pre.get_text("\n")
    # Elimina acordes entre corchetes: [Am], [G7], [Do], etc.
    texto = re.sub(r"\[[^\]]{1,30}\]", " ", texto)

    lineas = []
    for linea in texto.splitlines():
        if es_linea_de_acordes(linea):
            continue
        lineas.append(linea.rstrip())

    letra = "\n".join(lineas).strip()
    if not letra:
        raise ValueError("No se ha podido extraer texto de la letra desde <pre>.")
    return letra


def construir_prompt_usuario(
    metadata: dict,
    letra: str,
    config: dict[str, str],
) -> str:
    return f"""
TÍTULO:
{metadata.get("titulo", "Sin título")}

LETRA:
<letra>
{letra}
</letra>

CATEGORÍAS DE TEMAS:
{config.get("temas", "")}

TIEMPOS LITÚRGICOS Y CELEBRACIONES:
{config.get("tiempos", "")}

MOMENTOS DE LA MISA:
{config.get("momentos", "")}
""".strip()

def extraer_json_de_respuesta(contenido: str) -> dict:
    """Parsea el JSON de Ollama, con una recuperación sencilla si hay texto alrededor."""
    contenido = contenido.strip()
    try:
        resultado = json.loads(contenido)
    except json.JSONDecodeError:
        inicio = contenido.find("{")
        fin = contenido.rfind("}")
        if inicio < 0 or fin <= inicio:
            raise ValueError(f"Ollama no devolvió un objeto JSON: {contenido[:1200]}")
        try:
            resultado = json.loads(contenido[inicio:fin + 1])
        except json.JSONDecodeError as exc:
            raise ValueError(f"Ollama devolvió JSON inválido: {contenido[:1200]}") from exc

    if not isinstance(resultado, dict):
        raise ValueError("La respuesta de Ollama no es un objeto JSON.")
    return resultado


def validar_analisis(resultado: dict) -> dict:
    """Comprueba el esquema completo y normaliza los tipos sin inventar datos."""
    claves = set(ESQUEMA_ANALISIS_VACIO)
    faltantes = claves - set(resultado)
    if faltantes:
        raise ValueError(
            "Faltan claves en la respuesta de Ollama: "
            + ", ".join(sorted(faltantes))
            + f". Claves recibidas: {list(resultado.keys())}"
        )

    analisis = {}
    for clave in ("temas", "tiempo_liturgico", "celebraciones", "momento_misa"):
        valor = resultado[clave]
        if not isinstance(valor, list) or not all(isinstance(x, str) for x in valor):
            raise ValueError(f"El campo '{clave}' debe ser una lista de cadenas.")
        analisis[clave] = valor

    citas = resultado["citas_biblicas"]
    if not isinstance(citas, dict):
        raise ValueError("'citas_biblicas' debe ser un objeto.")
    for clave in ("explicitas", "relacionadas"):
        valor = citas.get(clave)
        if not isinstance(valor, list) or not all(isinstance(x, str) for x in valor):
            raise ValueError(f"'citas_biblicas.{clave}' debe ser una lista de cadenas.")
    analisis["citas_biblicas"] = {
        "explicitas": citas["explicitas"],
        "relacionadas": citas["relacionadas"],
    }
    return analisis


def consultar_ollama(
    system_prompt: str,
    metadata: dict,
    letra: str,
    config: dict[str, str],
    think: bool,
    mostrar_razonamiento: bool,
) -> dict:
    prompt_usuario = construir_prompt_usuario(metadata, letra, config)

    payload = {
        "model": MODELO,
        "think": think,
        "stream": False,
        "format": "json",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_usuario},
        ],
        "options": {
            "temperature": TEMPERATURA,
            "num_ctx": 8192,
            "num_predict": 2500,
        },
    }

    respuesta = requests.post(OLLAMA_URL, json=payload, timeout=TIMEOUT_SEGUNDOS)
    respuesta.raise_for_status()
    cuerpo = respuesta.json()
    mensaje = cuerpo.get("message", {})

    razonamiento = mensaje.get("thinking", "")
    if mostrar_razonamiento and razonamiento:
        print("\n--- RAZONAMIENTO DEVUELTO POR OLLAMA ---")
        print(razonamiento.strip())
        print("--- FIN DEL RAZONAMIENTO ---\n")

    contenido = mensaje.get("content", "").strip()
    if not contenido:
        raise ValueError(
            "Ollama no ha devuelto contenido JSON. Respuesta: "
            + json.dumps(cuerpo, ensure_ascii=False)[:1500]
        )

    resultado = extraer_json_de_respuesta(contenido)
    return validar_analisis(resultado)


def guardar_resultado(ruta_json: Path, metadata_html: dict, analisis: dict) -> None:
    """
    Guarda metadatos del HTML más el análisis completo.
    Si ya había un JSON, conserva sus metadatos/campos adicionales y reemplaza el análisis.
    """
    if ruta_json.is_file():
        try:
            existente = json.loads(ruta_json.read_text(encoding="utf-8"))
            salida = copy.deepcopy(existente) if isinstance(existente, dict) else copy.deepcopy(metadata_html)
        except (json.JSONDecodeError, OSError):
            salida = copy.deepcopy(metadata_html)
    else:
        salida = copy.deepcopy(metadata_html)

    # El HTML es la fuente de los metadatos originales; no se modifica el HTML.
    for clave, valor in metadata_html.items():
        if clave not in ("analisis", "revision"):
            salida.setdefault(clave, copy.deepcopy(valor))

    salida["analisis"] = analisis
    if not isinstance(salida.get("revision"), dict):
        salida["revision"] = {}
    salida["revision"]["ia"] = True

    ruta_json.parent.mkdir(parents=True, exist_ok=True)
    temporal = ruta_json.with_suffix(ruta_json.suffix + ".tmp")
    temporal.write_text(
        json.dumps(salida, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporal.replace(ruta_json)


def json_tiene_analisis_completo(ruta_json: Path) -> bool:
    """True si existe un JSON de salida con todos los campos y tipos esperados."""
    if not ruta_json.is_file():
        return False
    try:
        datos = json.loads(ruta_json.read_text(encoding="utf-8"))
        if not isinstance(datos, dict) or not isinstance(datos.get("analisis"), dict):
            return False
        validar_analisis(datos["analisis"])
        return True
    except (OSError, json.JSONDecodeError, ValueError, TypeError):
        return False


def analizar_cancion(
    ruta_html: Path,
    system_prompt: str,
    config: dict[str, str],
    forzar: bool,
    think: bool,
    mostrar_razonamiento: bool,
) -> str:
    relativa = ruta_html.relative_to(CARPETA_ORIGEN)
    ruta_json = (CARPETA_SALIDA / relativa).with_suffix(".json")

    # No hay comprobaciones por módulos: se procesa la canción entera.
    # Solo se omite si existe un JSON completo y no se ha pedido --forzar.
    if not forzar and json_tiene_analisis_completo(ruta_json):
        print(f"  OMITIDA: ya existe un análisis completo: {ruta_json}")
        return "omitida"

    print(f"  JSON de salida: {ruta_json}")
    metadata = cargar_metadata_html(ruta_html)
    letra = extraer_letra_sin_acordes(ruta_html)

    print("  Enviando la canción completa a Ollama...")
    analisis = consultar_ollama(
        system_prompt=system_prompt,
        metadata=metadata,
        letra=letra,
        config=config,
        think=think,
        mostrar_razonamiento=mostrar_razonamiento,
    )
    guardar_resultado(ruta_json, metadata, analisis)
    print(f"  GUARDADA: {ruta_json}")
    return "analizada"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Analiza canciones completas del cantoral con Ollama en una única petición por canción."
    )
    parser.add_argument("--autor", help="Procesa solo la carpeta de este autor, por ejemplo ain_karem.")
    parser.add_argument("--forzar", action="store_true", help="Vuelve a analizar aunque exista un análisis completo.")
    parser.add_argument("--limite", type=int, default=0, help="Máximo de canciones (0 = todas).")
    parser.add_argument("--pausa", type=float, default=0.0, help="Pausa entre canciones, en segundos.")
    parser.add_argument("--think", choices=("si", "no"), default="si", help="Activar/desactivar thinking en Ollama.")
    parser.add_argument(
        "--mostrar-razonamiento",
        action="store_true",
        help="Muestra el campo thinking devuelto por Ollama, si está disponible.",
    )
    args = parser.parse_args()

    if not CARPETA_ORIGEN.is_dir():
        print(f"ERROR: no existe la carpeta de canciones: {CARPETA_ORIGEN}", file=sys.stderr)
        return 1

    try:
        system_prompt = leer_texto(ARCHIVOS_CONFIG["prompt"], obligatorio=True)
        config = {
            "temas": leer_texto(ARCHIVOS_CONFIG["temas"]),
            "tiempos": leer_texto(ARCHIVOS_CONFIG["tiempos"]),
            "momentos": leer_texto(ARCHIVOS_CONFIG["momentos"]),
        }
    except (OSError, FileNotFoundError) as exc:
        print(f"ERROR de configuración: {exc}", file=sys.stderr)
        return 1

    if not system_prompt:
        print(f"ERROR: {ARCHIVOS_CONFIG['prompt']} está vacío.", file=sys.stderr)
        return 1

    if args.autor:
        carpeta_autor = CARPETA_ORIGEN / args.autor
        if not carpeta_autor.is_dir():
            print(f"ERROR: no existe la carpeta del autor: {carpeta_autor}", file=sys.stderr)
            return 1
        archivos = sorted(carpeta_autor.rglob("*.html"))
    else:
        archivos = sorted(CARPETA_ORIGEN.rglob("*.html"))

    if args.limite > 0:
        archivos = archivos[:args.limite]

    if not archivos:
        print("No se han encontrado archivos HTML para analizar.")
        return 0

    print(f"Carpeta de entrada: {CARPETA_ORIGEN}")
    print(f"Carpeta de salida:  {CARPETA_SALIDA}")
    print(f"Modelo: {MODELO}")
    print(f"Thinking: {args.think}")
    print(f"Mostrar razonamiento: {'sí' if args.mostrar_razonamiento else 'no'}")
    print(f"Canciones encontradas: {len(archivos)}\n")

    contadores = {"analizada": 0, "omitida": 0, "error": 0}

    for i, ruta_html in enumerate(archivos, start=1):
        print(f"[{i}/{len(archivos)}] {ruta_html.relative_to(CARPETA_ORIGEN)}")
        try:
            estado = analizar_cancion(
                ruta_html=ruta_html,
                system_prompt=system_prompt,
                config=config,
                forzar=args.forzar,
                think=(args.think == "si"),
                mostrar_razonamiento=args.mostrar_razonamiento,
            )
            contadores[estado] += 1
        except requests.RequestException as exc:
            contadores["error"] += 1
            print(f"  ERROR de conexión con Ollama: {exc}")
        except (ValueError, OSError, json.JSONDecodeError) as exc:
            contadores["error"] += 1
            print(f"  ERROR: {exc}")

        if args.pausa > 0 and i < len(archivos):
            time.sleep(args.pausa)
        print()

    print("Resumen:")
    print(f"  Analizadas: {contadores['analizada']}")
    print(f"  Omitidas:   {contadores['omitida']}")
    print(f"  Errores:    {contadores['error']}")
    return 1 if contadores["error"] else 0


if __name__ == "__main__":
    raise SystemExit(main())