const showOld = document.getElementById("showOld");
const showNew = document.getElementById("showNew");
const showAutor = document.getElementById("showAutor");

function actualizarData() {
    document.querySelectorAll("li").forEach(li => {
        const a = li.querySelector("a");

        let span = a.querySelector(".numero");

        if (!span) {
            span = document.createElement("span");
            span.className = "numero";
            a.appendChild(span);
        }

        const oldNum = li.dataset.nold;
        const newNum = li.dataset.nnew;
        const author = li.dataset.author;

        let texto = "";

        if (showOld.checked && oldNum) {
            texto += ` [${oldNum}]`;
        }

        if (showNew.checked && newNum) {
            texto += ` (${newNum})`;
        }

        if (showAutor.checked && author) {
            texto += ` — ${author}`;
        }

        span.textContent = texto;
    });
}

showOld.addEventListener("change", actualizarData);
showNew.addEventListener("change", actualizarData);
showAutor.addEventListener("change", actualizarData);

actualizarData();