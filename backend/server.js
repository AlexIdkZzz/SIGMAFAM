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

/**
 * GET /api/v1/stats  (JWT)
 * Devuelve métricas generales del sistema.
 */
app.get("/api/v1/stats", authRequired, async (req, res) => {
  try {
    // 1) Totales por estado
    const [byStatus] = await pool.execute(
      `SELECT status, COUNT(*) AS total
       FROM alerts
       GROUP BY status`
    );

    // 2) Alertas por día — últimos 30 días
    const [byDay] = await pool.execute(
      `SELECT DATE(created_at) AS day, COUNT(*) AS total
       FROM alerts
       WHERE created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(created_at)
       ORDER BY day ASC`
    );

    // 3) Alertas por origen
    const [bySource] = await pool.execute(
      `SELECT source, COUNT(*) AS total
       FROM alerts
       GROUP BY source`
    );

    // 4) Top ubicaciones con más alertas (para mapa de calor) :)
    const [hotspots] = await pool.execute(
      `SELECT
         ROUND(lat, 3) AS lat,
         ROUND(lng, 3) AS lng,
         COUNT(*) AS intensity
       FROM alert_locations
       GROUP BY ROUND(lat, 3), ROUND(lng, 3)
       ORDER BY intensity DESC
       LIMIT 50`
    );

    // 5) Tiempo promedio de atención (alertas cerradas)
    const [avgTime] = await pool.execute(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, closed_at)), 1) AS avg_minutes
       FROM alerts
       WHERE status = 'CLOSED' AND closed_at IS NOT NULL`
    );

    // 6) Total general
    const [total] = await pool.execute(
      `SELECT COUNT(*) AS total FROM alerts`
    );

    return res.json({
      total: total[0].total,
      avgResponseMinutes: avgTime[0].avg_minutes ?? 0,
      byStatus,
      byDay,
      bySource,
      hotspots,
    });
  } catch (e) {
    console.error("[Stats]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * VERIFICACIÓN DE EMAIL CON SENDGRID
 * - Al registrarse, el usuario recibe un código de 6 dígitos por correo.
 * ═══════════════════════════════════════════════════════════════
 */

const nodemailer = require("nodemailer");
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ── Helper: generar código de 6 dígitos ──────────────────────────
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Helper: enviar correo de verificación ────────────────────────
async function sendVerificationEmail(email, fullName, code) {
  await mailer.sendMail({
  from: `"SIGMAFAM" <${process.env.MAIL_USER}>`,
  to: email,
  subject: "Verifica tu cuenta — SIGMAFAM",
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="background:#0f172a;padding:24px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1e293b;border-radius:8px;padding:8px 12px;">
                          <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">SIGMAFAM</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">
                      Hola, ${fullName} 👋
                    </h1>
                    <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                      Gracias por registrarte en SIGMAFAM. Usa el siguiente código para verificar tu cuenta:
                    </p>
                    <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                      <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#0f172a;font-family:monospace;">
                        ${code}
                      </div>
                      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">
                        Este código expira en <strong>15 minutos</strong>
                      </p>
                    </div>
                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                      Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
                    <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
                      © 2026 SIGMAFAM · Sistema Integral de Seguridad Familiar
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
});
}

// ══════════════════════════════════════════════════════════════════
// MODIFICAR el endpoint de registro existente
// Reemplaza el app.post("/api/v1/auth/register") que ya tienes
// ══════════════════════════════════════════════════════════════════

app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};
    if (!full_name || !email || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const password_hash = await bcrypt.hash(password, 10);
    const code    = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, verified, verify_code, verify_expires)
       VALUES (:full_name, :email, :password_hash, 0, :code, :expires)`,
      { full_name, email, password_hash, code, expires }
    );

    // Enviar correo
    await sendVerificationEmail(email, full_name, code);

    return res.status(201).json({ ok: true, message: "Código enviado al correo" });
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "EMAIL_EXISTS" });
    console.error("[Register]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ══════════════════════════════════════════════════════════════════
// NUEVO endpoint: verificar código
// POST /api/v1/auth/verify
// Body: { email, code }
// ══════════════════════════════════════════════════════════════════

app.post("/api/v1/auth/verify", async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, verify_code, verify_expires, verified
       FROM users WHERE email = :email LIMIT 1`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(404).json({ error: "USER_NOT_FOUND" });
    if (u.verified) return res.status(400).json({ error: "ALREADY_VERIFIED" });

    // Verificar expiración
    if (new Date() > new Date(u.verify_expires))
      return res.status(400).json({ error: "CODE_EXPIRED" });

    // Verificar código
    if (u.verify_code !== code.trim())
      return res.status(400).json({ error: "INVALID_CODE" });

    // Activar cuenta
    await pool.execute(
      `UPDATE users
       SET verified = 1, verify_code = NULL, verify_expires = NULL
       WHERE id = :id`,
      { id: u.id }
    );

    // Generar JWT para auto-login
    const access_token = jwt.sign(
      { id: u.id, email: u.email, fullName: u.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      access_token,
      user: { id: u.id, full_name: u.full_name, email: u.email },
    });
  } catch (e) {
    console.error("[Verify]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ══════════════════════════════════════════════════════════════════
// NUEVO endpoint: reenviar código
// POST /api/v1/auth/resend
// Body: { email }
// ══════════════════════════════════════════════════════════════════

app.post("/api/v1/auth/resend", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name, verified FROM users WHERE email = :email LIMIT 1`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(404).json({ error: "USER_NOT_FOUND" });
    if (u.verified) return res.status(400).json({ error: "ALREADY_VERIFIED" });

    const code    = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
      `UPDATE users SET verify_code = :code, verify_expires = :expires WHERE id = :id`,
      { code, expires, id: u.id }
    );

    await sendVerificationEmail(email, u.full_name, code);

    return res.json({ ok: true, message: "Código reenviado" });
  } catch (e) {
    console.error("[Resend]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ══════════════════════════════════════════════════════════════════
// MODIFICAR el endpoint de login para bloquear no verificados
// Reemplaza el app.post("/api/v1/auth/login") que ya tienes
// ══════════════════════════════════════════════════════════════════

app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, verified FROM users WHERE email = :email`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    // Bloquear si no verificado
    if (!u.verified)
      return res.status(403).json({ error: "EMAIL_NOT_VERIFIED" });

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
    console.error("[Login]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SIGMAFAM API running → http://localhost:${PORT}`);
});