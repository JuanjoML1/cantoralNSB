
/* =====================================================
   acordes.js
   Detección y reconocimiento de acordes
   Compartido por transponer.js y cambiar_tema.js
   ===================================================== */


/* =====================================================
   1. ÍNDICE CROMÁTICO
   ===================================================== */

const NOTES_LATIN = [
    "Do", "Do#", "Re", "Mib", "Mi", "Fa",
    "Fa#", "Sol", "Sol#", "La", "Sib", "Si"
];

const NOTES_EN = [
    "C", "C#", "D", "D#", "E", "F",
    "F#", "G", "G#", "A", "A#", "B"
];


/* =====================================================
   2. MAPA NOTA → ÍNDICE
   ===================================================== */

const NOTE_INDEX = {

    // Notación latina
    "Do": 0, "Do#": 1, "Reb": 1,
    "Re": 2, "Re#": 3, "Mib": 3,
    "Mi": 4,
    "Fa": 5, "Fa#": 6, "Solb": 6,
    "Sol": 7, "Sol#": 8, "Lab": 8,
    "La": 9, "La#": 10, "Sib": 10,
    "Si": 11,

    // Notación inglesa
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11
};


/* =====================================================
   3. TIPOS DE ACORDE
   ===================================================== */

const CHORD_TYPES = [
    "m",
    "m7",
    "m9",
    "maj7",
    "mmaj7",
    "7",
    "9",
    "7b9",
    "sus2",
    "sus4",
    "º",
    "º7",
    "+",
    "aug",
    "m7b5"
];

/* =====================================================
   4. CONSTRUCCIÓN DE LA EXPRESIÓN REGULAR
   ===================================================== */
/* Escapar caracteres especiales */
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* Construir alternativas ordenadas por longitud */
function buildAlternatives(items) {
    return [...items]
        .sort((a, b) => b.length - a.length)
        .map(escapeRegex)
        .join("|");
}

/* Expresión regular de notas */
const NOTES_REGEX = buildAlternatives(
    Object.keys(NOTE_INDEX)
);

/* Expresión regular de tipos de acorde */
const CHORD_TYPES_REGEX = buildAlternatives(
    CHORD_TYPES
);

/* Expresión regular completa de acordes */
const CHORD_REGEX = new RegExp(
    `(${NOTES_REGEX})(${CHORD_TYPES_REGEX})?`,
    "g"
);

/* =====================================================
   5. DETECCIÓN DE LÍNEAS DE ACORDES
   ===================================================== */

function isChordLine(line) {
    const stripped = line
        .replace(CHORD_REGEX, "")
        .replace(/[()[\]]/g, "")
        .replace(/\bx\d+\b/gi, "")
        .replace(/\bbis\b/gi, "")
        .replace(/\s+/g, "");
    return stripped.length === 0;
}