require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { authRequired } = require("./middleware/auth");
const { pool } = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

/* ═══════════════════════════ AUTH ═══════════════════════════ */

app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};
    if (!full_name || !email || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const password_hash = await bcrypt.hash(password, 10);

    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES (:full_name, :email, :password_hash)`,
      { full_name, email, password_hash }
    );

    return res.status(201).json({ ok: true });
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "EMAIL_EXISTS" });
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash FROM users WHERE email = :email`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const access_token = jwt.sign(
      { id: u.id, email: u.email, fullName: u.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      access_token,
      user: { id: u.id, full_name: u.full_name, email: u.email },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ DEVICES ═══════════════════════════ */

app.post("/api/v1/devices/claim", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { device_uid, device_token } = req.body || {};
    if (!device_uid || !device_token)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [has] = await pool.execute(
      `SELECT id FROM devices WHERE user_id = :userId LIMIT 1`,
      { userId }
    );
    if (has.length)
      return res.status(409).json({ error: "USER_ALREADY_HAS_DEVICE" });

    const [devRows] = await pool.execute(
      `SELECT id, user_id FROM devices WHERE device_uid = :device_uid LIMIT 1`,
      { device_uid }
    );

    if (devRows.length) {
      const dev = devRows[0];
      if (dev.user_id && dev.user_id !== userId)
        return res.status(409).json({ error: "DEVICE_ALREADY_CLAIMED" });

      await pool.execute(
        `UPDATE devices SET user_id = :userId, device_token = :device_token WHERE id = :id`,
        { userId, device_token, id: dev.id }
      );
      return res.status(201).json({ ok: true });
    }

    await pool.execute(
      `INSERT INTO devices (device_uid, device_token, user_id)
       VALUES (:device_uid, :device_token, :userId)`,
      { device_uid, device_token, userId }
    );
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ ALERTS ═══════════════════════════ */

/**
 * GET /api/v1/alerts/active  (JWT)
 * Alertas en curso: RECEIVED | ACTIVE | ATTENDED
 */
app.get("/api/v1/alerts/active", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         a.id, a.source, a.status, a.created_at,
         u.full_name AS user_name,
         al.lat, al.lng, al.recorded_at
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN alert_locations al ON al.id = (
         SELECT id FROM alert_locations
         WHERE alert_id = a.id
         ORDER BY recorded_at DESC
         LIMIT 1
       )
       WHERE a.status IN ('RECEIVED','ACTIVE','ATTENDED')
       ORDER BY a.created_at DESC`
    );

    return res.json({ alerts: _mapAlerts(rows) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/alerts/history  (JWT)
 * Historial completo — todas las alertas con paginación opcional.
 *
 * Query params:
 *   page    (default 1)
 *   limit   (default 20, max 100)
 *   status  (opcional: RECEIVED | ACTIVE | ATTENDED | CLOSED)
 *   source  (opcional: IOT | WEB)
 */
app.get("/api/v1/alerts/history", authRequired, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? 1));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status?.toUpperCase();
    const sourceFilter = req.query.source?.toUpperCase();

    const validStatuses = ["RECEIVED", "ACTIVE", "ATTENDED", "CLOSED"];
    const validSources  = ["IOT", "WEB"];

    // Construir WHERE dinámico con ? en lugar de named placeholders
    const conditions = ["1=1"];
    const params     = [];

    if (statusFilter && validStatuses.includes(statusFilter)) {
      conditions.push("a.status = ?");
      params.push(statusFilter);
    }
    if (sourceFilter && validSources.includes(sourceFilter)) {
      conditions.push("a.source = ?");
      params.push(sourceFilter);
    }

    const where = conditions.join(" AND ");

    // Total para paginación
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM alerts a WHERE ${where}`,
      params
    );
    const total = countRows[0].total;

    // Registros — LIMIT y OFFSET como ? para evitar bug de mysql2 con namedPlaceholders
    const [rows] = await pool.execute(
      `SELECT
         a.id, a.source, a.status, a.created_at, a.closed_at,
         u.full_name AS user_name,
         al.lat, al.lng, al.recorded_at
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN alert_locations al ON al.id = (
         SELECT id FROM alert_locations
         WHERE alert_id = a.id
         ORDER BY recorded_at DESC
         LIMIT 1
       )
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
            params
    );

    return res.json({
      alerts: _mapAlerts(rows, true),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/alerts  (JWT)
 * Crea alerta desde web con ubicación opcional.
 */
app.post("/api/v1/alerts", authRequired, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { lat, lng } = req.body || {};

    await conn.beginTransaction();

    const [ins] = await conn.execute(
      `INSERT INTO alerts (user_id, source, status) VALUES (:userId, 'WEB', 'ACTIVE')`,
      { userId }
    );
    const alertId = ins.insertId;

    if (typeof lat === "number" && typeof lng === "number") {
      await conn.execute(
        `INSERT INTO alert_locations (alert_id, lat, lng) VALUES (:alertId, :lat, :lng)`,
        { alertId, lat, lng }
      );
    }

    await conn.commit();
    return res.status(201).json({ alert_id: alertId });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});

/**
 * PATCH /api/v1/alerts/:id/status  (JWT)
 */
app.patch("/api/v1/alerts/:id/status", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!id || !status) return res.status(400).json({ error: "MISSING_FIELDS" });

    const allowed = ["RECEIVED", "ACTIVE", "ATTENDED", "CLOSED"];
    if (!allowed.includes(status))
      return res.status(400).json({ error: "INVALID_STATUS" });

    await pool.execute(
      `UPDATE alerts
       SET status    = :status,
           closed_at = CASE WHEN :status = 'CLOSED' THEN CURRENT_TIMESTAMP ELSE closed_at END
       WHERE id = :id`,
      { status, id }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ HELPERS ═══════════════════════════ */

function _mapAlerts(rows, includeClosedAt = false) {
  return rows.map((r) => ({
    id: r.id,
    user: r.user_name,
    source: r.source,
    status: r.status,
    createdAt: r.created_at,
    ...(includeClosedAt && { closedAt: r.closed_at ?? null }),
    lastLocation:
      r.lat != null
        ? { lat: Number(r.lat), lng: Number(r.lng), at: r.recorded_at }
        : null,
  }));
}

/* ═══════════════════════════ START ═══════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   AGREGAR ESTE BLOQUE EN server.js ANTES DE app.listen(...)
   ═══════════════════════════════════════════════════════════════

   Endpoint exclusivo para dispositivos IoT.
   Autenticación por device_uid + device_token (sin JWT).
   Body: { device_uid, device_token, battery?, lat?, lng? }
*/

app.post("/api/v1/iot/alert", async (req, res) => {
  try {
    const { device_uid, device_token, battery, lat, lng } = req.body || {};

    if (!device_uid || !device_token)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    // 1) Verificar que el dispositivo existe y el token es correcto
    const [devRows] = await pool.execute(
      `SELECT id, user_id FROM devices
       WHERE device_uid = :device_uid AND device_token = :device_token
       LIMIT 1`,
      { device_uid, device_token }
    );

    if (!devRows.length)
      return res.status(401).json({ error: "INVALID_DEVICE" });

    const device = devRows[0];

    if (!device.user_id)
      return res.status(403).json({ error: "DEVICE_NOT_CLAIMED" });

    // 2) Actualizar last_seen_at y batería del dispositivo
    await pool.execute(
      `UPDATE devices
       SET last_seen_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      { id: device.id }
    );

    // 3) Crear la alerta
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [ins] = await conn.execute(
        `INSERT INTO alerts (user_id, device_id, source, status)
         VALUES (:userId, :deviceId, 'IOT', 'RECEIVED')`,
        { userId: device.user_id, deviceId: device.id }
      );
      const alertId = ins.insertId;

      // Ubicación opcional
      if (typeof lat === "number" && typeof lng === "number") {
        await conn.execute(
          `INSERT INTO alert_locations (alert_id, lat, lng)
           VALUES (:alertId, :lat, :lng)`,
          { alertId, lat, lng }
        );
      }

      await conn.commit();

      console.log(`[IoT] Alerta #${alertId} recibida del dispositivo ${device_uid}`);

      return res.status(201).json({
        ok: true,
        alert_id: alertId,
        message: "Alerta registrada correctamente",
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    console.error("[IoT] Error:", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});


/* ═══════════════════════════════════════════════════════════════
   TAMBIÉN AGREGAR: endpoint para registrar un dispositivo nuevo
   desde la app web (Device.jsx)
   POST /api/v1/devices/register  — crea el device_uid y token
   ═══════════════════════════════════════════════════════════════ */

const crypto = require("crypto");

app.post("/api/v1/devices/register", async (req, res) => {
  try {
    // Genera un UID y token únicos
    const device_uid   = "SFAM-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const device_token = crypto.randomBytes(16).toString("hex");

    await pool.execute(
      `INSERT INTO devices (device_uid, device_token)
       VALUES (:device_uid, :device_token)`,
      { device_uid, device_token }
    );

    return res.status(201).json({ device_uid, device_token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SIGMAFAM API running → http://localhost:${PORT}`);
});