/* =====================================================
   transponer.js
   Transposición robusta para cantoral HTML en <pre>
   ===================================================== */

/* Índice cromático */
const NOTES_LATIN = ["Do","Do#","Re","Mib","Mi","Fa","Fa#","Sol","Sol#","La","Sib","Si"];
const NOTES_EN    = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

/* Mapa nota → índice */
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

/* Regex acorde */
const CHORD_REGEX =
  /\b(Do#|Re#|Fa#|Sol#|La#|Reb|Mib|Solb|Lab|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(m|maj7|7|sus4|sus2|dim|aug)?\b/g;

/* Guardar originales */
const PRE_ORIGINALS = [];
document.querySelectorAll("pre").forEach(pre => PRE_ORIGINALS.push(pre.innerHTML));

let currentCifrado = "latin";
let currentSemitones = 0;

/* Detecta si una línea es SOLO acordes */
function isChordLine(line) {
  const stripped = line
    .replace(CHORD_REGEX, "")
    .replace(/\s+/g, "");
  return stripped.length === 0;
}

/* Transpone acordes de una línea */
function transposeLine(line, semitones, notesArray) {
  return line.replace(CHORD_REGEX, (match, root, quality) => {
    const index = NOTE_INDEX[root];
    if (index === undefined) return match;
    const newIndex = (index + semitones + 12) % 12;
    return notesArray[newIndex] + (quality || "");
  });
}

/* Transponer un <pre> completo */
function transposePre(pre, semitones, notesArray) {

  let html = pre.innerHTML;

  /* 1️⃣ Guardar spans ag / gr */
  const spanMap = [];
  html = html.replace(
    /<span class="(ag|gr)">.*?<\/span>/g,
    match => {
      const key = `@@SPAN${spanMap.length}@@`;
      spanMap.push(match);
      return key;
    }
  );

  /* 2️⃣ Procesar por líneas */
  const lines = html.split("\n").map(line =>
    isChordLine(line)
      ? transposeLine(line, semitones, notesArray)
      : line
  );

  html = lines.join("\n");

  /* 3️⃣ Restaurar spans */
  spanMap.forEach((span, i) => {
    html = html.replace(`@@SPAN${i}@@`, span);
  });

  pre.innerHTML = html;
}

/* Transponer todo */
function transposeAll(semitones) {
  currentSemitones += semitones;
  const notesArray = currentCifrado === "latin" ? NOTES_LATIN : NOTES_EN;
  document.querySelectorAll("pre").forEach((pre, i) => {
    pre.innerHTML = PRE_ORIGINALS[i];
    transposePre(pre, currentSemitones, notesArray);
  });
}

/* Cambiar cifrado */
function toggleCifrado() {
  currentCifrado = currentCifrado === "latin" ? "english" : "latin";
  const notesArray = currentCifrado === "latin" ? NOTES_LATIN : NOTES_EN;
  document.querySelectorAll("pre").forEach((pre, i) => {
    pre.innerHTML = PRE_ORIGINALS[i];
    transposePre(pre, currentSemitones, notesArray);
  });
}

/* Reset */
function resetTono() {
  currentSemitones = 0;
  currentCifrado = "latin";
  document.querySelectorAll("pre").forEach((pre, i) => {
    pre.innerHTML = PRE_ORIGINALS[i];
  });
}

/* API */
function subirTono() { transposeAll(1); }
function bajarTono() { transposeAll(-1); }
