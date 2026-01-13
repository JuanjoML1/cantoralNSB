/* =====================================================
   transponer.js
   Transposición robusta para cantoral HTML en <pre>
   - Cifrado latino / inglés
   - Mantiene la transposición al cambiar de LAT/ENG
   ===================================================== */

/* Índice cromático (12 tonos) */
const NOTES_LATIN = ["Do","Do#","Re","Mib","Mi","Fa","Fa#","Sol","Sol#","La","Sib","Si"];
const NOTES_EN =    ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

/* Mapa nota → índice (incluye enharmónicos) */
const NOTE_INDEX = {
    "Do":0,"Do#":1,"Reb":1,
    "Re":2,"Re#":3,"Mib":3,
    "Mi":4,
    "Fa":5,"Fa#":6,"Solb":6,
    "Sol":7,"Sol#":8,"Lab":8,
    "La":9,"La#":10,"Sib":10,
    "Si":11,
    "C":0,"C#":1,"Db":1,
    "D":2,"D#":3,"Eb":3,
    "E":4,
    "F":5,"F#":6,"Gb":6,
    "G":7,"G#":8,"Ab":8,
    "A":9,"A#":10,"Bb":10,
    "B":11
};

/* Regex de acorde completo (nota + alteración + calidad) */
const CHORD_REGEX =
  /(Do#|Re#|Fa#|Sol#|La#|Reb|Mib|Solb|Lab|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(m|maj7|7|sus4|sus2|dim|aug)?/g;

/* Guardar estado original para reset */
const PRE_ORIGINALS = [];
document.querySelectorAll("pre").forEach(pre => PRE_ORIGINALS.push(pre.innerHTML));

/* Estado actual */
let currentCifrado = "latin";
let currentSemitones = 0; // semitonos respecto al original

/* Detecta si línea es solo acordes */
function isChordLine(line) {
  const stripped = line
    .replace(CHORD_REGEX, "")
    .replace(/\s+/g, "");
  return stripped.length === 0;
}

/* Transpone línea de acordes */
function transposeLine(line, semitones, notesArray = NOTES_LATIN) {
  return line.replace(CHORD_REGEX, (match, root, quality) => {
    const index = NOTE_INDEX[root];
    if (index === undefined) return match;

    const newIndex = (index + semitones + 12) % 12;
    const newRoot = notesArray[newIndex];

    return newRoot + (quality || "");
  });
}

/* Procesa nodos de texto dentro del pre */
function processTextNodes(element, semitones, notesArray = NOTES_LATIN) {
  element.childNodes.forEach(node => {

    // Si es un nodo de texto
    if (node.nodeType === Node.TEXT_NODE) {
      const lines = node.textContent.split("\n");
      const newLines = lines.map(line =>
        isChordLine(line) ? transposeLine(line, semitones, notesArray) : line
      );
      node.textContent = newLines.join("\n");
    }

    // Si es un nodo HTML
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Saltar ciertos spans (por ejemplo, clase gr o ag)
      if (node.classList.contains("gr") || node.classList.contains("ag")) {
        return; // no hacemos nada, dejamos su contenido intacto
      }
      // Procesar recursivamente el resto
      processTextNodes(node, semitones, notesArray);
    }
  });
}


/* Transpone toda la canción */
function transposeAll(semitones) {
  currentSemitones += semitones; // actualizamos semitonos
  const notesArray = currentCifrado === "latin" ? NOTES_LATIN : NOTES_EN;
  document.querySelectorAll("pre").forEach((pre, i) => {
    pre.innerHTML = PRE_ORIGINALS[i]; // partimos del original
    processTextNodes(pre, currentSemitones, notesArray);
  });
}

/* Cambia entre cifrado latino e inglés */
function toggleCifrado() {
  currentCifrado = currentCifrado === "latin" ? "english" : "latin";
  const notesArray = currentCifrado === "latin" ? NOTES_LATIN : NOTES_EN;

  // Reaplicamos la transposición actual sobre el original
  document.querySelectorAll("pre").forEach((pre, i) => {
    pre.innerHTML = PRE_ORIGINALS[i];
    processTextNodes(pre, currentSemitones, notesArray);
  });
}

/* Vuelve al estado original */
function resetTono() {
  currentSemitones = 0;
  document.querySelectorAll("pre").forEach((pre, i) => {
    pre.innerHTML = PRE_ORIGINALS[i];
  });
  currentCifrado = "latin"; // opcional: reset al cifrado LATIN
}

/* API pública */
function subirTono() { transposeAll(1); }
function bajarTono() { transposeAll(-1); }
