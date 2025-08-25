document.getElementById("buscador").addEventListener("keyup", function () {
    let filtro = this.value.toLowerCase();
    let items = document.querySelectorAll("#lista li");
    items.forEach(li => {
        let texto = li.textContent.toLowerCase();
        li.style.display = texto.includes(filtro) ? "" : "none";
    });
});