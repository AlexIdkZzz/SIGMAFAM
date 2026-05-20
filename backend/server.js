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

function generateInviteCode() {
  // Genera un código aleatorio de exactamente 8 dígitos numéricos
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function _sendWhatsApp(phone, userName, locationUrl) {
  const to = phone.replace(/^\+/, "");
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: process.env.META_WA_TEMPLATE_NAME ?? "sigmafam_alerta",
          language: { code: "es_MX" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: userName },
                { type: "text", text: locationUrl },
              ],
            },
          ],
        },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
}

/**
 * Envía mensajes de emergencia a los contactos del usuario via WhatsApp.
 * No lanza error si falla — la alerta ya se creó, el mensaje es best-effort.
 */
async function sendEmergencyMessages(userId, userName, lat, lng) {
  try {
    const [contacts] = await pool.execute(
      `SELECT name, phone FROM emergency_contacts WHERE user_id = :userId`,
      { userId }
    );

    if (!contacts.length) return;

    const locationUrl = lat && lng
      ? `https://maps.google.com/?q=${lat},${lng}`
      : "no disponible";

    for (const contact of contacts) {
      try {
        const phone = contact.phone.startsWith("+") ? contact.phone : `+${contact.phone}`;
        await _sendWhatsApp(phone, userName, locationUrl);
        console.log(`[Meta WA] Mensaje enviado a ${contact.name}`);
      } catch (err) {
        console.error(`[Meta WA] Error al enviar a ${contact.name}:`, err.message);
      }
    }
  } catch (e) {
    console.error("[Mensajes] Error general:", e.message);
  }
}

/**
 * Envía correos de emergencia a TODOS los miembros del grupo familiar del usuario.
 * Incluye mapa estático, hora, lugar y enlace directo a la alerta.
 * Best-effort: no lanza error si falla.
 */
async function sendEmergencyEmails(userId, userName, alertId, lat, lng, source = "WEB") {
  try {
    // 1. Obtener el grupo familiar del usuario que activó la alerta
    const [userRows] = await pool.execute(
      `SELECT family_group_id, email FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const triggerer = userRows[0];
    if (!triggerer) return;

    // 2. Obtener todos los miembros del grupo (o solo el usuario si no tiene grupo)
    let recipients = [];
    if (triggerer.family_group_id) {
      const [members] = await pool.execute(
        `SELECT full_name, email FROM users
         WHERE family_group_id = :groupId AND id != :userId`,
        { groupId: triggerer.family_group_id, userId }
      );
      recipients = members;
    }

    // Si no hay otros miembros no hay a quién notificar por email
    if (!recipients.length) return;

    // 3. Preparar datos del correo
    const now = new Date();
    const timeStr = now.toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true,
    });

    const hasLocation = typeof lat === "number" && typeof lng === "number";
    const mapsUrl     = hasLocation
      ? `https://maps.google.com/?q=${lat},${lng}`
      : null;

    // Mapa estático via OpenStreetMap + staticmap (sin API key)
    const staticMapUrl = hasLocation
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x300&maptype=mapnik&markers=${lat},${lng},red-pushpin`
      : null;

    const alertUrl    = `${process.env.APP_URL ?? "https://sigmafam.up.railway.app"}/app/alerts`;
    const sourceLabel = source === "IOT" ? "Dispositivo IoT (botón físico)" : "Aplicación web";
    const locationText = hasLocation
      ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      : "No disponible";

    // 4. HTML del correo
    const buildHtml = (recipientName) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⚠️ Alerta de emergencia — SIGMAFAM</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header rojo de alerta -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:12px;">⚠️</div>
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ALERTA DE EMERGENCIA</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:0.05em;">SIGMAFAM · Sistema de Seguridad Familiar</p>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:15px;color:#475569;">
                Hola <strong style="color:#0f172a;">${recipientName}</strong>, un miembro de tu grupo familiar ha activado una alerta de emergencia.
              </p>
            </td>
          </tr>

          <!-- Tarjeta de datos de la alerta -->
          <tr>
            <td style="padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #fecaca;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#ef4444;">Quién activó la alerta</p>
                    <p style="margin:0;font-size:18px;font-weight:800;color:#0f172a;">${userName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #fecaca;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#ef4444;">Cuándo</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;">${timeStr} (hora Ciudad de México)</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #fecaca;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#ef4444;">Origen</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;">${sourceLabel}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#ef4444;">Coordenadas GPS</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#1e293b;font-family:monospace;">${locationText}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${staticMapUrl ? `
          <!-- Mapa estático -->
          <tr>
            <td style="padding:0 32px 20px;">
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;">Ubicación aproximada</p>
              <a href="${mapsUrl}" target="_blank" style="display:block;border-radius:12px;overflow:hidden;border:1.5px solid #e2e8f0;text-decoration:none;">
                <img
                  src="${staticMapUrl}"
                  alt="Mapa de la ubicación de la alerta"
                  width="516"
                  style="display:block;width:100%;height:auto;max-height:260px;object-fit:cover;"
                />
                <div style="background:#f8fafc;padding:10px 14px;text-align:center;">
                  <span style="font-size:11px;color:#64748b;font-weight:600;">🗺 Ver en Google Maps →</span>
                </div>
              </a>
            </td>
          </tr>
          ` : `
          <!-- Sin ubicación -->
          <tr>
            <td style="padding:0 32px 20px;">
              <div style="background:#f8fafc;border:1.5px dashed #cbd5e1;border-radius:12px;padding:20px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#94a3b8;">📍 No se registraron coordenadas GPS en esta alerta</p>
              </div>
            </td>
          </tr>
          `}

          <!-- CTA: Ver alerta -->
          <tr>
            <td style="padding:0 32px 28px;text-align:center;">
              <a
                href="${alertUrl}"
                target="_blank"
                style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(220,38,38,0.35);"
              >
                Ver alerta en SIGMAFAM →
              </a>
              <p style="margin:12px 0 0;font-size:11px;color:#94a3b8;">Alerta #${alertId} · Accede a la plataforma para gestionarla</p>
            </td>
          </tr>

          <!-- Divisor -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
                Recibiste este correo porque formas parte de un grupo familiar en <strong>SIGMAFAM</strong>.
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">
                © 2026 SIGMAFAM · Sistema Integral de Seguridad Familiar · CETI Tonalá
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // 5. Enviar a cada miembro del grupo
    for (const member of recipients) {
      try {
        await resend.emails.send({
          from: "SIGMAFAM Alertas <noreply@castoresceti.com>",
          to: member.email,
          subject: `⚠️ ${userName} activó una alerta de emergencia`,
          html: buildHtml(member.full_name),
        });
        console.log(`[Email] Alerta #${alertId} enviada a ${member.email}`);
      } catch (err) {
        console.error(`[Email] Error al enviar a ${member.email}:`, err.message);
      }
    }
  } catch (e) {
    console.error("[Email] Error general:", e.message);
  }
}

/**
 * Devuelve los IDs de usuarios relevantes para el scope del usuario autenticado.
 * - Si tiene grupo familiar → todos los miembros del grupo
 * - Si no tiene grupo → solo él mismo
 */
async function _getScopeUserIds(userId) {
  const [rows] = await pool.execute(
    `SELECT family_group_id FROM users WHERE id = :userId LIMIT 1`,
    { userId }
  );
  const groupId = rows[0]?.family_group_id;

  if (!groupId) return [userId];

  const [members] = await pool.execute(
    `SELECT id FROM users WHERE family_group_id = :groupId`,
    { groupId }
  );
  return members.map((m) => m.id);
}

async function sendVerificationEmail(email, fullName, code) {
  await resend.emails.send({
    from: "SIGMAFAM <noreply@castoresceti.com>",
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

/**
 * POST /api/v1/auth/forgot-password
 * Genera un código de recuperación y lo envía por correo.
 */
app.post("/api/v1/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "MISSING_FIELDS" });

    const [rows] = await pool.execute(
      `SELECT id, full_name FROM users WHERE email = :email LIMIT 1`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const code    = generateCode();                              // 6 dígitos, ya existe en tu código
    const expires = new Date(Date.now() + 15 * 60 * 1000);      // 15 minutos

    await pool.execute(
      `UPDATE users SET reset_code = :code, reset_expires = :expires WHERE id = :id`,
      { code, expires, id: u.id }
    );

    await auditLog("PASSWORD_RESET_REQUEST", u.id,
      `Solicitud de recuperación de contraseña: ${email}`);

    // Reutilizamos Resend igual que en el correo de verificación
    await resend.emails.send({
      from: "SIGMAFAM <noreply@castoresceti.com>",
      to: email,
      subject: "Recupera tu contraseña — SIGMAFAM",
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                    <tr>
                      <td style="background:#0f172a;padding:24px 32px;">
                        <span style="background:#1e293b;border-radius:8px;padding:8px 12px;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">SIGMAFAM</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:32px;">
                        <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0f172a;">
                          Hola, ${u.full_name} 👋
                        </h1>
                        <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                          Recibimos una solicitud para restablecer tu contraseña. Usa este código:
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
                          Si no solicitaste esto, puedes ignorar este correo de forma segura.
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

    return res.json({ ok: true, message: "Código de recuperación enviado" });
  } catch (e) {
    console.error("[ForgotPassword]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/auth/reset-password
 * Valida el código y actualiza la contraseña.
 */
app.post("/api/v1/auth/reset-password", async (req, res) => {
  try {
    const { email, code, password } = req.body || {};
    if (!email || !code || !password)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    if (password.length < 6)
      return res.status(400).json({ error: "PASSWORD_TOO_SHORT" });

    const [rows] = await pool.execute(
      `SELECT id, reset_code, reset_expires FROM users WHERE email = :email LIMIT 1`,
      { email }
    );

    const u = rows[0];
    if (!u) return res.status(404).json({ error: "USER_NOT_FOUND" });

    if (!u.reset_code || !u.reset_expires)
      return res.status(400).json({ error: "CODE_EXPIRED" });

    if (new Date() > new Date(u.reset_expires))
      return res.status(400).json({ error: "CODE_EXPIRED" });

    if (u.reset_code !== code.trim())
      return res.status(400).json({ error: "INVALID_CODE" });

    const password_hash = await bcrypt.hash(password, 10);

    await pool.execute(
      `UPDATE users SET password_hash = :password_hash, reset_code = NULL, reset_expires = NULL WHERE id = :id`,
      { password_hash, id: u.id }
    );

    await auditLog("PASSWORD_RESET", u.id,
      `Contraseña restablecida para: ${email}`);

    return res.json({ ok: true, message: "Contraseña actualizada correctamente" });
  } catch (e) {
    console.error("[ResetPassword]", e);
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

/* ═══════════════════════════════════════════════════════════════
   ENDPOINTS DE DISPOSITIVOS IoT: generación, vinculación, desvinculación y recepción de alertas.
   ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/v1/devices/mine  (JWT)
 * Devuelve el dispositivo vinculado al usuario autenticado.
 */
app.get("/api/v1/devices/mine", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, device_uid, last_seen_at, created_at
       FROM devices WHERE user_id = :userId LIMIT 1`,
      { userId: req.user.id }
    );
    return res.json({ device: rows[0] ?? null });
  } catch (e) {
    console.error("[Device/Mine]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/devices/generate  (JWT)
 * Genera un nuevo dispositivo con uid y token únicos.
 * Un usuario solo puede tener un dispositivo a la vez.
 */
app.post("/api/v1/devices/generate", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que no tenga ya uno
    const [existing] = await pool.execute(
      `SELECT id FROM devices WHERE user_id = :userId LIMIT 1`,
      { userId }
    );
    if (existing.length)
      return res.status(409).json({ error: "ALREADY_HAS_DEVICE" });

    const device_uid   = "SFAM-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const device_token = crypto.randomBytes(16).toString("hex");

    await pool.execute(
      `INSERT INTO devices (device_uid, device_token, user_id)
       VALUES (:device_uid, :device_token, :userId)`,
      { device_uid, device_token, userId }
    );

    await auditLog("DEVICE_REGISTER", userId,
      `Dispositivo generado: ${device_uid}`, { device_uid });

    return res.status(201).json({ device_uid, device_token });
  } catch (e) {
    console.error("[Device/Generate]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/v1/devices/mine  (JWT)
 * Desvincula el dispositivo del usuario autenticado.
 */
app.delete("/api/v1/devices/mine", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      `DELETE FROM devices WHERE user_id = :userId`,
      { userId }
    );

    await auditLog("DEVICE_UNLINK", userId, `Dispositivo desvinculado`);

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Device/Unlink]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/iot/alert  (device_uid + device_token)
 * Recibe alerta del dispositivo IoT.
 */

/* ═══════════════════════════ ALERTS ═══════════════════════════ */

app.get("/api/v1/alerts/active", authRequired, async (req, res) => {
  try {
    const userIds = await _getScopeUserIds(req.user.id);
    const placeholders = userIds.map(() => "?").join(",");

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
         AND a.user_id IN (${placeholders})
       ORDER BY a.created_at DESC`,
      userIds
    );
    return res.json({ alerts: _mapAlerts(rows) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.get("/api/v1/alerts/history", authRequired, async (req, res) => {
  try {
    const userIds = await _getScopeUserIds(req.user.id);
    const placeholders = userIds.map(() => "?").join(",");

    const page   = Math.max(1, parseInt(req.query.page  ?? 1));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 20)));
    const offset = (page - 1) * limit;

    const statusFilter = req.query.status?.toUpperCase();
    const sourceFilter = req.query.source?.toUpperCase();
    const dateFrom     = req.query.date_from; // YYYY-MM-DD
    const dateTo       = req.query.date_to;   // YYYY-MM-DD

    const validStatuses = ["RECEIVED", "ACTIVE", "ATTENDED", "CLOSED"];
    const validSources  = ["IOT", "WEB"];

    const conditions = [`a.user_id IN (${placeholders})`];
    const params     = [...userIds];

    if (statusFilter && validStatuses.includes(statusFilter)) {
      conditions.push("a.status = ?");
      params.push(statusFilter);
    }
    if (sourceFilter && validSources.includes(sourceFilter)) {
      conditions.push("a.source = ?");
      params.push(sourceFilter);
    }
    if (dateFrom) { conditions.push("DATE(a.created_at) >= ?"); params.push(dateFrom); }
    if (dateTo)   { conditions.push("DATE(a.created_at) <= ?"); params.push(dateTo); }

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

    // Enviar notificaciones en background (WhatsApp + Email)
    const [userRows] = await pool.execute(
      `SELECT full_name FROM users WHERE id = :userId LIMIT 1`, { userId }
    );
    const userName = userRows[0]?.full_name ?? "Un usuario";
    sendEmergencyMessages(userId, userName, lat, lng);
    sendEmergencyEmails(userId, userName, alertId, lat, lng, "WEB");

    return res.status(201).json({ alert_id: alertId });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  } finally {
    conn.release();
  }
});

app.get("/api/v1/alerts/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "INVALID_ID" });

    const userIds      = await _getScopeUserIds(req.user.id);
    const placeholders = userIds.map(() => "?").join(",");

    const [rows] = await pool.execute(
      `SELECT
         a.id, a.source, a.status, a.created_at, a.closed_at,
         a.battery,
         u.full_name AS user_name, u.email AS user_email,
         fg.name AS group_name,
         d.device_uid,
         al.lat, al.lng, al.recorded_at
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN family_groups fg ON fg.id = u.family_group_id
       LEFT JOIN devices d ON d.id = a.device_id
       LEFT JOIN alert_locations al ON al.id = (
         SELECT id FROM alert_locations
         WHERE alert_id = a.id
         ORDER BY recorded_at DESC
         LIMIT 1
       )
       WHERE a.id = ? AND a.user_id IN (${placeholders})`,
      [id, ...userIds]
    );

    if (!rows.length) return res.status(404).json({ error: "NOT_FOUND" });

    const r = rows[0];
    return res.json({
      alert: {
        id:        r.id,
        source:    r.source,
        status:    r.status,
        createdAt: r.created_at,
        closedAt:  r.closed_at ?? null,
        battery:   r.battery != null ? Number(r.battery) : null,
        user:      { name: r.user_name, email: r.user_email },
        group:     r.group_name ?? null,
        device:    r.device_uid ?? null,
        lastLocation: r.lat != null
          ? { lat: Number(r.lat), lng: Number(r.lng), at: r.recorded_at }
          : null,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "SERVER_ERROR" });
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

    if (status === "CLOSED") {
      await pool.execute(
        `UPDATE alerts SET status = ?, closed_at = NOW() WHERE id = ?`,
        [status, id]
      );
    } else {
      await pool.execute(
        `UPDATE alerts SET status = ? WHERE id = ?`,
        [status, id]
      );
    }

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
    const { device_uid, lat, lng, battery } = req.body || {};

    if (!device_uid)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    // battery debe ser entero 0-100; si no viene o es inválido se guarda NULL
    const batteryVal = (typeof battery === "number" && battery >= 0 && battery <= 100)
      ? Math.round(battery)
      : null;

    const [devRows] = await pool.execute(
      `SELECT id, user_id FROM devices
       WHERE device_uid = :device_uid LIMIT 1`,
      { device_uid }
    );

    if (!devRows.length)
      return res.status(401).json({ error: "INVALID_DEVICE" });

    const device = devRows[0];

    if (!device.user_id)
      return res.status(403).json({ error: "DEVICE_NOT_CLAIMED" });

    await pool.execute(
      `UPDATE devices
       SET last_seen_at  = CURRENT_TIMESTAMP,
           battery_level = :batteryVal
       WHERE id = :id`,
      { id: device.id, batteryVal }
    );

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [ins] = await conn.execute(
        `INSERT INTO alerts (user_id, device_id, source, status, battery)
         VALUES (:userId, :deviceId, 'IOT', 'RECEIVED', :batteryVal)`,
        { userId: device.user_id, deviceId: device.id, batteryVal }
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

      // Enviar notificaciones en background (WhatsApp + Email)
      const [userRows] = await pool.execute(
        `SELECT full_name FROM users WHERE id = :userId LIMIT 1`, { userId: device.user_id }
      );
      const userName = userRows[0]?.full_name ?? "Un usuario";
      sendEmergencyMessages(device.user_id, userName, lat, lng);
      sendEmergencyEmails(device.user_id, userName, alertId, lat, lng, "IOT");

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
    const isAdmin = req.user.role === "ADMIN";

    let alertsWhere, alertsParams, hotspotWhere, hotspotParams;
    if (isAdmin) {
      alertsWhere   = "1=1";
      alertsParams  = [];
      hotspotWhere  = "1=1";
      hotspotParams = [];
    } else {
      const userIds = await _getScopeUserIds(req.user.id);
      const ph = userIds.map(() => "?").join(",");
      alertsWhere   = `user_id IN (${ph})`;
      alertsParams  = userIds;
      hotspotWhere  = `a.user_id IN (${ph})`;
      hotspotParams = userIds;
    }

    const [byStatus] = await pool.execute(
      `SELECT status, COUNT(*) AS total FROM alerts WHERE ${alertsWhere} GROUP BY status`,
      alertsParams
    );
    const [byDay] = await pool.execute(
      `SELECT DATE(created_at) AS day, COUNT(*) AS total
       FROM alerts
       WHERE ${alertsWhere} AND created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      alertsParams
    );
    const [bySource] = await pool.execute(
      `SELECT source, COUNT(*) AS total FROM alerts WHERE ${alertsWhere} GROUP BY source`,
      alertsParams
    );
    const [hotspots] = await pool.execute(
      `SELECT ROUND(al.lat, 3) AS lat, ROUND(al.lng, 3) AS lng, COUNT(*) AS intensity
       FROM alert_locations al
       JOIN alerts a ON a.id = al.alert_id
       WHERE ${hotspotWhere}
       GROUP BY ROUND(al.lat, 3), ROUND(al.lng, 3)
       ORDER BY intensity DESC
       LIMIT 50`,
      hotspotParams
    );
    const [avgTime] = await pool.execute(
      `SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, created_at, closed_at)), 1) AS avg_minutes
       FROM alerts
       WHERE ${alertsWhere} AND status = 'CLOSED' AND closed_at IS NOT NULL`,
      alertsParams
    );
    const [total] = await pool.execute(
      `SELECT COUNT(*) AS total FROM alerts WHERE ${alertsWhere}`,
      alertsParams
    );

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
    const userIds = await _getScopeUserIds(req.user.id);
    const ph = userIds.map(() => "?").join(",");

    const page      = Math.max(1, parseInt(req.query.page  ?? 1));
    const limit     = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 30)));
    const offset    = (page - 1) * limit;
    const eventType = req.query.event_type?.toUpperCase();

    // ADMIN ve todo, los demás ven solo su scope
    const isAdmin = req.user.role === "ADMIN";

    const conditions = isAdmin ? ["1=1"] : [`(al.user_id IN (${ph}) OR al.user_id IS NULL)`];
    const params     = isAdmin ? [] : [...userIds];

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
        metadata:    r.metadata ?? null,
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

/* ═══════════════════════════ FAMILY ═══════════════════════════ */

app.post("/api/v1/family/create", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: "MISSING_FIELDS" });

    const [existing] = await pool.execute(
      `SELECT id FROM users WHERE id = :userId AND family_group_id IS NOT NULL LIMIT 1`,
      { userId }
    );
    if (existing.length)
      return res.status(409).json({ error: "ALREADY_IN_GROUP" });

    // Aquí manda llamar a nuestra nueva función de 8 dígitos
    const invite_code = generateInviteCode();

    const [ins] = await pool.execute(
      `INSERT INTO family_groups (name, owner_id, invite_code)
       VALUES (:name, :userId, :invite_code)`,
      { name: name.trim(), userId, invite_code }
    );
    const groupId = ins.insertId;

    await pool.execute(
      `UPDATE users SET role = 'JEFE_FAMILIA', family_group_id = :groupId WHERE id = :userId`,
      { groupId, userId }
    );

    await auditLog("FAMILY_CREATE", userId, `Grupo familiar creado: ${name}`, { groupId, invite_code });

    // Retorna el código al frontend para que lo muestre inmediatamente
    return res.status(201).json({ ok: true, group_id: groupId, invite_code });
  } catch (e) {
    console.error("[Family/Create]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/family/join
 * Une al usuario autenticado a un grupo familiar usando el código de invitación.
 * Body: { invite_code }
 */
app.post("/api/v1/family/join", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { invite_code } = req.body || {};

    if (!invite_code?.trim())
      return res.status(400).json({ error: "MISSING_FIELDS" });

    // Verificar que el usuario no esté ya en un grupo
    const [userRows] = await pool.execute(
      `SELECT family_group_id FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    if (userRows[0]?.family_group_id)
      return res.status(409).json({ error: "ALREADY_IN_GROUP" });

    // Buscar el grupo por código de invitación
    const [groupRows] = await pool.execute(
      `SELECT id FROM family_groups WHERE invite_code = :invite_code LIMIT 1`,
      { invite_code: invite_code.trim() }
    );
    if (!groupRows.length)
      return res.status(404).json({ error: "INVALID_CODE" });

    const groupId = groupRows[0].id;

    // Verificar que el grupo no esté lleno (máximo 6 miembros)
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users WHERE family_group_id = :groupId`,
      { groupId }
    );
    if (Number(countRows[0].total) >= 6)
      return res.status(409).json({ error: "GROUP_FULL" });

    // Unir al usuario al grupo
    await pool.execute(
      `UPDATE users SET role = 'MIEMBRO', family_group_id = :groupId WHERE id = :userId`,
      { groupId, userId }
    );

    await auditLog("FAMILY_JOIN", userId, `Usuario #${userId} se unió al grupo #${groupId}`, { groupId });

    // Emitir nuevo token con el rol actualizado
    const [[updatedUser]] = await pool.execute(
      `SELECT id, email, full_name, role FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const access_token = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, fullName: updatedUser.full_name, role: updatedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ ok: true, group_id: groupId, access_token });
  } catch (e) {
    console.error("[Family/Join]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.get("/api/v1/family", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.execute(
      `SELECT family_group_id, role FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const u = userRows[0];
    if (!u?.family_group_id) return res.json({ group: null });

    const [groupRows] = await pool.execute(
      `SELECT id, name, invite_code, created_at, owner_id FROM family_groups WHERE id = :id LIMIT 1`,
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
        invite_code: group.invite_code,
        owner_id:    group.owner_id,
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

app.delete("/api/v1/family/members/:id", authRequired, async (req, res) => {
  try {
    const userId   = req.user.id;
    const memberId = Number(req.params.id);

    const [jefeRows] = await pool.execute(
      `SELECT role, family_group_id FROM users WHERE id = :userId LIMIT 1`,
      { userId }
    );
    const jefe = jefeRows[0];
    if (jefe?.role !== "JEFE_FAMILIA")
      return res.status(403).json({ error: "FORBIDDEN" });

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

/* ═══════════════════════════ CONTACTOS DE EMERGENCIA ═══════════════════════════ */

/**
 * GET /api/v1/contacts  (JWT)
 * Devuelve los contactos de emergencia del usuario.
 */
app.get("/api/v1/contacts", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, phone, channel, created_at
       FROM emergency_contacts WHERE user_id = :userId ORDER BY created_at ASC`,
      { userId: req.user.id }
    );
    return res.json({ contacts: rows });
  } catch (e) {
    console.error("[Contacts/Get]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * POST /api/v1/contacts  (JWT)
 * Agrega un contacto de emergencia. Máximo 5 por usuario.
 * Body: { name, phone, channel }
 */
app.post("/api/v1/contacts", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone } = req.body || {};

    if (!name?.trim() || !phone?.trim())
      return res.status(400).json({ error: "MISSING_FIELDS" });

    // Límite de 5 contactos por usuario
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM emergency_contacts WHERE user_id = :userId`,
      { userId }
    );
    if (Number(countRows[0].total) >= 5)
      return res.status(409).json({ error: "MAX_CONTACTS_REACHED" });

    const [ins] = await pool.execute(
      `INSERT INTO emergency_contacts (user_id, name, phone, channel)
       VALUES (:userId, :name, :phone, 'WHATSAPP')`,
      { userId, name: name.trim(), phone: phone.trim() }
    );

    return res.status(201).json({ ok: true, id: ins.insertId });
  } catch (e) {
    console.error("[Contacts/Create]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/v1/contacts/:id  (JWT)
 * Elimina un contacto de emergencia.
 */
app.delete("/api/v1/contacts/:id", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const id     = Number(req.params.id);

    await pool.execute(
      `DELETE FROM emergency_contacts WHERE id = :id AND user_id = :userId`,
      { id, userId }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Contacts/Delete]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/v1/contacts/:id  (JWT)
 * Edita un contacto de emergencia.
 * Body: { name, phone }
 */
app.patch("/api/v1/contacts/:id", authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const id     = Number(req.params.id);
    const { name, phone } = req.body || {};

    if (!name?.trim() || !phone?.trim())
      return res.status(400).json({ error: "MISSING_FIELDS" });

    await pool.execute(
      `UPDATE emergency_contacts SET name = :name, phone = :phone
       WHERE id = :id AND user_id = :userId`,
      { name: name.trim(), phone: phone.trim(), id, userId }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Contacts/Update]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// ── Middleware solo para ADMIN ───────────────────────────────────
function adminRequired(req, res, next) {
  if (req.user?.role !== "ADMIN")
    return res.status(403).json({ error: "FORBIDDEN" });
  next();
}

/**
 * GET /api/v1/admin/overview
 * Métricas globales del sistema
 */
app.get("/api/v1/admin/overview", authRequired, adminRequired, async (req, res) => {
  try {
    const [[users]]   = await pool.execute(`SELECT COUNT(*) AS total FROM users`);
    const [[groups]]  = await pool.execute(`SELECT COUNT(*) AS total FROM family_groups`);
    const [[devices]] = await pool.execute(`SELECT COUNT(*) AS total FROM devices`);
    const [[alerts]]  = await pool.execute(`SELECT COUNT(*) AS total FROM alerts`);
    const [[active]]  = await pool.execute(
      `SELECT COUNT(*) AS total FROM alerts WHERE status IN ('ACTIVE','RECEIVED')`
    );

    const [recent] = await pool.execute(
      `SELECT a.id, a.status, a.source, a.created_at,
              u.full_name AS user_name,
              fg.name AS group_name
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN users ug ON ug.id = a.user_id
       LEFT JOIN family_groups fg ON fg.id = ug.family_group_id
       ORDER BY a.created_at DESC
       LIMIT 5`
    );

    return res.json({
      totals: {
        users:   users.total,
        groups:  groups.total,
        devices: devices.total,
        alerts:  alerts.total,
        activeAlerts: active.total,
      },
      recent,
    });
  } catch (e) {
    console.error("[Admin/Overview]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/admin/users
 * Todos los usuarios del sistema
 */
app.get("/api/v1/admin/users", authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.role, u.verified, u.created_at,
              fg.name AS group_name
       FROM users u
       LEFT JOIN family_groups fg ON fg.id = u.family_group_id
       ORDER BY u.created_at DESC`
    );
    return res.json({ users: rows });
  } catch (e) {
    console.error("[Admin/Users]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/v1/admin/users/:id
 * Editar rol y nombre de usuario
 */
app.patch("/api/v1/admin/users/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { full_name, role } = req.body || {};

    const validRoles = ["MIEMBRO", "JEFE_FAMILIA", "ADMIN"];
    if (role && !validRoles.includes(role))
      return res.status(400).json({ error: "INVALID_ROLE" });

    await pool.execute(
      `UPDATE users SET
         full_name = COALESCE(:full_name, full_name),
         role      = COALESCE(:role, role)
       WHERE id = :id`,
      { full_name: full_name ?? null, role: role ?? null, id }
    );

    await auditLog("ADMIN_USER_EDIT", req.user.id,
      `Admin editó usuario #${id}`, { targetId: id, role });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Admin/Users/Edit]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/v1/admin/users/:id/password
 * Resetear contraseña de usuario
 */
app.patch("/api/v1/admin/users/:id/password", authRequired, adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body || {};

    if (!password || password.length < 6)
      return res.status(400).json({ error: "PASSWORD_TOO_SHORT" });

    const password_hash = await bcrypt.hash(password, 10);

    await pool.execute(
      `UPDATE users SET password_hash = :password_hash WHERE id = :id`,
      { password_hash, id }
    );

    await auditLog("ADMIN_PWD_RESET", req.user.id,
      `Admin reseteó contraseña de usuario #${id}`, { targetId: id });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Admin/Users/Password]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/v1/admin/users/:id
 * Eliminar usuario
 */
app.delete("/api/v1/admin/users/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // No permitir eliminar al propio admin
    if (id === req.user.id)
      return res.status(400).json({ error: "CANNOT_DELETE_SELF" });

    await pool.execute(`DELETE FROM users WHERE id = :id`, { id });

    await auditLog("ADMIN_USER_DELETE", req.user.id,
      `Admin eliminó usuario #${id}`, { targetId: id });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Admin/Users/Delete]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/admin/groups
 * Todos los grupos familiares con sus miembros
 */
app.get("/api/v1/admin/groups", authRequired, adminRequired, async (req, res) => {
  try {
    const [groups] = await pool.execute(
      `SELECT fg.id, fg.name, fg.invite_code, fg.created_at,
              u.full_name AS owner_name,
              COUNT(m.id) AS member_count
       FROM family_groups fg
       JOIN users u ON u.id = fg.owner_id
       LEFT JOIN users m ON m.family_group_id = fg.id
       GROUP BY fg.id
       ORDER BY fg.created_at DESC`
    );

    // Miembros por grupo
    for (const g of groups) {
      const [members] = await pool.execute(
        `SELECT id, full_name, email, role FROM users WHERE family_group_id = :id`,
        { id: g.id }
      );
      g.members = members;

      const [devCount] = await pool.execute(
        `SELECT COUNT(*) AS total FROM devices d
         JOIN users u ON u.id = d.user_id
         WHERE u.family_group_id = :id`,
        { id: g.id }
      );
      g.device_count = devCount[0].total;

      const [alertCount] = await pool.execute(
        `SELECT COUNT(*) AS total FROM alerts a
         JOIN users u ON u.id = a.user_id
         WHERE u.family_group_id = :id`,
        { id: g.id }
      );
      g.alert_count = alertCount[0].total;
    }

    return res.json({ groups });
  } catch (e) {
    console.error("[Admin/Groups]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/v1/admin/groups/:id
 * Disolver grupo familiar
 */
app.delete("/api/v1/admin/groups/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Quitar grupo a todos los miembros
    await pool.execute(
      `UPDATE users SET family_group_id = NULL, role = 'JEFE_FAMILIA'
       WHERE family_group_id = :id`,
      { id }
    );

    await pool.execute(`DELETE FROM family_groups WHERE id = :id`, { id });

    await auditLog("ADMIN_GROUP_DISSOLVE", req.user.id,
      `Admin disolvió grupo #${id}`, { groupId: id });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Admin/Groups/Delete]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/admin/devices
 * Todos los dispositivos del sistema
 */
app.get("/api/v1/admin/devices", authRequired, adminRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.id, d.device_uid, d.last_seen_at, d.created_at,
              u.full_name AS owner_name, u.email AS owner_email,
              fg.name AS group_name
       FROM devices d
       LEFT JOIN users u ON u.id = d.user_id
       LEFT JOIN family_groups fg ON fg.id = u.family_group_id
       ORDER BY d.created_at DESC`
    );
    return res.json({ devices: rows });
  } catch (e) {
    console.error("[Admin/Devices]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/admin/devices/metrics
 * Todos los dispositivos con métricas enriquecidas:
 *   - battery_level     (último valor reportado en alert_locations o columna dedicada)
 *   - alert_total       (total de alertas del propietario)
 *   - alert_active      (alertas en estado RECEIVED / ACTIVE / ATTENDED)
 *   - last_lat / last_lng (coords de la última alert_location del propietario)
 *
 * Se agrega ANTES del endpoint DELETE /api/v1/admin/devices/:id en server.js
 */
app.get("/api/v1/admin/devices/metrics", authRequired, adminRequired, async (req, res) => {
  try {
    // 1. Traer todos los dispositivos con datos de propietario y grupo
    const [rows] = await pool.execute(
      `SELECT
         d.id,
         d.device_uid,
         d.last_seen_at,
         d.created_at,
         /* battery_level: columna opcional; si no existe devuelve NULL */
         IF(
           (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'devices'
              AND COLUMN_NAME = 'battery_level') > 0,
           d.battery_level,
           NULL
         ) AS battery_level,
         u.id        AS user_id,
         u.full_name AS owner_name,
         u.email     AS owner_email,
         fg.name     AS group_name
       FROM devices d
       LEFT JOIN users u  ON u.id  = d.user_id
       LEFT JOIN family_groups fg ON fg.id = u.family_group_id
       ORDER BY d.created_at DESC`
    );

    // 2. Para cada dispositivo obtener métricas de alertas y última ubicación
    for (const dev of rows) {
      if (!dev.user_id) {
        dev.alert_total  = 0;
        dev.alert_active = 0;
        dev.last_lat     = null;
        dev.last_lng     = null;
        continue;
      }

      // Conteo total y activos
      const [[counts]] = await pool.execute(
        `SELECT
           COUNT(*)                                         AS total,
           SUM(status IN ('RECEIVED','ACTIVE','ATTENDED')) AS active
         FROM alerts
         WHERE user_id = :userId`,
        { userId: dev.user_id }
      );
      dev.alert_total  = counts.total  ?? 0;
      dev.alert_active = counts.active ?? 0;

      // Última ubicación registrada para este usuario
      const [[loc]] = await pool.execute(
        `SELECT al.lat, al.lng
         FROM alert_locations al
         JOIN alerts a ON a.id = al.alert_id
         WHERE a.user_id = :userId
         ORDER BY al.recorded_at DESC
         LIMIT 1`,
        { userId: dev.user_id }
      );
      dev.last_lat = loc?.lat ?? null;
      dev.last_lng = loc?.lng ?? null;

      // Limpiar campo interno antes de enviar
      delete dev.user_id;
    }

    return res.json({ devices: rows });
  } catch (e) {
    console.error("[Admin/Devices/Metrics]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * DELETE /api/v1/admin/devices/:id
 * Desvincular dispositivo
 */
app.delete("/api/v1/admin/devices/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);

    await pool.execute(`DELETE FROM devices WHERE id = :id`, { id });

    await auditLog("ADMIN_DEVICE_UNLINK", req.user.id,
      `Admin desvinculó dispositivo #${id}`, { deviceId: id });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[Admin/Devices/Delete]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/admin/alerts
 * Todas las alertas del sistema
 */
app.get("/api/v1/admin/alerts", authRequired, adminRequired, async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  ?? 1));
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit ?? 30)));
    const offset = (page - 1) * limit;
    const status = req.query.status?.toUpperCase();

    const dateFrom = req.query.date_from;
    const dateTo   = req.query.date_to;

    const conditions = ["1=1"];
    const params     = [];

    if (status && ["RECEIVED","ACTIVE","ATTENDED","CLOSED"].includes(status)) {
      conditions.push("a.status = ?");
      params.push(status);
    }
    if (dateFrom) { conditions.push("DATE(a.created_at) >= ?"); params.push(dateFrom); }
    if (dateTo)   { conditions.push("DATE(a.created_at) <= ?"); params.push(dateTo); }

    const where = conditions.join(" AND ");

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM alerts a WHERE ${where}`, params
    );

    const [rows] = await pool.execute(
      `SELECT a.id, a.status, a.source, a.created_at, a.closed_at,
              u.full_name AS user_name, u.email AS user_email,
              fg.name AS group_name,
              al.lat, al.lng
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN family_groups fg ON fg.id = u.family_group_id
       LEFT JOIN alert_locations al ON al.id = (
         SELECT id FROM alert_locations WHERE alert_id = a.id
         ORDER BY recorded_at DESC LIMIT 1
       )
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      alerts: rows,
      pagination: {
        page, limit,
        total: countRows[0].total,
        pages: Math.ceil(countRows[0].total / limit),
      },
    });
  } catch (e) {
    console.error("[Admin/Alerts]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/**
 * GET /api/v1/admin/alerts/export
 * Exporta todas las alertas filtradas (sin paginación, máx 10 000)
 */
app.get("/api/v1/admin/alerts/export", authRequired, adminRequired, async (req, res) => {
  try {
    const status   = req.query.status?.toUpperCase();
    const dateFrom = req.query.date_from;
    const dateTo   = req.query.date_to;

    const conditions = ["1=1"];
    const params     = [];

    if (status && ["RECEIVED","ACTIVE","ATTENDED","CLOSED"].includes(status)) {
      conditions.push("a.status = ?"); params.push(status);
    }
    if (dateFrom) { conditions.push("DATE(a.created_at) >= ?"); params.push(dateFrom); }
    if (dateTo)   { conditions.push("DATE(a.created_at) <= ?"); params.push(dateTo); }

    const where = conditions.join(" AND ");

    const [rows] = await pool.execute(
      `SELECT a.id, a.status, a.source, a.created_at, a.closed_at,
              u.full_name AS user_name, u.email AS user_email,
              fg.name AS group_name,
              al.lat, al.lng
       FROM alerts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN family_groups fg ON fg.id = u.family_group_id
       LEFT JOIN alert_locations al ON al.id = (
         SELECT id FROM alert_locations WHERE alert_id = a.id
         ORDER BY recorded_at DESC LIMIT 1
       )
       WHERE ${where}
       ORDER BY a.created_at DESC
       LIMIT 10000`,
      params
    );
    return res.json({ alerts: rows });
  } catch (e) {
    console.error("[Admin/Alerts/Export]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ══════════════════════ USER / CHANGE PASSWORD ══════════════════════ */

/**
 * PUT /api/v1/user/change-password
 * Cambia la contraseña del usuario autenticado.
 * Body: { currentPassword, newPassword }
 */
app.put("/api/v1/user/change-password", authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "MISSING_FIELDS" });

    if (newPassword.length < 6)
      return res.status(400).json({ error: "PASSWORD_TOO_SHORT" });

    const [[user]] = await pool.execute(
      "SELECT id, password_hash FROM users WHERE id = :id",
      { id: req.user.id }
    );

    if (!user)
      return res.status(404).json({ error: "USER_NOT_FOUND" });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match)
      return res.status(401).json({ error: "WRONG_CURRENT_PASSWORD" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      "UPDATE users SET password_hash = :hash WHERE id = :id",
      { hash: newHash, id: req.user.id }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[User/ChangePassword]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ HEATMAP COMUNITARIO ═══════════════════════════ */

app.get("/api/v1/heatmap", authRequired, async (req, res) => {
  try {
    const [hotspots] = await pool.execute(
      `SELECT 
         ROUND(al.lat, 3) AS lat, 
         ROUND(al.lng, 3) AS lng, 
         COUNT(*) AS intensity
       FROM alert_locations al
       -- Quitamos el JOIN con alerts para que lea TODO lo que hay en la tabla
       GROUP BY ROUND(al.lat, 3), ROUND(al.lng, 3)
       ORDER BY intensity DESC
       LIMIT 500`
    );
    return res.json({ hotspots });
  } catch (e) {
    console.error("[Heatmap]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ TICKETS ═══════════════════════════ */

const TICKET_TYPES = [
  "REMOVE_FROM_GROUP", "DELETE_DATA", "CHANGE_NAME",
  "CHANGE_PASSWORD", "BUG_REPORT", "OTHER",
];

// Crear tabla al iniciar si no existe (pool.query para DDL, no execute)
pool.query(`
  CREATE TABLE IF NOT EXISTS tickets (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    type         VARCHAR(50) NOT NULL,
    description  TEXT,
    status       ENUM('OPEN','IN_PROGRESS','CLOSED') DEFAULT 'OPEN',
    admin_note   TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).catch((e) => console.error("[Tickets/Init]", e));

// Crear ticket
app.post("/api/v1/tickets", authRequired, async (req, res) => {
  try {
    const { type, description } = req.body || {};
    if (!type || !TICKET_TYPES.includes(type))
      return res.status(400).json({ error: "INVALID_TYPE" });

    const [r] = await pool.execute(
      `INSERT INTO tickets (user_id, type, description) VALUES (:userId, :type, :description)`,
      { userId: req.user.id, type, description: description?.trim() || null }
    );
    await auditLog("TICKET_CREATED", req.user.id,
      `Ticket #${r.insertId} (${type})`, { ticketId: r.insertId });
    return res.status(201).json({ ticket_id: r.insertId });
  } catch (e) {
    console.error("[Tickets/Create]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// Mis tickets
app.get("/api/v1/tickets/mine", authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, type, description, status, admin_note, created_at
       FROM tickets WHERE user_id = :userId ORDER BY created_at DESC LIMIT 10`,
      { userId: req.user.id }
    );
    return res.json({ tickets: rows });
  } catch (e) {
    console.error("[Tickets/Mine]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// Admin: ver todos los tickets
app.get("/api/v1/admin/tickets", authRequired, adminRequired, async (req, res) => {
  try {
    const status = req.query.status?.toUpperCase();
    const validStatus = ["OPEN","IN_PROGRESS","CLOSED"].includes(status ?? "");
    const where  = validStatus ? "WHERE t.status = :status" : "";
    const params = validStatus ? { status } : {};

    const [rows] = await pool.execute(
      `SELECT t.id, t.type, t.description, t.status, t.admin_note, t.created_at, t.updated_at,
              u.full_name AS user_name, u.email AS user_email
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       ${where}
       ORDER BY FIELD(t.status,'OPEN','IN_PROGRESS','CLOSED'), t.created_at DESC`,
      params
    );
    return res.json({ tickets: rows });
  } catch (e) {
    console.error("[Admin/Tickets]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

// Admin: actualizar ticket
app.patch("/api/v1/admin/tickets/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, admin_note } = req.body || {};
    if (!id) return res.status(400).json({ error: "INVALID_ID" });
    if (status && !["OPEN","IN_PROGRESS","CLOSED"].includes(status))
      return res.status(400).json({ error: "INVALID_STATUS" });

    await pool.execute(
      `UPDATE tickets
       SET status     = COALESCE(:status, status),
           admin_note = COALESCE(:adminNote, admin_note)
       WHERE id = :id`,
      { status: status ?? null, adminNote: admin_note ?? null, id }
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("[Admin/Tickets/Update]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ DELETE ACCOUNT ═══════════════════════════ */

app.delete("/api/v1/user/account", authRequired, async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: "MISSING_FIELDS" });

    const [[user]] = await pool.execute(
      `SELECT password_hash FROM users WHERE id = :id LIMIT 1`, { id: req.user.id }
    );
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "WRONG_PASSWORD" });

    await auditLog("USER_SELF_DELETE", req.user.id,
      `Usuario #${req.user.id} eliminó su cuenta`, {});
    await pool.execute(`DELETE FROM users WHERE id = :id`, { id: req.user.id });
    return res.json({ ok: true });
  } catch (e) {
    console.error("[User/DeleteAccount]", e);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ═══════════════════════════ START ═══════════════════════════ */

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ SIGMAFAM API running → http://localhost:${PORT}`);
});