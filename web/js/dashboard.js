const map = L.map('map').setView([20.666082, -103.343879], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

let marker = null;
let lastSeenId = null;

function badge(status){
  const cls =
    status === 'recibida' ? 's-recibida' :
    status === 'atendida' ? 's-atendida' : 's-cerrada';

  return `<span class="badge ${cls}"><span class="pill"></span>${status}</span>`;
}

function showNewAlertBanner(show){
  const b = document.getElementById('newAlertBanner');
  b.classList.toggle('show', !!show);
}

async function loadAlerts() {
  const res = await fetch('/sigmafam/api/alerts_list.php');
  const alerts = await res.json();

  const tbody = document.getElementById('alertsBody');
  tbody.innerHTML = '';

  alerts.forEach(a => {
    const tr = document.createElement('tr');
    const disabledAtender = (a.status !== 'recibida');
    const disabledCerrar  = (a.status === 'cerrada');

    tr.innerHTML = `
      <td>#${a.id}</td>
      <td>${a.name}</td>
      <td>${badge(a.status)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-warn" onclick="setStatus(${a.id}, 'atendida')" ${disabledAtender ? 'disabled' : ''}>Atender</button>
          <button class="btn btn-ok" onclick="setStatus(${a.id}, 'cerrada')" ${disabledCerrar ? 'disabled' : ''}>Cerrar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (alerts.length > 0) {
    const newest = alerts[0];

    if (lastSeenId !== null && Number(newest.id) !== Number(lastSeenId)) {
      showNewAlertBanner(true);
      setTimeout(() => showNewAlertBanner(false), 5000);
    }
    lastSeenId = newest.id;

    const lat = parseFloat(newest.lat);
    const lng = parseFloat(newest.lng);

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng]).addTo(map)
      .bindPopup(`Alerta #${newest.id} • ${newest.status}`)
      .openPopup();

    map.setView([lat, lng], 15);
  }
}

async function setStatus(id, status) {
  await fetch('/sigmafam/api/alerts_update.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  });
  loadAlerts();
}

async function crearAlerta() {
  await fetch('/sigmafam/api/alerts_create.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 1, lat: 20.666082, lng: -103.343879, source: "web" })
  });
  loadAlerts();
}

loadAlerts();
setInterval(loadAlerts, 3000);
