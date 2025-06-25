document.addEventListener("DOMContentLoaded", () => {
    fetch("https://cambiosorion.cl/data/posiciones.php")
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#posiciones table tbody");
            tbody.innerHTML = ""; // Limpiar cualquier fila previa

            data.forEach(item => {
                const tr = document.createElement("tr");
                tr.className = "border-b bg-white border-gray-700 text-gray-700";
                tr.innerHTML = `
                    <td class="px-4 py-2">
                        <img src="${item.icono}" alt="${item.divisa}" class="w-6 h-6 rounded-full border border-gray-400" />
                    </td>
                    <td class="px-4 py-2">${item.divisa}</td>
                    <td class="px-4 py-2">${Number(item.cantidad).toLocaleString("es-CL")}</td>
                    <td class="px-4 py-2">$ ${Number(item.pmp).toLocaleString("es-CL", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6
                    })}</td>
                    <td class="px-4 py-2">$ ${Number(item.total).toLocaleString("es-CL")}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error("Error al cargar posiciones:", err);
        });
});