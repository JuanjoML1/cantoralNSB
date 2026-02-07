const SONG_DB = [];

// Cargar index.html y generar lista de canciones
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

// Buscar canción en SONG_DB
function findSong(title) {
    return SONG_DB.find(s => s.title === title);
}

// Quitar acordes
function removeChords(text) {
    return text.replace(
        /\b(Do#|Re#|Fa#|Sol#|La#|Reb|Mib|Solb|Lab|Sib|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(m|maj7|7|sus4|sus2|dim|aug)?\b/g,
        ""
    );
}

// Generar archivo TXT o DOC
async function generateFile() {
    const rows = document.querySelectorAll(".song-row input");
    const mode = document.querySelector("input[name=mode]:checked").value;
    const format = document.getElementById("format").value;

    if (format === "txt") {
        let content = "";
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

            content += h1.textContent + "\n";
            let text = pre.textContent;
            if (mode === "lyrics") text = removeChords(text);
            content += text + "\n\n";
        }

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "cantoral.txt");
    } else { // Word (.doc)
        let html = "<html><head><meta charset='UTF-8'></head><body>";
        for (const input of rows) {
            const title = input.value.trim();
            if (!title) continue;
            const song = findSong(title);
            if (!song) {
                alert("No encontrada: " + title);
                return;
            }
            const res = await fetch(song.href);
            const htmlText = await res.text();
            const parser = new DOMParser();
            const sdoc = parser.parseFromString(htmlText, "text/html");
            const h1 = sdoc.querySelector("h1.titulo");
            const pre = sdoc.querySelector("pre");
            if (!h1 || !pre) continue;

            html += `<h1>${h1.textContent}</h1>`;
            let text = pre.textContent;
            if (mode === "lyrics") text = removeChords(text);
            html += `<pre>${text}</pre>`;
        }
        html += "</body></html>";
        const blob = new Blob([html], { type: "application/msword" });
        saveAs(blob, "cantoral.doc");
    }
}

// Hacer funciones globales y evento
window.addRow = addRow;
window.removeRow = removeRow;
document.getElementById("generate-btn").addEventListener("click", generateFile);

// Inicializar
loadIndex();
