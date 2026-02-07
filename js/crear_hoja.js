const SONG_DB = [];

// Cargar índice de canciones
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

// Añadir fila de canción
function addRow() {
    const div = document.createElement("div");
    div.className = "song-row";
    div.innerHTML = `
        <input list="songlist" placeholder="Título canción">
        <button onclick="removeRow(this)">✕</button>
    `;
    document.getElementById("songs").appendChild(div);
}

// Quitar fila
function removeRow(btn) {
    btn.parentElement.remove();
}

// Buscar canción en la base
function findSong(title) {
    return SONG_DB.find(s => s.title === title);
}

// Quitar acordes de la letra
function removeChords(text) {
    return text.replace(
        /\b(Do#|Re#|Fa#|Sol#|La#|Reb|Mib|Solb|Lab|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(m|maj7|7|sus4|sus2|dim|aug)?\b/g,
        ""
    );
}

// Generar archivo Word
async function generateDoc() {
    const { Document, Packer, Paragraph, TextRun } = window.docx;
    const rows = document.querySelectorAll(".song-row input");
    const mode = document.querySelector("input[name=mode]:checked").value;

    const doc = new Document();
    const children = [];

    for (const input of rows) {
        const title = input.value.trim();
        if (!title) continue;

        const song = findSong(title);
        if (!song) {
            alert("No encontrada: " + title);
            return;
        }

        const res = await fetch(song.href);
        const html = await res.text();
        const parser = new DOMParser();
        const sdoc = parser.parseFromString(html, "text/html");
        const h1 = sdoc.querySelector("h1.titulo");
        const pre = sdoc.querySelector("pre");
        if (!h1 || !pre) continue;

        // Título (Heading1 simulado)
        children.push(new Paragraph({
            children: [new TextRun({ text: h1.textContent, bold: true, size: 32 })]
        }));

        // Texto
        let text = pre.textContent;
        if (mode === "lyrics") text = removeChords(text);

        text.split("\n").forEach(line => {
            children.push(new Paragraph({
                children: [new TextRun({ text: line, font: "Courier New", size: 24 })]
            }));
        });

        children.push(new Paragraph({ text: "" })); // espacio
    }

    doc.addSection({ children });
    const blob = await Packer.toBlob(doc);
    window.saveAs(blob, "cantoral.docx");
}

// Exponer funciones globalmente
window.addRow = addRow;
window.removeRow = removeRow;
document.getElementById("generate-btn").addEventListener("click", generateDoc);

// Inicializar
loadIndex();
