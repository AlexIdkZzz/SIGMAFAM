<?php
session_start();
if (!isset($_SESSION["user_id"])) { header("Location: login.html"); exit; }
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SIGMAFAM - Dashboard</title>

  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>

  <div class="topbar">
    <div class="brand">
      <span class="dot"></span>
      <div>
        <div class="title">SIGMAFAM</div>
        <div class="subtitle">Centro de monitoreo</div>
      </div>
    </div>

    <div class="userbox">
      <span class="username">👤 <?php echo htmlspecialchars($_SESSION["user_name"] ?? "Usuario"); ?></span>
      <a class="btn btn-ghost" href="/sigmafam/api/auth/logout.php">Salir</a>
    </div>
  </div>

  <div id="newAlertBanner" class="banner">
    🚨 <b>ALERTA NUEVA</b> detectada. Revisa el mapa y atiéndela.
  </div>

  <div class="layout">
    <section class="panel map-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Mapa</div>
          <div class="panel-sub">Marcador en la alerta más reciente</div>
        </div>
        <button class="btn btn-danger" onclick="crearAlerta()">Crear alerta</button>
      </div>
      <div id="map"></div>
    </section>

    <aside class="panel side-panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">Alertas</div>
          <div class="panel-sub">Actualiza cada 3 segundos</div>
        </div>
        <button class="btn btn-ghost" onclick="loadAlerts()">Refrescar</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Estado</th>
              <th style="text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody id="alertsBody"></tbody>
        </table>
      </div>
    </aside>
  </div>
    <span class="username">
    👤 <?php echo htmlspecialchars($_SESSION["user_name"] ?? "Usuario"); ?>
    <small style="opacity:.7; margin-left:8px;">
      (<?php echo htmlspecialchars($_SESSION["user_role"] ?? "FAMILY_MEMBER"); ?>)
    </small>
  </span>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="js/dashboard.js"></script>
</body>
</html>
