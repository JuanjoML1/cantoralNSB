/* =====================================================
   transponer.js
   Transposición robusta para cantoral HTML en <pre>
   Requiere acordes.js cargado previamente
   ===================================================== */

/* =====================================================
   1. GUARDAR ORIGINALES Y DETECTAR CIFRADO
   ===================================================== */

const PRE_ORIGINALS = [];
const PRE_CIFRADOS = [];

document.querySelectorAll("pre").forEach(pre => {
    const original = pre.innerHTML;
    PRE_ORIGINALS.push(original);

    // Detectar cifrado a partir de las líneas de acordes
    const texto = original.replace(/<[^>]*>/g, "");
    const lineas = texto.split("\n");

    let notasLatinas = 0;
    let notasInglesas = 0;

    lineas.forEach(linea => {
        if (!isChordLine(linea)) return;
        const latina = linea.match(
            /\b(Do|Re|Mi|Fa|Sol|La|Si)(#|b)?/g
        ) || [];
        const inglesa = linea.match(
            /\b(C|D|E|F|G|A|B)(#|b)?/g
        ) || [];
        notasLatinas += latina.length;
        notasInglesas += inglesa.length;
    });

    PRE_CIFRADOS.push(
        notasInglesas > notasLatinas ? "english" : "latin"
    );
});

// Cifrado seleccionado: inicialmente el original
let currentCifrado = PRE_CIFRADOS[0] || "latin";
let currentSemitones = 0;

/* =====================================================
   2. TRANSPONER ACORDES DE UNA LÍNEA
   ===================================================== */

function transposeLine(line, semitones, notesArray) {
    return line.replace(
        CHORD_REGEX,
        (match, root, quality) => {
            const index = NOTE_INDEX[root];
            if (index === undefined) return match;
            const newIndex =
                (index + semitones + 12) % 12;
            return notesArray[newIndex] + (quality || "");
        }
    );
}

/* =====================================================
   3. CONVERTIR CIFRADO
   ===================================================== */

function convertirCifrado(line, cifradoOrigen, cifradoDestino) {
    if (cifradoOrigen === cifradoDestino) return line;
    const notasDestino = cifradoDestino === "latin"
        ? NOTES_LATIN
        : NOTES_EN;
    return line.replace(
        CHORD_REGEX,
        (match, root, quality) => {
            const index = NOTE_INDEX[root];
            if (index === undefined) return match;
            return notasDestino[index] + (quality || "");
        }
    );
}

/* =====================================================
   4. TRANSPONER UN <pre> COMPLETO
   ===================================================== */

function transposePre(pre, semitones, notesArray, cifradoOrigen) {
    let html = pre.innerHTML;
    // Guardar spans ag / gr
    const spanMap = [];
    html = html.replace(
        /<span class="(ag|gr)">.*?<\/span>/g,
        match => {
            const key = `@@SPAN${spanMap.length}@@`;
            spanMap.push(match);
            return key;
        }
    );
    // Procesar por líneas
    const lines = html.split("\n").map(line => {
        if (!isChordLine(line)) return line;
        // Convertir primero al cifrado seleccionado
        line = convertirCifrado(
            line,
            cifradoOrigen,
            currentCifrado
        );
        // Después transponer
        return transposeLine(
            line,
            semitones,
            notesArray
        );
    });
    html = lines.join("\n");
    // Restaurar spans
    spanMap.forEach((span, i) => {
        html = html.replace(`@@SPAN${i}@@`, span);
    });
    pre.innerHTML = html;
}

/* =====================================================
   5. TRANSPONER TODO
   ===================================================== */

function transposeAll(semitones) {
    currentSemitones += semitones;
    document.querySelectorAll("pre").forEach((pre, i) => {
        const notesArray = currentCifrado === "latin"
            ? NOTES_LATIN
            : NOTES_EN;
        pre.innerHTML = PRE_ORIGINALS[i];
        transposePre(
            pre,
            currentSemitones,
            notesArray,
            PRE_CIFRADOS[i]
        );
    });
}

/* =====================================================
   6. CAMBIAR CIFRADO
   ===================================================== */

function toggleCifrado() {
    currentCifrado = currentCifrado === "latin"
        ? "english"
        : "latin";
    document.querySelectorAll("pre").forEach((pre, i) => {
        const notesArray = currentCifrado === "latin"
            ? NOTES_LATIN
            : NOTES_EN;
        pre.innerHTML = PRE_ORIGINALS[i];
        transposePre(
            pre,
            currentSemitones,
            notesArray,
            PRE_CIFRADOS[i]
        );
    });
}

/* =====================================================
   7. RESET
   ===================================================== */

function resetTono() {
    currentSemitones = 0;
    document.querySelectorAll("pre").forEach((pre, i) => {
        const notesArray = currentCifrado === "latin"
            ? NOTES_LATIN
            : NOTES_EN;
        pre.innerHTML = PRE_ORIGINALS[i];
        transposePre(
            pre,
            0,
            notesArray,
            PRE_CIFRADOS[i]
        );
    });
}

/* =====================================================
   8. API
   ===================================================== */

function subirTono() {
    transposeAll(1);
}
function bajarTono() {
    transposeAll(-1);
}