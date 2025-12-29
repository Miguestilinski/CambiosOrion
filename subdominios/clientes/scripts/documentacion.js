document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebar('documentacion');
    
    const user = await checkSession();
    if (!user) return;

    // Lógica de subida
    const form = document.getElementById('documentation-form');
    const statusMsg = document.getElementById('upload-status');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            
            btn.disabled = true;
            btn.textContent = "Subiendo...";
            statusMsg.textContent = "";

            try {
                const formData = new FormData(form);
                formData.append('id', user.cliente_id); // ID vital para el backend

                const res = await fetch('https://cambiosorion.cl/data/upload_documents.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                const result = await res.json();

                if (result.success) {
                    statusMsg.textContent = "¡Archivos subidos correctamente!";
                    statusMsg.className = "text-sm font-bold text-green-400";
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    throw new Error(result.message || "Error al subir");
                }
            } catch (err) {
                statusMsg.textContent = "Error: " + err.message;
                statusMsg.className = "text-sm font-bold text-red-400";
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }
});

// Copiar aquí loadSidebar y checkSession igual que en los anteriores
async function loadSidebar(activePageId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
        const response = await fetch('sidebar.html');
        container.innerHTML = await response.text();
        const activeLink = container.querySelector(`a[data-page="${activePageId}"]`);
        if (activeLink) {
            activeLink.classList.remove('text-gray-600');
            activeLink.classList.add('bg-blue-50', 'text-blue-700', 'font-bold');
        }
    } catch (e) { console.error("Error sidebar", e); }
}

async function checkSession() {
    try {
        const res = await fetch("https://cambiosorion.cl/data/session_status_clientes.php", { credentials: "include" });
        const data = await res.json();
        if (!data.isAuthenticated) { window.location.href = 'https://cambiosorion.cl/login'; return null; }
        return data;
    } catch (e) { return null; }
}