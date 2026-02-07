// ========================================
// crear_hoja.js
// Generador de DOCX para cantoral
// Compatible con docx 8.5.0
// ========================================

const SONG_DB = [];

/* Cargar index.html */
async function loadIndex() {
    const res = await fetch("index.html");
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const list = doc.querySelectorAll("li a");
    const datalist = document.getElementById("songlist");

    list.forEach(a => {
        const title = a.textContent.trim();
        const href = a.getAttribute("href");
        SONG_DB.push({ title, href });

        const opt = document.createElement("option");
        opt.value = title;
        datalist.appendChild(opt);
    });

    addRow();
}

/* Añadir fila de canción */
function addRow() {
    const div = document.createElement("div");
    div.className = "song-row";
    div.innerHTML = `
        <input list="songlist" name="song-title" placeholder="Título canción">
        <button type="button" onclick="removeRow(this)">✕</button>
    `;
    document.getElementById("songs").appendChild(div);
}

/* Quitar fila */
function removeRow(btn) {
    btn.parentElement.remove();
}

/* Buscar canción por título */
function findSong(title) {
    return SONG_DB.find(s => s.title === title);
}

/* Quitar acordes de una línea */
function removeChords(text) {
    return text.replace(
        /\b(Do#|Re#|Fa#|Sol#|La#|Reb|Mib|Solb|Lab|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(m|maj7|7|sus4|sus2|dim|aug)?\b/g,
        ""
    );
}

/* Generar Word */
async function generateDoc() {
    const rows = document.querySelectorAll(".song-row input");
    const mode = document.querySelector("input[name=mode]:checked").value;

    const doc = new docx.Document();
    const children = [];

    for (const input of rows) {
        const title = input.value.trim();
        if (!title) continue;

        const song = findSong(title);
        if (!song) {
            alert("No encontrada: " + title);
            return;
        }

        /* Cargar html de la canción */
        const res = await fetch(song.href);
        const html = await res.text();
        const parser = new DOMParser();
        const sdoc = parser.parseFromString(html, "text/html");

        const h1 = sdoc.querySelector("h1.titulo");
        const pre = sdoc.querySelector("pre");
        if (!h1 || !pre) continue;

        /* Título */
        children.push(new docx.Paragraph({
            children: [
                new docx.TextRun({ text: h1.textContent, bold: true, size: 32 })
            ]
        }));

        /* Contenido */
        let text = pre.textContent;
        if (mode === "lyrics") text = removeChords(text);

        text.split("\n").forEach(line => {
            children.push(new docx.Paragraph({
                children: [
                    new docx.TextRun({ text: line, font: "Courier New", size: 24 })
                ]
            }));
        });

        children.push(new docx.Paragraph({ text: "" })); // espacio extra
    }

    doc.addSection({ children });

    const blob = await docx.Packer.toBlob(doc);
    saveAs(blob, "cantoral.docx");
}

/* Inicialización */
loadIndex();
