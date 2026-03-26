require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { authRequired } = require("./middleware/auth");
const { pool } = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

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

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, fullName, code) {
  await resend.emails.send({
    from: "SIGMAFAM <onboarding@resend.dev>",
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

async function auditLog(eventType, userId, description, metadata = null) {
  try {
    await pool.execute(
      `INSERT INTO audit_logs (event_type, user_id, description, metadata)
       VALUES (:eventType, :userId, :description, :metadata)`,
      {
        eventType,
        userId: userId ?? null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    );
  } catch (e) {
    console.error("[AuditLog] Error al registrar:", e.message);
  }
}

/* ═══════════════════════════ AUTH ═══════════════════════════ */

app.post("/api/v1/auth/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body || {};
    if (!full_name || !email || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const password_hash = await bcrypt.hash(password, 10);
    const code    = generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, verified, verify_code, verify_expires)
       VALUES (:full_name, :email, :password_hash, 0, :code, :expires)`,
      { full_name, email, password_hash, code, expires }
    );

    await auditLog("USER_REGISTER", null, `Nuevo usuario registrado: ${email}`, { email });
    await sendVerificationEmail(email, full_name, code);

    return res.status(201).json({ ok: true, message: "Código enviado al correo" });
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "EMAIL_EXISTS" });
    console.error("[Register]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/v1/auth/verify", async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, role, verify_code, verify_expires, verified
      FROM users WHERE email = :email LIMIT 1`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(404).json({ error: "USER_NOT_FOUND" });
    if (u.verified) return res.status(400).json({ error: "ALREADY_VERIFIED" });

    if (new Date() > new Date(u.verify_expires))
      return res.status(400).json({ error: "CODE_EXPIRED" });

    if (u.verify_code !== code.trim())
      return res.status(400).json({ error: "INVALID_CODE" });

    await pool.execute(
      `UPDATE users SET verified = 1, verify_code = NULL, verify_expires = NULL WHERE id = :id`,
      { id: u.id }
    );

    await auditLog("USER_VERIFIED", u.id, `Cuenta verificada: ${u.email}`);

    const access_token = jwt.sign(
      { id: u.id, email: u.email, fullName: u.full_name, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      access_token,
      user: { id: u.id, full_name: u.full_name, email: u.email, role: u.role },
    });
  } catch (e) {
    console.error("[Verify]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

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

app.post("/api/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, password_hash, role, verified FROM users WHERE email = :email`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    if (!u.verified)
      return res.status(403).json({ error: "EMAIL_NOT_VERIFIED" });

    const access_token = jwt.sign(
      { id: u.id, email: u.email, fullName: u.full_name, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await auditLog("LOGIN", u.id, `Inicio de sesión: ${u.email}`, { ip: req.ip });

    return res.json({
      access_token,
      user: { id: u.id, full_name: u.full_name, email: u.email, role: u.role },
    });
  } catch (e) {
    console.error("[Login]", e);
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

app.post("/api/v1/devices/register", async (req, res) => {
  try {
    const device_uid   = "SFAM-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const device_token = crypto.randomBytes(16).toString("hex");

    await pool.execute(
      `INSERT INTO devices (device_uid, device_token) VALUES (:device_uid, :device_token)`,
      { device_uid, device_token }
    );

    await auditLog("DEVICE_REGISTER", null, `Nuevo dispositivo registrado: ${device_uid}`, { device_uid });

    return res.status(201).json({ device_uid, device_token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ ALERTS ═══════════════════════════ */

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

app.get("/api/v1/alerts/history", authRequired, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? 1));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status?.toUpperCase();
    const sourceFilter = req.query.source?.toUpperCase();

    const validStatuses = ["RECEIVED", "ACTIVE", "ATTENDED", "CLOSED"];
    const validSources  = ["IOT", "WEB"];

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

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM alerts a WHERE ${where}`,
      params
    );
    const total = countRows[0].total;

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
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

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

    await auditLog("ALERT_STATUS_CHANGE", req.user.id,
      `Alerta #${id} cambió a ${status}`, { alertId: id, newStatus: status });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ IOT ═══════════════════════════ */

app.post("/api/v1/iot/alert", async (req, res) => {
  try {
    const { device_uid, device_token, lat, lng } = req.body || {};

    if (!device_uid || !device_token)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    const [devRows] = await pool.execute(
      `SELECT id, user_id FROM devices
       WHERE device_uid = :device_uid AND device_token = :device_token LIMIT 1`,
      { device_uid, device_token }
    );

    if (!devRows.length)
      return res.status(401).json({ error: "INVALID_DEVICE" });

    const device = devRows[0];

    if (!device.user_id)
      return res.status(403).json({ error: "DEVICE_NOT_CLAIMED" });

    await pool.execute(
      `UPDATE devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = :id`,
      { id: device.id }
    );

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [ins] = await conn.execute(
        `INSERT INTO alerts (user_id, device_id, source, status)
         VALUES (:userId, :deviceId, 'IOT', 'RECEIVED')`,
        { userId: device.user_id, deviceId: device.id }
      );
      const alertId = ins.insertId;

      if (typeof lat === "number" && typeof lng === "number") {
        await conn.execute(
          `INSERT INTO alert_locations (alert_id, lat, lng) VALUES (:alertId, :lat, :lng)`,
          { alertId, lat, lng }
        );
      }

      await conn.commit();

      await auditLog("IOT_ALERT", device.user_id,
        `Alerta IoT recibida del dispositivo ${device_uid}`, { device_uid, alertId });

      console.log(`[IoT] Alerta #${alertId} recibida del dispositivo ${device_uid}`);

      return res.status(201).json({ ok: true, alert_id: alertId, message: "Alerta registrada correctamente" });
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

/* ═══════════════════════════ STATS ═══════════════════════════ */

app.get("/api/v1/stats", authRequired, async (req, res) => {
  try {
    const [byStatus] = await pool.execute(`SELECT status, COUNT(*) AS total FROM alerts GROUP BY status`);
    const [byDay]    = await pool.execute(
      `SELECT DATE(created_at) AS day, COUNT(*) AS total
       FROM alerts
       WHERE created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(created_at)
       ORDER BY day ASC`
    );
    const [bySource] = await pool.execute(`SELECT source, COUNT(*) AS total FROM alerts GROUP BY source`);
    const [hotspots] = await pool.execute(
      `SELECT ROUND(lat, 3) AS lat, ROUND(lng, 3) AS lng, COUNT(*) AS intensity
       FROM alert_locations
       GROUP BY ROUND(lat, 3), ROUND(lng, 3)
       ORDER BY intensity DESC
       LIMIT 50`
    );
    const [avgTime] = await pool.execute(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, closed_at)), 1) AS avg_minutes
       FROM alerts WHERE status = 'CLOSED' AND closed_at IS NOT NULL`
    );
    const [total] = await pool.execute(`SELECT COUNT(*) AS total FROM alerts`);

    return res.json({
      total: total[0].total,
      avgResponseMinutes: avgTime[0].avg_minutes ?? 0,
      byStatus, byDay, bySource, hotspots,
    });
  } catch (e) {
    console.error("[Stats]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ AUDIT ═══════════════════════════ */

app.get("/api/v1/audit", authRequired, async (req, res) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page  ?? 1));
    const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 30)));
    const offset    = (page - 1) * limit;
    const eventType = req.query.event_type?.toUpperCase();

    const conditions = ["1=1"];
    const params     = [];

    if (eventType) {
      conditions.push("al.event_type = ?");
      params.push(eventType);
    }

    const where = conditions.join(" AND ");

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_logs al WHERE ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT
         al.id, al.event_type, al.description, al.metadata, al.created_at,
         u.full_name AS user_name, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      logs: rows.map((r) => ({
        id:          r.id,
        eventType:   r.event_type,
        description: r.description,
        metadata: r.metadata
          ? (typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata)
          : null,
        createdAt:   r.created_at,
        user:        r.user_name ?? "Sistema",
        email:       r.user_email ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[Audit]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════════════════════════════════════════
   ENDPOINTS DE GRUPOS FAMILIARES
   Agregar en server.js antes de app.listen()
   ═══════════════════════════════════════════════════════════════ */

// ── Helper: generar código de invitación ────────────────────────
function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // ej: A3F9B2C1
}

/**
 * POST /api/v1/family/create  (JWT)
 * Crea un grupo familiar. Solo si el usuario no pertenece a uno.
 * Body: { name }
 */
app.post("/api/v1/family/create", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: "MISSING_FIELDS" });

    // Verificar que no tenga ya un grupo
    const [existing] = await pool.execute(
      `SELECT id FROM users WHERE id = :userId AND family_group_id IS NOT NULL LIMIT 1`,
      { userId }
    );
    if (existing.length)
      return res.status(409).json({ error: "ALREADY_IN_GROUP" });

    const invite_code = generateInviteCode();

    const [ins] = await pool.execute(
      `INSERT INTO family_groups (name, owner_id, invite_code)
       VALUES (:name, :userId, :invite_code)`,
      { name: name.trim(), userId, invite_code }
    );
    const groupId = ins.insertId;

    // Asignar al creador como JEFE_FAMILIA
    await pool.execute(
      `UPDATE users SET role = 'JEFE_FAMILIA', family_group_id = :groupId WHERE id = :userId`,
      { groupId, userId }
    );

    await auditLog("FAMILY_CREATE", userId, `Grupo familiar creado: ${name}`, { groupId, invite_code });

    return res.status(201).json({ ok: true, group_id: groupId, invite_code });
  } catch (e) {
    console.error("[Family/Create]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/family/join  (JWT)
 * Unirse a un grupo con código de invitación.
 * Body: { invite_code }
 */
app.post("/api/v1/family/join", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { invite_code } = req.body || {};
    if (!invite_code?.trim()) return res.status(400).json({ error: "MISSING_FIELDS" });

    // Verificar que no tenga ya un grupo
    const [userRows] = await pool.execute(
      `SELECT family_group_id FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    if (userRows[0]?.family_group_id)
      return res.status(409).json({ error: "ALREADY_IN_GROUP" });

    // Buscar el grupo por código
    const [groupRows] = await pool.execute(
      `SELECT id, name FROM family_groups WHERE invite_code = :invite_code LIMIT 1`,
      { invite_code: invite_code.trim().toUpperCase() }
    );
    if (!groupRows.length)
      return res.status(404).json({ error: "INVALID_CODE" });

    const group = groupRows[0];

    // Verificar límite de 6 miembros
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users WHERE family_group_id = :groupId`,
      { groupId: group.id }
    );
    if (Number(countRows[0].total) >= 6)
      return res.status(409).json({ error: "GROUP_FULL" });

    // Unir al usuario como MIEMBRO
    await pool.execute(
      `UPDATE users SET role = 'MIEMBRO', family_group_id = :groupId WHERE id = :userId`,
      { groupId: group.id, userId }
    );

    await auditLog("FAMILY_JOIN", userId, `Se unió al grupo: ${group.name}`, { groupId: group.id });

    return res.json({ ok: true, group_name: group.name });
  } catch (e) {
    console.error("[Family/Join]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/family  (JWT)
 * Info del grupo familiar del usuario autenticado.
 */
app.get("/api/v1/family", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.execute(
      `SELECT family_group_id, role FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const u = userRows[0];
    if (!u?.family_group_id)
      return res.json({ group: null });

    const [groupRows] = await pool.execute(
      `SELECT id, name, invite_code, created_at FROM family_groups WHERE id = :id LIMIT 1`,
      { id: u.family_group_id }
    );
    const group = groupRows[0];

    const [members] = await pool.execute(
      `SELECT id, full_name, email, role, created_at
       FROM users WHERE family_group_id = :groupId ORDER BY created_at ASC`,
      { groupId: group.id }
    );

    return res.json({
      group: {
        id:          group.id,
        name:        group.name,
        invite_code: u.role === "JEFE_FAMILIA" ? group.invite_code : null,
        created_at:  group.created_at,
        members:     members.map((m) => ({
          id:        m.id,
          fullName:  m.full_name,
          email:     m.email,
          role:      m.role,
          joinedAt:  m.created_at,
        })),
      },
    });
  } catch (e) {
    console.error("[Family/Get]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/v1/family/members/:id  (JWT — solo JEFE_FAMILIA)
 * Expulsar a un miembro del grupo.
 */
app.delete("/api/v1/family/members/:id", authRequired, async (req, res) => {
  try {
    const userId   = req.user.id;
    const memberId = Number(req.params.id);

    // Verificar que el que ejecuta es JEFE_FAMILIA
    const [jefeRows] = await pool.execute(
      `SELECT role, family_group_id FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const jefe = jefeRows[0];
    if (jefe?.role !== "JEFE_FAMILIA")
      return res.status(403).json({ error: "FORBIDDEN" });

    // Verificar que el miembro pertenece al mismo grupo
    const [memberRows] = await pool.execute(
      `SELECT id FROM users WHERE id = :memberId AND family_group_id = :groupId LIMIT 1`,
      { memberId, groupId: jefe.family_group_id }
    );
    if (!memberRows.length)
      return res.status(404).json({ error: "MEMBER_NOT_FOUND" });

    await pool.execute(
      `UPDATE users SET role = 'JEFE_FAMILIA', family_group_id = NULL WHERE id = :memberId`,
      { memberId }
    );

    await auditLog("FAMILY_REMOVE", userId, `Miembro #${memberId} removido del grupo`);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Family/Remove]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/family/regenerate-code  (JWT — solo JEFE_FAMILIA)
 * Regenera el código de invitación.
 */
app.post("/api/v1/family/regenerate-code", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT role, family_group_id FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const u = rows[0];
    if (u?.role !== "JEFE_FAMILIA")
      return res.status(403).json({ error: "FORBIDDEN" });

    const invite_code = generateInviteCode();
    await pool.execute(
      `UPDATE family_groups SET invite_code = :invite_code WHERE id = :groupId`,
      { invite_code, groupId: u.family_group_id }
    );

    return res.json({ ok: true, invite_code });
  } catch (e) {
    console.error("[Family/Regenerate]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ START ═══════════════════════════ */

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SIGMAFAM API running → http://localhost:${PORT}`);
});